const { Contacts, SenseServer } = require('@sense-os/goalie-js');
require('isomorphic-fetch');

const { ENVIRONMENT } = process.env;
let selectedServer;

if (ENVIRONMENT === 'dev') {
  selectedServer = SenseServer.Alpha;
} else {
  selectedServer = SenseServer.Production;
}

const contacts = new Contacts(selectedServer);

/**
 * Get the pending connection requests.
 * Returns the JSON as received from the SenseServer.
 * @param req - The node.js express request object
 * @param body - The node.js express body object.
 * */
exports.removeContact = (req, body) => new Promise((resolve, reject) => {
  console.log(req.app.get('token'), req.app.get('therapistId'), body.user_id);
  contacts.removeContactFromUserContact(req.app.get('token'), req.app.get('therapistId'), body.user_id)
    .then((result) => {
      resolve(result);
    })
    .catch((error) => {
      reject(Error(`Error during contact temoval: ${error}`));
    });
});
