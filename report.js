// reportGenerator.js

const { DateTime } = require('luxon');
const { stringify } = require('csv-stringify/sync');

// Constants
const WORKING_HOURS = '09:00 - 18:00';
const WORK_LOCATIONS = {
  OFFICE: 'office',
  HOME: 'home'
};
const MARKERS = {
  PRESENT: 'V'
};

const WEEKDAYS = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7
};

const MONTH_VALIDATION = {
  MIN: 1,
  MAX: 12
};

// Helper Functions
const normalizeDate = (day, month, year) => {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const isWeekend = (dayOfWeek) => dayOfWeek === WEEKDAYS.FRIDAY || dayOfWeek === WEEKDAYS.SATURDAY;

const isWorkFromHomeDay = (date, normalizedWfhDays) => {
  const dayOfWeek = date.weekday;
  const isoDate = date.toISODate();
  return dayOfWeek === WEEKDAYS.TUESDAY || normalizedWfhDays.includes(isoDate);
};

const generateDayData = (date, normalizedSickDays, normalizedDaysOff, normalizedWfhDays) => {
  const isoDate = date.toISODate();
  const dayOfWeek = date.weekday;

  const dayData = {
    office: isoDate,
    hours: '',
    officeHome: '',
    dayOff: '',
    sickDay: ''
  };

  if (normalizedSickDays.includes(isoDate)) {
    dayData.sickDay = MARKERS.PRESENT;
  } else if (normalizedDaysOff.includes(isoDate)) {
    dayData.dayOff = MARKERS.PRESENT;
  } else if (!isWeekend(dayOfWeek)) {
    dayData.hours = WORKING_HOURS;
    dayData.officeHome = isWorkFromHomeDay(date, normalizedWfhDays) ? 
      WORK_LOCATIONS.HOME : WORK_LOCATIONS.OFFICE;
  }

  return Object.values(dayData);
};

const generateCSV = (month, year, sickDays = [], daysOff = [], workFromHome = []) => {
  try {
    // Validate month
    if (!month || month < MONTH_VALIDATION.MIN || month > MONTH_VALIDATION.MAX) {
      throw new Error(`Invalid month. Must be between ${MONTH_VALIDATION.MIN} and ${MONTH_VALIDATION.MAX}`);
    }

    // Use current year if not provided
    year = year ?? DateTime.now().year;

    console.log(`Starting report generation for month ${month} of year ${year}`);

    const startDate = DateTime.fromObject({ year, month, day: 1 }).startOf('month');
    const endDate = startDate.endOf('month');

    const normalizedSickDays = sickDays.map(d => normalizeDate(d, month, year));
    const normalizedDaysOff = daysOff.map(d => normalizeDate(d, month, year));
    const normalizedWfhDays = workFromHome.map(d => normalizeDate(d, month, year));

    const csvData = [];
    for (let date = startDate; date <= endDate; date = date.plus({ days: 1 })) {
      const rowData = generateDayData(date, normalizedSickDays, normalizedDaysOff, normalizedWfhDays);
      csvData.push(rowData);
    }

    const csvString = stringify(csvData, {
      columns: ['Office Date', 'Hours', 'Office / Home', 'Day Off', 'Sick Day'],
      header: true
    });

    console.log(`CSV generation successful for ${month}/${year}`);
    return csvString;
  } catch (error) {
    console.error(`Error generating report: ${error.message}`);
    throw error;
  }
};

module.exports = { generateCSV };
