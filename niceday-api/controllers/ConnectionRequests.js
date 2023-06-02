const utils = require('../utils/writer.jsx');
const ConnectionRequest = require('../service/ConnectionRequestsService.js');

module.exports.getConnectionRequests = function getConnectionRequests(req, res, next, body) {
  ConnectionRequest.getConnectionRequests(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, utils.respondWithCode(500, response));
    });
};

module.exports.setAcceptConnectionRequests = function setAcceptConnectionRequests(req, res, next, body) {
  ConnectionRequest.setAcceptConnectionRequests(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, utils.respondWithCode(500, response));
    });
};
