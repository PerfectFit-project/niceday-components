const utils = require('../utils/writer.jsx');
const ConnectionRequest = require('../service/ConnectionRequestsService');

// eslint-disable-next-line no-unused-vars
module.exports.getConnectionRequests = function getConnectionRequests(req, res, next, body) {
  
  console.log('ECCO');
  ConnectionRequest.getConnectionRequests(req)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, utils.respondWithCode(500, response));
    });
};

// eslint-disable-next-line no-unused-vars
module.exports.setAcceptConnection = function setAcceptConnection(req, res, next, body) {
  ConnectionRequest.setAcceptConnection(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, utils.respondWithCode(500, response));
    });
};
