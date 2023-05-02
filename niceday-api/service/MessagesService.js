const { Chat, SenseServerEnvironment, ConnectionStatus } = require('@sense-os/goalie-js');
const { ENVIRONMENT } = process.env;

if (ENVIRONMENT == 'dev'){
    selectedServerEnv = SenseServerEnvironment.Alpha;
}
else {
    selectedServerEnv = SenseServerEnvironment.Production;
}

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
      .catch((error) => reject(error));

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
