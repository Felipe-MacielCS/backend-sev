import db from "../models/index.js";

const Settings = db.settings;
const SettingsValues = db.settingsvalues;
const Unavailable = db.unavailable;
const { Op } = db.Sequelize;

export const STUDENT_ID_SETTING_KEY = "oc_student_id";
export const STUDENT_SCHEDULE_REASON_PREFIX = "Student Schedule";

const STUDENT_ID_SETTING = {
  key: STUDENT_ID_SETTING_KEY,
  label: "OC Student ID",
  value_type: "string",
  default_value: "",
  description: "Oklahoma Christian student ID used to import class times into worker unavailability.",
  is_active: true,
};

const STUDENT_SCHEDULE_API_BASE_URL =
  process.env.OC_STUDENT_SCHEDULE_API_BASE_URL ||
  "https://stingray.oc.edu/api/accommodationuserschedule";
const REQUEST_TIMEOUT_MS = Math.max(
  1000,
  Number.parseInt(process.env.OC_STUDENT_SCHEDULE_TIMEOUT_MS ?? 12000, 10) || 12000
);
const APP_TIME_ZONE = process.env.APP_TIMEZONE || process.env.TZ || "America/Chicago";

const DIRECT_START_DATETIME_KEYS = [
  "startdatetime",
  "start_datetime",
  "start",
  "meetingstartdatetime",
  "meeting_start_datetime",
  "meetingstart",
  "meeting_start",
  "classstartdatetime",
  "class_start_datetime",
  "classstart",
  "class_start",
];

const DIRECT_END_DATETIME_KEYS = [
  "enddatetime",
  "end_datetime",
  "end",
  "meetingenddatetime",
  "meeting_end_datetime",
  "meetingend",
  "meeting_end",
  "classenddatetime",
  "class_end_datetime",
  "classend",
  "class_end",
];

const SINGLE_DATE_KEYS = [
  "date",
  "meetingdate",
  "meeting_date",
  "classdate",
  "class_date",
];

const RANGE_START_DATE_KEYS = [
  "startdate",
  "start_date",
  "meetingstartdate",
  "meeting_start_date",
  "classstartdate",
  "class_start_date",
  "coursestartdate",
  "course_start_date",
  "sectionstartdate",
  "section_start_date",
  "begindate",
  "begin_date",
];

const RANGE_END_DATE_KEYS = [
  "enddate",
  "end_date",
  "meetingenddate",
  "meeting_end_date",
  "classenddate",
  "class_end_date",
  "courseenddate",
  "course_end_date",
  "sectionenddate",
  "section_end_date",
];

const START_TIME_KEYS = [
  "starttime",
  "start_time",
  "meetingstarttime",
  "meeting_start_time",
  "classstarttime",
  "class_start_time",
  "begintime",
  "begin_time",
];

const END_TIME_KEYS = [
  "endtime",
  "end_time",
  "meetingendtime",
  "meeting_end_time",
  "classendtime",
  "class_end_time",
];

const DAY_KEYS = [
  "days",
  "meetingdays",
  "meeting_days",
  "daysofweek",
  "days_of_week",
  "weekdays",
  "weekday",
  "day",
];

const TITLE_KEYS = [
  "title",
  "coursetitle",
  "course_title",
  "coursename",
  "course_name",
  "classname",
  "class_name",
  "sectiontitle",
  "section_title",
  "sectionname",
  "section_name",
  "subject",
  "subjectcode",
  "subject_code",
  "coursenumber",
  "course_number",
  "section",
  "courseid",
  "course_id",
];

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === "[object Object]";

export const normalizeStudentID = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\D+/g, "");

const normalizeTermCode = (value) => {
  const normalized = String(value ?? "").trim().toUpperCase();
  return /^\d{4}(SP|SU|FA)$/.test(normalized) ? normalized : "";
};

export const getCurrentTermCode = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month <= 5) return `${year}SP`;
  if (month <= 7) return `${year}SU`;
  return `${year}FA`;
};

const createLowerCaseLookup = (record) =>
  Object.entries(record || {}).reduce((acc, [key, value]) => {
    acc[String(key).trim().toLowerCase()] = value;
    return acc;
  }, {});

