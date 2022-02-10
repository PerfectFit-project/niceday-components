const utils = require('../utils/writer.jsx');
const UserTrackers = require('../service/UserTrackersService');

module.exports.setUserTrackerStatuses = function setUserTrackerStatuses(req, res, next, body) {
  UserTrackers.setUserTrackerStatuses(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};

module.exports.getSmokingTrackerData = function getSmokingTrackerData(req, res, next, body) {
  UserTrackers.getSmokingTrackerData(req)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};
