/** Calendar date YYYY-MM-DD in Asia/Ulaanbaatar. */
function mongoliaDateString(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}

/** Inclusive UTC range for one calendar day in Mongolia (UTC+8, no DST). */
function mongoliaDayBounds(dayStr = mongoliaDateString()) {
  const start = new Date(`${dayStr}T00:00:00+08:00`);
  const end = new Date(`${dayStr}T23:59:59.999+08:00`);
  return { dayStr, start, end };
}

module.exports = { mongoliaDateString, mongoliaDayBounds };
