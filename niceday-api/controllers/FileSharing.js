const utils = require('../utils/writer.jsx');
const FileSharing = require('../service/FilesSharingService');

module.exports.uploadFile = function uploadFile(req, res, next, body) {
  FileSharing.uploadFile(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, response);
    });
};