const pickValue = (lookup, keys) => {
  for (const key of keys) {
    const value = lookup[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
};

const formatSqlDate = (year, month, day) =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseDateValue = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatSqlDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return formatSqlDate(usMatch[3], usMatch[1], usMatch[2]);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return formatSqlDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return "";
};

const normalizeDateTimeTuple = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      start_date: formatSqlDate(value.getFullYear(), value.getMonth() + 1, value.getDate()),
      start_time: normalizeTimeValue(value),
    };
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const directMatch = raw.match(
    /^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)$/
  );
  if (directMatch) {
    return {
      start_date: directMatch[1],
      start_time: normalizeTimeValue(directMatch[2]),
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    start_date: formatSqlDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()),
    start_time: normalizeTimeValue(parsed),
  };
};

function normalizeTimeValue(value) {
  if (!value && value !== 0) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(
      2,
      "0"
    )}:${String(value.getSeconds()).padStart(2, "0")}`;
  }

  let raw = String(value).trim().toUpperCase().replace(/\./g, "");
  if (!raw) return "";

  const compact = raw.match(/^(\d{1,2})(\d{2})$/);
  if (compact) {
    raw = `${compact[1]}:${compact[2]}`;
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return "";

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const second = Number.parseInt(match[3] || "0", 10);
  const meridian = match[4] || "";

  if (meridian === "AM" && hour === 12) hour = 0;
  if (meridian === "PM" && hour < 12) hour += 12;

  if (hour > 23 || minute > 59 || second > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(
    2,
    "0"
  )}`;
}

const buildCourseTitle = (lookup) => {
  const explicit = pickValue(lookup, TITLE_KEYS);
  if (explicit) return String(explicit).trim();

  const parts = [
    pickValue(lookup, ["subject", "subjectcode", "subject_code"]),
    pickValue(lookup, ["coursenumber", "course_number"]),
    pickValue(lookup, ["section", "sectionnumber", "section_number"]),
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);

  return parts.join(" ") || "Class";
};

const parseWeekdays = (value) => {
  const daySet = new Set();
  if (!value) return daySet;

  const addFromString = (rawValue) => {
    const raw = String(rawValue ?? "").trim();
    if (!raw) return;

    const upper = raw.toUpperCase();
    const tokenPatterns = [
      [/\bMON(?:DAY)?\b/g, 1],
      [/\bTUE(?:SDAY)?\b/g, 2],
      [/\bWED(?:NESDAY)?\b/g, 3],
      [/\bTHU(?:RSDAY)?\b|\bTH\b|\bR\b/g, 4],
      [/\bFRI(?:DAY)?\b/g, 5],
      [/\bSAT(?:URDAY)?\b/g, 6],
      [/\bSUN(?:DAY)?\b/g, 0],
    ];

    let matchedNamedToken = false;
    for (const [pattern, dayIndex] of tokenPatterns) {
      if (pattern.test(upper)) {
        matchedNamedToken = true;
        daySet.add(dayIndex);
      }
    }
    if (matchedNamedToken) return;

    const compact = upper.replace(/[^MTWRFHSU]/g, "");
    for (const char of compact) {
      if (char === "M") daySet.add(1);
      if (char === "T") daySet.add(2);
      if (char === "W") daySet.add(3);
      if (char === "R" || char === "H") daySet.add(4);
      if (char === "F") daySet.add(5);
      if (char === "S") daySet.add(6);
      if (char === "U") daySet.add(0);
    }
  };

  if (Array.isArray(value)) {
    value.forEach(addFromString);
    return daySet;
  }

  addFromString(value);
  return daySet;
};

const collectCandidateRows = (node, rows = []) => {
  if (!node) return rows;

  if (Array.isArray(node)) {
    node.forEach((entry) => collectCandidateRows(entry, rows));
    return rows;
  }

  if (!isPlainObject(node)) return rows;

  const lookup = createLowerCaseLookup(node);
  const hasMeetingLikeData = Boolean(
    pickValue(lookup, DIRECT_START_DATETIME_KEYS) ||
      pickValue(lookup, SINGLE_DATE_KEYS) ||
      (pickValue(lookup, RANGE_START_DATE_KEYS) &&
        pickValue(lookup, START_TIME_KEYS) &&
        (pickValue(lookup, DAY_KEYS) || pickValue(lookup, RANGE_END_DATE_KEYS)))
  );

  if (hasMeetingLikeData) {
    rows.push(node);
  }

  Object.values(node).forEach((value) => collectCandidateRows(value, rows));
  return rows;
};

