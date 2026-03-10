import ical from "node-ical";
import db from "../models/index.js";

const Unavailable = db.unavailable;
const Settings = db.settings;
const SettingsValues = db.settingsvalues;

const CALENDAR_ICAL_SETTING_KEY = "google_calendar_ical_url";

const exportsObj = {};

const normalizeIcalUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("webcal://")) {
    return `https://${trimmed.slice("webcal://".length)}`;
  }
  return trimmed;
};

const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const getOrCreateCalendarUrlSetting = async () => {
  let setting = await Settings.findOne({
    where: { key: CALENDAR_ICAL_SETTING_KEY },
  });

  if (!setting) {
    setting = await Settings.create({
      key: CALENDAR_ICAL_SETTING_KEY,
      label: "Google Calendar iCal URL",
      value_type: "string",
      default_value: null,
      description: "Private iCal feed URL used for worker Google Calendar sync.",
      is_active: true,
    });
  }
  return setting;
};

const getSavedIcalUrlForUser = async (userID) => {
  const setting = await Settings.findOne({
    where: { key: CALENDAR_ICAL_SETTING_KEY },
  });
  if (!setting) return "";

  const row = await SettingsValues.findOne({
    where: {
      settingID: setting.ID,
      userID,
    },
  });
  return row?.value || "";
};

const saveIcalUrlForUser = async (userID, icalUrl) => {
  const setting = await getOrCreateCalendarUrlSetting();
  const existing = await SettingsValues.findOne({
    where: {
      settingID: setting.ID,
      userID,
    },
  });

  if (existing) {
    existing.value = icalUrl;
    await existing.save();
    return existing;
  }

  return SettingsValues.create({
    settingID: setting.ID,
    userID,
    value: icalUrl,
  });
};

const isAllDayEvent = (event, startDate, endDate) => {
  if (event.datetype === "date") return true;
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) return false;
  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) return false;

  const startsAtMidnight =
    startDate.getHours() === 0 &&
    startDate.getMinutes() === 0 &&
    startDate.getSeconds() === 0;
  const endsAtMidnight =
    endDate.getHours() === 0 &&
    endDate.getMinutes() === 0 &&
    endDate.getSeconds() === 0;
  const durationMs = endDate.getTime() - startDate.getTime();

  // Google all-day VEVENTs are usually midnight-to-midnight.
  return startsAtMidnight && endsAtMidnight && durationMs >= 23 * 60 * 60 * 1000;
};

const dateToSqlDate = (dateObj) => dateObj.toISOString().split("T")[0];
const dateToSqlTime = (dateObj) => dateObj.toISOString().split("T")[1].substring(0, 8);

const normalizeUserID = (value) => Number.parseInt(value, 10);

exportsObj.status = async (req, res) => {
  try {
    const userID = normalizeUserID(req.query.userID);
    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }

    const icalUrl = await getSavedIcalUrlForUser(userID);
    return res.send({
      connected: Boolean(icalUrl),
      icalUrl: icalUrl || "",
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return res.status(500).send({ message: "Failed to load calendar connection status." });
  }
};

exportsObj.connect = async (req, res) => {
  try {
    const userID = normalizeUserID(req.body.userID);
    const icalUrl = normalizeIcalUrl(req.body.icalUrl);

    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }
    if (!icalUrl) {
      return res.status(400).send({ message: "Missing iCal URL." });
    }
    if (!isHttpUrl(icalUrl)) {
      return res.status(400).send({ message: "iCal URL must start with http:// or https:// (or webcal://)." });
    }

    await saveIcalUrlForUser(userID, icalUrl);

    return res.send({
      connected: true,
      icalUrl,
      message: "Google Calendar iCal URL saved successfully.",
    });
  } catch (error) {
    console.error("Calendar connect error:", error);
    return res.status(500).send({ message: "Failed to save Google Calendar connection." });
  }
};

