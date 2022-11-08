const { Contacts, SenseServer } = require('@sense-os/goalie-js');
require('isomorphic-fetch');

const userNetwork = new Contacts(SenseServer.Alpha);
/**
 * Fetch the user data corresponding to the given user ID.
 * Returns the JSON as received from the SenseServer.
 * @param req - The node.js express request object
 * @param body - The node.js express body object. Should contain userid.
 * */
exports.getUserData = (req, body) => new Promise((resolve, reject) => {
  userNetwork
    .getConnectedContacts(req.app.get('token'), body)
    .then((result) => {
      console.log('Result:', result);
      resolve(result);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});
