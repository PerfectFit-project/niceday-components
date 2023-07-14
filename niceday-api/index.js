const { Authentication, SenseServer, Chat, ConnectionStatus, SenseServerEnvironment } = require('@sense-os/goalie-js');
const schedule = require('node-schedule');
const path = require('path');
const http = require('http');
const oas3Tools = require('oas3-tools');
require('isomorphic-fetch');

// Read in environment variables from .env file
require('dotenv').config();

const serverPort = 8080;

const { THERAPIST_PASSWORD, THERAPIST_EMAIL_ADDRESS, ENVIRONMENT } = process.env;
let selectedServer;

if (ENVIRONMENT === 'dev') {
  selectedServer = SenseServer.Alpha;
  selectedServerEnv = SenseServerEnvironment.Alpha;
} else {
  selectedServer = SenseServer.Production;
  selectedServerEnv = SenseServerEnvironment.Production;
}

const authSdk = new Authentication(selectedServer);
const chatSdk = new Chat();

// swaggerRouter configuration
const options = {
  routing: {
    controllers: path.join(__dirname, './controllers'),
  },
};

const expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
const app = expressAppConfig.getApp();

function createNicedayApiServer() {
  authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
    .then((response) => {
      app.set('therapistId', response.user.id);
      app.set('token', response.token);
      setupChat(response.user.id, response.token)
    })
    .catch((error) => {
      throw Error(`Error during authentication: ${error}`);
    });

  // Initialize the Swagger middleware
  const server = http.createServer(app);

  return server;
}

function setupChat(therapistId, token) {
  // Setup connection
  chatSdk.init(selectedServerEnv);
  chatSdk.connect(therapistId, token);

  // Send initial presence when connected
  chatSdk.subscribeToConnectionStatusChanges((connectionStatus) => {
    if (connectionStatus === ConnectionStatus.Connected) {
      chatSdk.sendInitialPresence();
      app.set('chatsdk', chatSdk);
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
}


function setupTokenRegeneration() {
  const rule = new schedule.RecurrenceRule();
  rule.hour = new schedule.Range(0, 23, 8);

  const job = schedule.scheduleJob(rule, () => {
    authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
      .then((response) => {
        app.set('therapistId', response.user.id);
        app.set('token', response.token);
      })
      .catch((error) => {
        throw Error(`Error during authentication: ${error}`);
      });
  });

  return job;
}

module.exports.createNicedayApiServer = createNicedayApiServer;
if (require.main === module) {
  const server = createNicedayApiServer();

  // schedule a tasks to regenerate the token every 9 hours
  setupTokenRegeneration();

  server.listen(serverPort, () => {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
}