exportsObj.syncCalendar = async (req, res) => {
  try {
    const userID = normalizeUserID(req.body.userID);
    const inputUrl = normalizeIcalUrl(req.body.icalUrl);
    const skipAllDay = req.body.skipAllDay === true;
    const minDurationMinutes = Math.max(0, Number.parseInt(req.body.minDurationMinutes ?? 0, 10) || 0);
    const defaultNoPeriodDurationMinutes = Math.max(1, Number.parseInt(req.body.defaultNoPeriodDurationMinutes ?? 30, 10) || 30);
    const defaultAllDayDurationMinutes = Math.max(1, Number.parseInt(req.body.defaultAllDayDurationMinutes ?? 1440, 10) || 1440);

    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }

    const icalUrl = inputUrl || (await getSavedIcalUrlForUser(userID));
    if (!icalUrl) {
      return res.status(400).send({ message: "No linked iCal URL found. Link your Google Calendar first." });
    }
    if (!isHttpUrl(icalUrl)) {
      return res.status(400).send({ message: "Saved iCal URL is invalid." });
    }

    const events = await ical.async.fromURL(icalUrl);
    const formattedEvents = [];
    let veventCount = 0;
    let skippedAllDayCount = 0;
    let skippedInvalidCount = 0;
    let skippedNoPeriodCount = 0;
    let skippedShortDurationCount = 0;
    let importedAssumedPeriodCount = 0;

    // Delete previous Google imports to avoid duplicates.
    await Unavailable.destroy({ where: { userID, reason: "Google Sync" } });

    for (const event of Object.values(events)) {
      if (event.type !== "VEVENT") continue;
      veventCount += 1;

      const startDate = new Date(event.start);
      let endDate = new Date(event.end);
      const startIsValid = !Number.isNaN(startDate.getTime());
      const endIsValid = !Number.isNaN(endDate.getTime());
      if (!startIsValid) {
        skippedInvalidCount += 1;
        continue;
      }

      if (skipAllDay && isAllDayEvent(event, startDate, endDate)) {
        skippedAllDayCount += 1;
        continue;
      }

      let durationMinutes = endIsValid ? (endDate.getTime() - startDate.getTime()) / 60000 : -1;

      // Some feeds include DTSTART without a usable DTEND for timed items.
      // Import those as a short default block instead of discarding them.
      if (durationMinutes <= 0) {
        const fallbackDurationMinutes = event.datetype === "date"
          ? defaultAllDayDurationMinutes
          : defaultNoPeriodDurationMinutes;
        endDate = new Date(startDate.getTime() + fallbackDurationMinutes * 60000);
        durationMinutes = fallbackDurationMinutes;
        importedAssumedPeriodCount += 1;
      }

      // Optional floor to avoid tiny reminder-style blocks.
      if (durationMinutes < minDurationMinutes) {
        skippedShortDurationCount += 1;
        continue;
      }

      const start_date = dateToSqlDate(startDate);
      const end_date = dateToSqlDate(endDate);
      const start_time = dateToSqlTime(startDate);
      const end_time = dateToSqlTime(endDate);

      const newDbBlock = await Unavailable.create({
        userID,
        start_date,
        end_date,
        start_time,
        end_time,
        reason: "Google Sync",
      });

      formattedEvents.push({
        id: newDbBlock.ID,
        title: "Unavailable",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        color: "#F44336",
        display: "block",
      });
    }

    return res.send({
      imported: formattedEvents.length,
      events: formattedEvents,
      stats: {
        vevents: veventCount,
        skippedAllDay: skippedAllDayCount,
        skippedInvalid: skippedInvalidCount,
        skippedNoPeriod: skippedNoPeriodCount,
        skippedShortDuration: skippedShortDurationCount,
        minDurationMinutes,
        assumedNoPeriod: importedAssumedPeriodCount,
        defaultNoPeriodDurationMinutes,
        defaultAllDayDurationMinutes,
      },
      message: "Calendar sync complete.",
    });
  } catch (error) {
    console.error("Calendar Sync Error:", error);
    return res.status(500).send({ message: "Failed to parse calendar feed." });
  }
};

export default exportsObj;




