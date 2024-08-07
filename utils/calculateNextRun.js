/**
 * Calculates the next run date based on a cron expression.
 *
 * @param {string} cronExpression - The cron expression in the format "minute hour dayOfMonth month dayOfWeek".
 * @return {Date} The next run date.
 */
export const calculateNextRun = (cronExpression) => {
  // Helper function to parse cron fields
  const parseCronField = (field, min, max) => {
    if (field === "*")
      return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    return field
      .split(",")
      .map((item) => {
        if (item.includes("-")) {
          const [start, end] = item.split("-").map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => i + start);
        }
        return parseInt(item, 10);
      })
      .flat()
      .filter((num) => !isNaN(num) && num >= min && num <= max)
      .sort((a, b) => a - b);
  };

  // Parse cron expression
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression
    .split(" ")
    .map((field, index) => {
      const ranges = [
        [0, 59], // minute
        [0, 23], // hour
        [1, 31], // day of month
        [1, 12], // month
        [0, 6], // day of week
      ];
      return parseCronField(field, ...ranges[index]);
    });

  const getNextDate = (currentDate, field, getUnit, setUnit, addUnit) => {
    let nextDate = new Date(currentDate);
    let currentValue = getUnit(nextDate);
    let nextValue = field.find((value) => value > currentValue);

    if (nextValue !== undefined) {
      setUnit(nextDate, nextValue);
    } else {
      setUnit(nextDate, field[0]);
      addUnit(nextDate, 1);
    }

    return nextDate;
  };

  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const getDaysInMonth = (year, month) =>
    [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      month
    ];

  let now = new Date();
  let nextRun = new Date(now);
  nextRun.setSeconds(0, 0);

  while (true) {
    nextRun = getNextDate(
      nextRun,
      minute,
      (d) => d.getMinutes(),
      (d, v) => d.setMinutes(v),
      (d, v) => d.setHours(d.getHours() + v)
    );
    if (nextRun > now) break;

    nextRun = getNextDate(
      nextRun,
      hour,
      (d) => d.getHours(),
      (d, v) => d.setHours(v),
      (d, v) => d.setDate(d.getDate() + v)
    );
    if (nextRun > now) break;

    const validDays = dayOfMonth.filter(
      (d) => d <= getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())
    );
    nextRun = getNextDate(
      nextRun,
      validDays,
      (d) => d.getDate(),
      (d, v) => d.setDate(v),
      (d, v) => d.setMonth(d.getMonth() + v)
    );
    if (nextRun > now) break;

    nextRun = getNextDate(
      nextRun,
      month,
      (d) => d.getMonth() + 1,
      (d, v) => d.setMonth(v - 1),
      (d, v) => d.setFullYear(d.getFullYear() + v)
    );
    if (nextRun > now) break;

    const daysToAdd = dayOfWeek
      .map((d) => (d - nextRun.getDay() + 7) % 7)
      .sort((a, b) => a - b)[0];
    nextRun.setDate(nextRun.getDate() + daysToAdd);
    if (nextRun > now) break;

    // If we've looped through all fields and haven't found a future date, add a minute and try again
    nextRun.setMinutes(nextRun.getMinutes() + 1);
  }

  return nextRun;
};
