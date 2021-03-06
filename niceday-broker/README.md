# Niceday Broker

## Overview
This application listens to incoming messages from the Niceday server.
When a message comes in from a user sent to the therapist account, 
the message is forwarded to the rasa agent rest API. 
The rasa response is then sent back to the user in the Niceday app. 

### Setup
1. Install npm and node-js, following [these instructions](https://www.npmjs.com/get-npm).
2. Install dependencies: Run `npm install`.
3. Create a file called `.env` in this folder
Set THERAPIST_EMAIL_ADDRESS and THERAPIST_PASSWORD in your `.env` file, see .env-example. 
These will be loaded as environment variables and will thus be available in the app.
You will get a `InvalidUsernamePasswordError` if the username or password is invalid.

### Configuration
1. Optionally you can configure the rasa agent url by changing the `RASA_AGENT_URL` 
variable in the `.env` file (see `.env-example`). For example if you want to connect to
localhost instead of `rasa_server` (the default).
2. Configure functionality depending on the deployment environment by setting the `ENVIRONMENT` variable in your `.env` file. 
Possible values are ('prod', 'test', 'dev')
This will:
   - toggle whether you want to have a delay in between messages ('prod'), or not ('test', 'dev').

### Running the server
To run the server, run:
```
npm start
```

### Running with docker
Run the following commands:
```
./script/bootstrap
docker build -t niceday-broker .
docker run --env-file .env niceday-broker
```

See [root README](../README.md) for instructions of running 
the full application with docker-compose.

