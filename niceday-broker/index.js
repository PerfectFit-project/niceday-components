const goalieJs = require('@sense-os/goalie-js');

const {
  Chat, Authentication, SenseServer, SenseServerEnvironment,
  ConnectionStatus,
} = goalieJs;
const { XMLHttpRequest } = require('xmlhttprequest');
require('isomorphic-fetch');

// Read in environment variables from .env file
require('dotenv').config();

const { THERAPIST_PASSWORD, THERAPIST_EMAIL_ADDRESS, ENVIRONMENT } = process.env;
let { RASA_AGENT_URL } = process.env;
RASA_AGENT_URL = (RASA_AGENT_URL === undefined) ? 'http://rasa_server:5005/webhooks/rest/webhook' : RASA_AGENT_URL;
const MESSAGE_DELAY = 3000; // Delay in between messages in ms

const chatSdk = new Chat();
const authSdk = new Authentication(SenseServer.Alpha);

/**
 * Request a response from rasa for a given text message
 * */
function requestRasa(text, userId, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', RASA_AGENT_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = callback;
  const data = JSON.stringify({ sender: userId, message: text });
  xhr.send(data);
}

/**
 * Send a message to a niceday recipient
 * */
function sendMessage(text, recipientId) {
  chatSdk.sendTextMessage(recipientId, text).then((response) => {
    console.log('Successfully sent the message', response);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle the response from rasa, send each message to the Niceday user.
 * We insert a delay in between messages, so the user has some time to read each message.
 * */
function onRasaResponse() {
  if (this.readyState === 4 && this.status === 200) {
    const responseJson = JSON.parse(this.responseText);
    responseJson.forEach(async (message, i) => {
      if (ENVIRONMENT === 'prod') {
        await sleep(i * MESSAGE_DELAY);
      }
      sendMessage(message.text, parseInt(message.recipient_id, 10));
    });
  } else if (this.readyState === 4) {
    console.log('Something went wrong, status:', this.status, this.responseText);
  }
}

class MessageHandler {
  constructor(therapistId, token) {
    this.therapistId = therapistId;
    this.token = token;
  }

  /**
   * Handle an incoming Niceday message
   * */
  onIncomingMessage(message) {
    console.log(message);
    if (message.from !== this.therapistId && message.to === this.therapistId) {
      requestRasa(message.content.TEXT, message.from, onRasaResponse);
    }
  }
}

function setup(therapistId, token) {
  // Setup connection
  chatSdk.init(SenseServerEnvironment.Alpha);
  chatSdk.connect(therapistId, token);

  // Send initial presence when connected
  chatSdk.subscribeToConnectionStatusChanges((connectionStatus) => {
    if (connectionStatus === ConnectionStatus.Connected) {
      chatSdk.sendInitialPresence();
    }
  });

  const handler = new MessageHandler(therapistId, token);
  console.log('Forwarding messages to:', RASA_AGENT_URL);
  console.log('Listening to incoming message...');
  chatSdk.subscribeToIncomingMessage(handler.onIncomingMessage.bind(handler));
}
module.exports.setup = setup;

authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD).then((response) => {
  setup(response.user.id, response.token);
});
