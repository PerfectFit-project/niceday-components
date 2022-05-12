const { CustomTrackers, SenseServer, SenseTracking, RecurringSchedulesService, SenseServerEnvironment } = require('@sense-os/goalie-js'); // eslint-disable-line global-require
require('isomorphic-fetch');

const customTrackerSdk = new CustomTrackers(SenseServer.Alpha);
const trackingSdk = new SenseTracking();
const recurringScheduleSdk = RecurringSchedulesService;

/**
 * Set user tracker status.
 * @param req - The node.js express request object
 * @param body - The node.js express body object.
 * */
exports.setUserTrackerStatuses = (req, body) => new Promise((resolve, reject) => {
  const { userId, trackerStatuses } = body;
  customTrackerSdk
    .postUserTrackerStatus(req.app.get('token'), userId, trackerStatuses)
    .then((result) => {
      console.log('Result:', result);
      resolve(result);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});

/**
 * Get data from the smoking tracker for a specific user.
 * I.e. the number of cigarettes that a user smoked in a given period of time.
 * @param req - The node.js express request object
 * @param body - The node.js express body object.
 * */
exports.getSmokingTrackerData = (req) => new Promise((resolve, reject) => {
  const { startTime, endTime } = req.query;
  const { userId } = req.openapi.pathParams;
  trackingSdk.init(req.app.get('token'), SenseServer.Alpha);
  trackingSdk.getSensorResolved({
    sensorName: ['tracker_smoking'],
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    userId,
  })
    .then((result) => {
      // Retrieve nested data that is about cigarettes
      const cigaretteData = result.map((c) => c.value.measures.measureCigarettes.sensorData);
      console.log('Result:', cigaretteData);
      resolve(cigaretteData);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});

/**
 * Set a reminder for a tracker for a specific user.
 * @param req - The node.js express request object
 * @param body - The node.js express body object.
 * */
exports.setTrackerReminder = (req, body) => new Promise((resolve, reject) => {
  const { userId, recurringSchedule } = body;
  console.log('userId: ', userId);
  console.log('BODY:', recurringSchedule);
  recurringScheduleSdk.setEnv(SenseServerEnvironment.Alpha);
  recurringScheduleSdk
  .recurringSchedulePost(req.app.get('token'), userId, recurringSchedule)
  .then((result) => {
      console.log('Result:', result);
      resolve(result);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});