const compareSqlDate = (left, right) => String(left || "").localeCompare(String(right || ""));

const expandRecurringMeeting = ({
  startDate,
  endDate,
  startTime,
  endTime,
  weekdays,
  title,
  todaySqlDate,
}) => {
  if (!startDate || !endDate || !startTime || !endTime || !weekdays.size) return [];
  if (compareSqlDate(endDate, startDate) < 0) return [];

  const blocks = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const lastDate = new Date(`${endDate}T00:00:00`);

  while (!Number.isNaN(cursor.getTime()) && cursor <= lastDate) {
    const sqlDate = formatSqlDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate());
    if (sqlDate >= todaySqlDate && weekdays.has(cursor.getDay())) {
      blocks.push({
        start_date: sqlDate,
        end_date: sqlDate,
        start_time: startTime,
        end_time: endTime,
        title,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return blocks;
};

const normalizeMeetingRow = (row, todaySqlDate) => {
  const lookup = createLowerCaseLookup(row);
  const title = buildCourseTitle(lookup);

  const directStart = normalizeDateTimeTuple(pickValue(lookup, DIRECT_START_DATETIME_KEYS));
  const directEnd = normalizeDateTimeTuple(pickValue(lookup, DIRECT_END_DATETIME_KEYS));

  if (directStart?.start_date && directStart?.start_time && directEnd?.start_date && directEnd?.start_time) {
    if (
      directEnd.start_date > todaySqlDate ||
      (directEnd.start_date === todaySqlDate && directEnd.start_time > "00:00:00")
    ) {
      return [
        {
          start_date: directStart.start_date,
          end_date: directEnd.start_date,
          start_time: directStart.start_time,
          end_time: directEnd.start_time,
          title,
        },
      ];
    }
    return [];
  }

  const singleDate =
    parseDateValue(pickValue(lookup, SINGLE_DATE_KEYS)) ||
    parseDateValue(pickValue(lookup, RANGE_START_DATE_KEYS));
  const singleEndDate =
    parseDateValue(pickValue(lookup, RANGE_END_DATE_KEYS)) || singleDate;
  const startTime = normalizeTimeValue(pickValue(lookup, START_TIME_KEYS));
  const endTime = normalizeTimeValue(pickValue(lookup, END_TIME_KEYS));
  const weekdays = parseWeekdays(pickValue(lookup, DAY_KEYS));

  if (singleDate && startTime && endTime && !weekdays.size) {
    if (
      singleEndDate > todaySqlDate ||
      (singleEndDate === todaySqlDate && endTime > "00:00:00")
    ) {
      return [
        {
          start_date: singleDate,
          end_date: singleEndDate,
          start_time: startTime,
          end_time: endTime,
          title,
        },
      ];
    }
    return [];
  }

  return expandRecurringMeeting({
    startDate: parseDateValue(pickValue(lookup, RANGE_START_DATE_KEYS)),
    endDate: parseDateValue(pickValue(lookup, RANGE_END_DATE_KEYS)),
    startTime,
    endTime,
    weekdays,
    title,
    todaySqlDate,
  });
};

const dedupeBlocks = (blocks) => {
  const seen = new Set();
  return blocks.filter((block) => {
    const key = [
      block.start_date,
      block.end_date,
      block.start_time,
      block.end_time,
      block.title,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeCoursePayload = (payload, todaySqlDate) => {
  const courses = Array.isArray(payload?.Courses) ? payload.Courses : [];

  return courses.flatMap((course) => {
    const courseLookup = createLowerCaseLookup(course);
    const title = buildCourseTitle(courseLookup);
    const startDate = parseDateValue(course?.start_date ?? course?.StartDate ?? courseLookup.start_date);
    const endDate = parseDateValue(course?.end_date ?? course?.EndDate ?? courseLookup.end_date);
    const meetingTimes = Array.isArray(course?.meeting_times) ? course.meeting_times : [];

    return meetingTimes.flatMap((meeting) => {
      const meetingLookup = createLowerCaseLookup(meeting);
      return expandRecurringMeeting({
        startDate,
        endDate,
        startTime: normalizeTimeValue(
          meeting?.start_time ?? meeting?.StartTime ?? pickValue(meetingLookup, START_TIME_KEYS)
        ),
        endTime: normalizeTimeValue(
          meeting?.end_time ?? meeting?.EndTime ?? pickValue(meetingLookup, END_TIME_KEYS)
        ),
        weekdays: parseWeekdays(meeting?.days ?? meeting?.Days ?? pickValue(meetingLookup, DAY_KEYS)),
        title,
        todaySqlDate,
      });
    });
  });
};

const fetchStudentSchedulePayload = async (studentID, termCode) => {
  const url = `${STUDENT_SCHEDULE_API_BASE_URL}/${encodeURIComponent(studentID)}/${encodeURIComponent(termCode)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Student schedule API request failed with status ${response.status}.`);
    }

    const bodyText = await response.text();
    if (!bodyText.trim()) return null;

    try {
      return JSON.parse(bodyText);
    } catch (error) {
      throw new Error("Student schedule API did not return valid JSON.");
    }
  } finally {
    clearTimeout(timeout);
  }
};

const buildReason = (title) =>
  title && title !== "Class"
    ? `${STUDENT_SCHEDULE_REASON_PREFIX}: ${title}`
    : STUDENT_SCHEDULE_REASON_PREFIX;

export const ensureStudentIdSetting = async () => {
  let setting = await Settings.findOne({ where: { key: STUDENT_ID_SETTING_KEY } });
  if (setting) return setting;

  setting = await Settings.create(STUDENT_ID_SETTING);
  return setting;
};

export const getStudentIdForUser = async (userID) => {
  const setting = await ensureStudentIdSetting();
  const row = await SettingsValues.findOne({
    where: {
      settingID: setting.ID,
      userID,
    },
  });

  return normalizeStudentID(row?.value);
};

export const getStudentScheduleConfig = async (userID) => {
  const studentID = await getStudentIdForUser(userID);
  return {
    configured: Boolean(studentID),
    studentID,
    termCode: getCurrentTermCode(),
    timeZone: APP_TIME_ZONE,
  };
};

export const syncStudentScheduleForUser = async (userID, options = {}) => {
  const studentID = await getStudentIdForUser(userID);
  if (!studentID) {
    return {
      configured: false,
      imported: 0,
      events: [],
      message: "No student ID saved for this worker.",
    };
  }

  const termCode = normalizeTermCode(options.termCode) || getCurrentTermCode();
  const payload = await fetchStudentSchedulePayload(studentID, termCode);
  const todaySqlDate = formatSqlDate(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );
  const parsedCourseBlocks = normalizeCoursePayload(payload, todaySqlDate);
  const candidateRows = collectCandidateRows(payload);
  const parsedBlocks = dedupeBlocks([
    ...parsedCourseBlocks,
    ...candidateRows.flatMap((row) => normalizeMeetingRow(row, todaySqlDate)),
  ]);

  await Unavailable.destroy({
    where: {
      userID,
      reason: { [Op.like]: `${STUDENT_SCHEDULE_REASON_PREFIX}%` },
    },
  });

  if (!parsedBlocks.length) {
    return {
      configured: true,
      imported: 0,
      events: [],
      termCode,
      studentID,
      stats: {
        parsedCourseBlocks: parsedCourseBlocks.length,
        candidateRows: candidateRows.length,
        parsedBlocks: 0,
      },
      message: "No class meetings were returned for the current term.",
    };
  }

  const rowsToCreate = parsedBlocks.map((block) => ({
    userID,
    start_date: block.start_date,
    end_date: block.end_date,
    start_time: block.start_time,
    end_time: block.end_time,
    reason: buildReason(block.title),
  }));

  const createdRows = await Unavailable.bulkCreate(rowsToCreate);
  const events = createdRows.map((row, index) => ({
    id: row?.ID ?? `student-sync-${index}`,
    title: "Unavailable",
    start: `${rowsToCreate[index].start_date}T${rowsToCreate[index].start_time}`,
    end: `${rowsToCreate[index].end_date}T${rowsToCreate[index].end_time}`,
    color: "#2E7D32",
    display: "block",
    reason: rowsToCreate[index].reason,
  }));

  return {
    configured: true,
    imported: rowsToCreate.length,
    events,
    termCode,
    studentID,
    stats: {
      parsedCourseBlocks: parsedCourseBlocks.length,
      candidateRows: candidateRows.length,
      parsedBlocks: rowsToCreate.length,
    },
    message: "Student schedule sync complete.",
  };
};
