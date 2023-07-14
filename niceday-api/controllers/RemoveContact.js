const utils = require('../utils/writer.jsx');
const RemoveContact = require('../service/RemoveContactService');

// eslint-disable-next-line no-unused-vars
module.exports.removeContact = function removeContact(req, res, next, body) {
  RemoveContact.removeContact(req, body)
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((response) => {
      utils.writeJson(res, utils.respondWithCode(500, response));
    });
};
