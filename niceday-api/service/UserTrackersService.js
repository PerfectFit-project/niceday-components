const { CustomTrackers, SenseServer, SenseTracking } = require('@sense-os/goalie-js');
require('isomorphic-fetch');

const customTrackerSdk = new CustomTrackers(SenseServer.Alpha);
const trackingSdk = new SenseTracking();

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
 * Get smoking tracker data.
 * @param req - The node.js express request object
 * @param body - The node.js express body object.
 * */
exports.getSmokingTrackerData = (req, body) => new Promise((resolve, reject) => {
    const { startTime, endTime } = req.query;
    const { userId } = req.openapi.pathParams;
    trackingSdk.init(req.app.get('token'), SenseServer.Alpha);
    trackingSdk.getSensorResolved({sensorName: ['tracker_smoking'],
                                   startTime: new Date(startTime).toISOString(),
                                   endTime: new Date(endTime).toISOString(),
                                   userId: userId})
    .then((result) => {
      // Retrieve nested data that is about cigarettes
      cigarette_data = result.map(c => c.value.measures.measureCigarettes.sensorData);
      console.log('Result:', cigarette_data);
      resolve(cigarette_data);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});