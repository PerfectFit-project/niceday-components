const { Authentication, SenseServer } = require('@sense-os/goalie-js');
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
} else {
  selectedServer = SenseServer.Production;
}

const authSdk = new Authentication(selectedServer);

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
    })
    .catch((error) => {
      throw Error(`Error during authentication: ${error}`);
    });
  
  // schedule a tasks to regenerate the token every 9 hours
  setupTokenRegeneration()

  // Initialize the Swagger middleware
  const server = http.createServer(app);

  return server;
}


function setupTokenRegeneration() {
  const rule = new schedule.RecurrenceRule();
  rule.hour = new schedule.Range(0,23,9);

  const job = schedule.scheduleJob(rule, function(){

    authSdk.login(THERAPIST_EMAIL_ADDRESS, THERAPIST_PASSWORD)
      .then((response) => {
        app.set('therapistId', response.user.id);
        app.set('token', response.token);
    })
    .catch((error) => {
    throw Error(`Error during authentication: ${error}`);
    });
  
  });
}

module.exports.createNicedayApiServer = createNicedayApiServer;
if (require.main === module) {
  const server = createNicedayApiServer();

  server.listen(serverPort, () => {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
}
