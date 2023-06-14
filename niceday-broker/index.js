const goalieJs = require('@sense-os/goalie-js');
const schedule = require('node-schedule');

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
// proportional factor between the number of words in a message and the time to wait before the 
// newt message is delivered 
WORDS_PER_SECOND = 5
// maximum delay between a message and the next one
MAX_DELAY = 10

const chatSdk = new Chat();
let selectedServer;
let selectedServerEnv;

if (ENVIRONMENT === 'dev') {
  selectedServer = SenseServer.Alpha;
  selectedServerEnv = SenseServerEnvironment.Alpha;
} else {
  selectedServer = SenseServer.Production;
  selectedServerEnv = SenseServerEnvironment.Production;
}

const authSdk = new Authentication(selectedServer);

/**
 * Request a response from rasa for a given text message
 * */
function requestRasa(text, userId, attachmentIds, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', RASA_AGENT_URL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = callback;
  const data = JSON.stringify({
    sender: userId,
    message: text,
    metadata: { attachmentIds },
  });
  xhr.send(data);
}

/**
 * Send a message to a niceday recipient
 * */
function sendMessage(text, recipientId, additionalContents) {
  chatSdk.sendTextMessage(recipientId, text, additionalContents)
    .then((response) => {
      console.log('Successfully sent the message', response);
    })
    .catch(() => {
      chatSdk.sendTextMessage(recipientId, text, additionalContents)
        .then((newResponse) => {
          console.log('Successfully sent the message', newResponse);
        })
        .catch((error) => {
          throw Error(`Send message failed: ${error}`);
        });
    });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle the response from rasa, send each message to the Niceday user.
 * We insert a delay in between messages, so the user has some time to read each message.
 * */
async function onRasaResponse() {
  if (this.readyState === 4 && this.status === 200) {
    const responseJson = JSON.parse(this.responseText);
    for (message of responseJson){
          const attachment = {
        replyOfId: null,
        attachmentIds: [],
      };
      if ('metadata' in message) {
        attachment.attachmentIds = message.metadata;
      }
      
      sendMessage(message.text, parseInt(message.recipient_id, 10), attachment)

      if (ENVIRONMENT === 'prod') {
        const delay = (message.text.split(" ").length)/WORDS_PER_SECOND;
        
        if (delay > MAX_DELAY) {
          delay = MAX_DELAY;
        }

        await sleep(delay*1000);
      }
    }

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
      // we have to mark the message as read we it is received by the therapist
      chatSdk.markMessageAsRead(message.from, message.id);
      requestRasa(message.content.TEXT, message.from, message.attachmentIds, onRasaResponse);
    }
  }
}

function setupTokenRegeneration() {
  const rule = new schedule.RecurrenceRule();
  rule.hour = new schedule.Range(0, 23, 8);

  const job = schedule.scheduleJob(rule, () => {
    authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
      .then((response) => {
        chatSdk.init(selectedServerEnv);
        chatSdk.connect(response.user.id, response.token)
          .catch((connectError) => {
            throw Error(`Error during chat connection: ${connectError}`);
          });
      })
      .catch((error) => {
        throw Error(`Error during authentication: ${error}`);
      });
  });

  return job;
}

function setup(therapistId, token) {
  // Setup connection
  chatSdk.init(selectedServerEnv);
  chatSdk.connect(therapistId, token);

  // Send initial presence when connected
  chatSdk.subscribeToConnectionStatusChanges((connectionStatus) => {
    if (connectionStatus === ConnectionStatus.Connected) {
      chatSdk.sendInitialPresence();
    } else if (connectionStatus === ConnectionStatus.Disconnected) {
      authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
        .then((response) => {
          chatSdk.connect(response.user.id, response.token)
            .catch((connectionError) => {
              throw Error(`Error during connection: ${connectionError}`);
            });
        })
        .catch((error) => {
          throw Error(`Error during relogin: ${error}`);
        });
    }
  });

  const handler = new MessageHandler(therapistId, token);
  console.log('Forwarding messages to:', RASA_AGENT_URL);
  console.log('Listening to incoming message...');
  chatSdk.subscribeToIncomingMessage(handler.onIncomingMessage.bind(handler));
}
module.exports.setup = setup;

if (require.main === module) {
  authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
    .then((response) => {
      setup(response.user.id, response.token);
    })
    .catch((error) => {
      throw Error(`Error during authentication: ${error}`);
    });

  // schedule a tasks to regenerate the token every 9 hours
  setupTokenRegeneration();
}
