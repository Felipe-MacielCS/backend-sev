import ical from "node-ical";
import db from "../models/index.js";
import {
  getStudentScheduleConfig,
  syncStudentScheduleForUser,
} from "../services/studentSchedule.service.js";

const Unavailable = db.unavailable;
const Settings = db.settings;
const SettingsValues = db.settingsvalues;

const CALENDAR_ICAL_SETTING_KEY = "google_calendar_ical_url";
const CALENDAR_SYNC_TIME_ZONE =
  process.env.APP_TIMEZONE || process.env.TZ || "America/Chicago";
const RECURRING_IMPORT_FALLBACK_DAYS = 365;

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
      label: "Calendar Feed iCal URL",
      value_type: "string",
      default_value: null,
      description: "iCal or ICS feed URL used for worker availability sync.",
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

const getDatePartsInTimeZone = (dateObj, timeZone = CALENDAR_SYNC_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
};

const dateToSqlDate = (dateObj, timeZone = CALENDAR_SYNC_TIME_ZONE) => {
  const parts = getDatePartsInTimeZone(dateObj, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const dateToSqlTime = (dateObj, timeZone = CALENDAR_SYNC_TIME_ZONE) => {
  const parts = getDatePartsInTimeZone(dateObj, timeZone);
  return `${parts.hour}:${parts.minute}:${parts.second}`;
};

const normalizeUserID = (value) => Number.parseInt(value, 10);

const expandCalendarEvents = (eventsMap) => {
  const expanded = [];

  for (const event of Object.values(eventsMap)) {
    if (event?.type !== "VEVENT") continue;

    if (event.rrule && event.start instanceof Date && !Number.isNaN(event.start.getTime())) {
      const from = new Date(event.start.getTime());
      const until = event.rrule?.options?.until;
      const to =
        until instanceof Date && !Number.isNaN(until.getTime())
          ? until
          : new Date(event.start.getTime() + RECURRING_IMPORT_FALLBACK_DAYS * 24 * 60 * 60 * 1000);

      try {
        const instances = ical.expandRecurringEvent(event, {
          from,
          to,
          includeOverrides: true,
          excludeExdates: true,
          expandOngoing: true,
        });

        if (Array.isArray(instances) && instances.length) {
          instances.forEach((instance, index) => {
            expanded.push({
              ...event,
              ...instance,
              uid: `${event.uid || "recurring-event"}:${instance.start?.toISOString?.() || index}`,
            });
          });
          continue;
        }
      } catch (error) {
        console.error("Recurring event expansion failed:", error);
      }
    }

    expanded.push(event);
  }

  return expanded;
};

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
      message: "Calendar feed URL saved successfully.",
    });
  } catch (error) {
    console.error("Calendar connect error:", error);
    return res.status(500).send({ message: "Failed to save calendar feed connection." });
  }
};

exportsObj.syncCalendar = async (req, res) => {
  try {
    const userID = normalizeUserID(req.body.userID);
    const inputUrl = normalizeIcalUrl(req.body.icalUrl);
    const inputIcalData =
      typeof req.body.icalData === "string" ? req.body.icalData.trim() : "";
    const skipAllDay = req.body.skipAllDay === true;
    const minDurationMinutes = Math.max(0, Number.parseInt(req.body.minDurationMinutes ?? 0, 10) || 0);
    const defaultNoPeriodDurationMinutes = Math.max(1, Number.parseInt(req.body.defaultNoPeriodDurationMinutes ?? 30, 10) || 30);
    const defaultAllDayDurationMinutes = Math.max(1, Number.parseInt(req.body.defaultAllDayDurationMinutes ?? 1440, 10) || 1440);

    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }

    const icalUrl = inputUrl || (await getSavedIcalUrlForUser(userID));
    const hasIcalData = Boolean(inputIcalData);
    const hasIcalUrl = Boolean(icalUrl);

    if (!hasIcalData && !hasIcalUrl) {
      return res.status(400).send({ message: "No calendar feed found. Upload an .ics file or link a feed first." });
    }
    if (hasIcalUrl && !isHttpUrl(icalUrl)) {
      return res.status(400).send({ message: "Saved iCal URL is invalid." });
    }

    const events = hasIcalData
      ? await ical.async.parseICS(inputIcalData)
      : await ical.async.fromURL(icalUrl);
    const parsedEvents = expandCalendarEvents(events);
    const formattedEvents = [];
    let veventCount = 0;
    let skippedPastCount = 0;
    let skippedAllDayCount = 0;
    let skippedInvalidCount = 0;
    let skippedNoPeriodCount = 0;
    let skippedShortDurationCount = 0;
    let importedAssumedPeriodCount = 0;
    const todaySqlDate = dateToSqlDate(new Date(), CALENDAR_SYNC_TIME_ZONE);

    // Delete previous Google imports to avoid duplicates.
    await Unavailable.destroy({ where: { userID, reason: "Google Sync" } });

    for (const event of parsedEvents) {
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

      const start_date = dateToSqlDate(startDate);
      const end_date = dateToSqlDate(endDate);
      const start_time = dateToSqlTime(startDate);
      const end_time = dateToSqlTime(endDate);

      // For uploaded ICS files, import every VEVENT from the file.
      // For linked feeds, keep the current "today forward" behavior.
      if (
        !hasIcalData &&
        (
          end_date < todaySqlDate ||
          (end_date === todaySqlDate && end_time <= "00:00:00")
        )
      ) {
        skippedPastCount += 1;
        continue;
      }

      // Optional floor to avoid tiny reminder-style blocks.
      if (durationMinutes < minDurationMinutes) {
        skippedShortDurationCount += 1;
        continue;
      }

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
        start: `${start_date}T${start_time}`,
        end: `${end_date}T${end_time}`,
        color: "#F44336",
        display: "block",
      });
    }

    return res.send({
      imported: formattedEvents.length,
      events: formattedEvents,
      stats: {
        vevents: veventCount,
        skippedPast: skippedPastCount,
        skippedAllDay: skippedAllDayCount,
        skippedInvalid: skippedInvalidCount,
        skippedNoPeriod: skippedNoPeriodCount,
        skippedShortDuration: skippedShortDurationCount,
        minDurationMinutes,
        assumedNoPeriod: importedAssumedPeriodCount,
        defaultNoPeriodDurationMinutes,
        defaultAllDayDurationMinutes,
        timeZone: CALENDAR_SYNC_TIME_ZONE,
      },
      message: "Calendar sync complete.",
    });
  } catch (error) {
    console.error("Calendar Sync Error:", error);
    return res.status(500).send({ message: "Failed to import calendar feed." });
  }
};

exportsObj.studentStatus = async (req, res) => {
  try {
    const userID = normalizeUserID(req.query.userID);
    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }

    const config = await getStudentScheduleConfig(userID);
    return res.send(config);
  } catch (error) {
    console.error("Student schedule status error:", error);
    return res.status(500).send({ message: "Failed to load student schedule status." });
  }
};

exportsObj.syncStudentSchedule = async (req, res) => {
  try {
    const userID = normalizeUserID(req.body.userID);
    if (!userID) {
      return res.status(400).send({ message: "Missing user ID." });
    }

    const result = await syncStudentScheduleForUser(userID, {
      termCode: req.body.termCode,
    });

    if (!result.configured) {
      return res.status(400).send({ message: "No email is available for this worker." });
    }

    return res.send(result);
  } catch (error) {
    console.error("Student schedule sync error:", error);
    return res.status(500).send({
      message: error?.message || "Failed to import student schedule.",
    });
  }
};

export default exportsObj;





