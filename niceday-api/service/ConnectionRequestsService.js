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
exports.getConnectionRequests = (req, body) => new Promise((resolve, reject) => {
  contacts.getRequestedContacts(req.app.get('token'))
    .then((result) => {
      resolve(result)
    })
    .catch((error) => {
      reject(Error(`Error during connections requests retrieval: ${error}`));
    })
});

/**
 * Accept the pending connection request indentified by the id in the request body.
 * Returns the JSON as received from the SenseServer.
 * @param req - The node.js express request object
 * @param body - The node.js express body object. Should contain invitation id.
 * */
exports.setAcceptConnectionRequests = (req, body) => new Promise((resolve, reject) => {
  contacts.acceptInvitation(req.app.get('token'), body.invitaton_id)
    .then((result) => {
      console.log('body: ',body);
      resolve(result)
    })
    .catch((error) => {
      reject(Error(`Error during connections requests acceptance: ${error}`));
    })
});
