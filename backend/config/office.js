module.exports = {
  OFFICE_LOCATION: {
    latitude: parseFloat(process.env.OFFICE_LATITUDE) || 23.2310465,
    longitude: parseFloat(process.env.OFFICE_LONGITUDE) || 77.442858,
    allowedRadiusMeters: parseInt(process.env.OFFICE_RADIUS_METERS) || 200,
  },
  OFFICE_TIMING: {
    weekdayStartHour: 11,
    weekdayStartMinute: 0,
    saturdayStartHour: 11,
    saturdayStartMinute: 30,
    autoCheckoutHour: 20,
    autoCheckoutMinute: 0,
    reminderHour: 11,
    reminderMinute: 0,
  },
};
