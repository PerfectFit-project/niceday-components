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

    const chatSdk = req.app.get('chatsdk')
    chatSdk.sendTextMessage(body.recipient_id, body.text).then((response) => {
      console.log('Successfully sent the message', response);
      resolve();
    })
      .catch((error) => reject(error));

  });
};
