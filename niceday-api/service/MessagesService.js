const {
  Authentication, Chat, SenseServer, SenseServerEnvironment, ConnectionStatus,
} = require('@sense-os/goalie-js');

const { ENVIRONMENT, THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD } = process.env;

let selectedServerEnv;
let selectedServer;

if (ENVIRONMENT === 'dev') {
  selectedServerEnv = SenseServerEnvironment.Alpha;
  selectedServer = SenseServer.Alpha;
} else {
  selectedServerEnv = SenseServerEnvironment.Production;
  selectedServer = SenseServer.Production;
}
const authSdk = new Authentication(selectedServer);
/**
 * Send a text message
 *
 * @param req - The node.js express request object
 * @param req - The node.js express body object
 *
 * no response value expected for this operation
 * */
exports.sendTextMessage = function (req, body) {
  return new Promise((resolve, reject) => {
    const chatSdk = new Chat();
    chatSdk.init(selectedServerEnv);
    chatSdk.connect(req.app.get('therapistId'), req.app.get('token'))
      .catch(() => {
        // if the connection fails, we regenreate the token by logging in again
        // and we try to reconnect
        authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
          .then((response) => {
            req.app.set('therapistId', response.user.id);
            req.app.set('token', response.token);
            chatSdk.connect(response.user.id, response.token);
          })
          .catch((loginError) => {
            throw Error(`Error during authentication: ${loginError}`);
          });
      });

    const subscriptionId = chatSdk.subscribeToConnectionStatusChanges((connectionStatus) => {
      if (connectionStatus === ConnectionStatus.Connected) {
        chatSdk.sendInitialPresence();
        chatSdk.sendTextMessage(body.recipient_id, body.text).then((response) => {
          console.log('Successfully sent the message', response);
          chatSdk.unsubscribeFromConnectionStatusChanges(subscriptionId);
          resolve();
        })
          .catch((error) => reject(error));
      }
    });
  });
};
