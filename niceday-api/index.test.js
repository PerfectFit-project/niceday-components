require('isomorphic-fetch');

const NICEDAY_TEST_SERVERPORT = 8080;
const NICEDAY_TEST_USER_ID = 38527;
const NICEDAY_TEST_TRACKER_RRULE = 'DTSTART:20210310T150000\nRRULE:FREQ=DAILY';
const MOCK_ID_FROM = 1;
const MOCK_ID_TO = 12345;
const MOCK_USER_DATA = {
  id: NICEDAY_TEST_USER_ID,
  userProfile: {
    firstName: 'Mr Mock',
  },
};
const MOCK_TEST_MESSAGE = 'Test message';
const MOCK_TRACKER_RESPONSE = { response: 'mock response' };
const MOCK_SMOKING_TRACKER_RESPONSE = [
  { value: { measures: { measureCigarettes: { sensorData: MOCK_TRACKER_RESPONSE } } } }];
const MOCK_TRACKER_REMINDER_RESPONSE = {
  scheduleType: 'tracker_smoking',
  owner: NICEDAY_TEST_USER_ID,
  startTime: '2022-05-17T15:10:00.000Z',
};
const MOCK_REQUEST_ID = '18981';
const MOCK_PENDING_REQUESTS = [
  {
    id: NICEDAY_TEST_USER_ID,
    invitationId: MOCK_REQUEST_ID,
  },
];
const MOCK_ACCEPT_REQUESTS = {};

// Contains all tests which require a mocked Senseserver
describe('Tests on niceday-api server using mocked goalie-js', () => {
  let server;

  beforeAll(() => {
    // Mock the constructor of the SenseNetwork submodule of goaliejs to return
    // a mock with the getContact() method, which itself returns a promise containing
    // the MOCK_USER_DATA. SenseServer.Alpha needs to be mocked too since it is used
    // in calls to the constructor.
    //
    // More comprehensive documentation can be found here:
    // https://en.wikipedia.org/wiki/Lovecraftian_horror
    jest.mock('@sense-os/goalie-js', () => ({
      SenseServer: () => ({
        Alpha: undefined,
      }),
      SenseServerEnvironment: () => ({
        Alpha: undefined,
      }),
      Chat: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        connect: jest.fn(),
        markMessageAsRead: jest.fn(),
        subscribeToConnectionStatusChanges: jest.fn(),
        sendInitialPresence: jest.fn(),
        subscribeToIncomingMessage: (handler) => {
          const mockTestMessage = {
            from: MOCK_ID_FROM,
            to: MOCK_ID_TO,
            content: {
              TEXT: MOCK_TEST_MESSAGE,
            },
          };

          handler(mockTestMessage);
        },
      })),
      Contacts: jest.fn().mockImplementation(() => ({
        getConnectedContacts: () => new Promise((resolve) => {
          resolve(MOCK_USER_DATA);
        }),
        getRequestedContacts: () => new Promise((resolve) => {
          resolve(MOCK_PENDING_REQUESTS);
        }),
        acceptInvitation: () => new Promise((resolve) => {
          resolve(MOCK_ACCEPT_REQUESTS);
        }),
      })),
      Authentication: jest.fn().mockImplementation(() => ({
        login: () => new Promise((resolve) => {
          console.debug('Mocking successful authentication');
          const mockAuthResponse = {
            token: 'mocktoken',
            user: {
              id: 12345,
            },
          };
          resolve(mockAuthResponse);
        }),
      })),
      CustomTrackers: jest.fn().mockImplementation(() => ({
        postUserTrackerStatus: () => new Promise((resolve) => {
          resolve(MOCK_TRACKER_RESPONSE);
        }),
      })),
      SenseTracking: jest.fn().mockImplementation(() => ({
        getSensorResolved: () => new Promise((resolve) => {
          resolve(MOCK_SMOKING_TRACKER_RESPONSE);
        }),
        init: () => new Promise((resolve) => {
          resolve();
        }),
      })),
      RecurringSchedulesService: {
        recurringSchedulePost: () => new Promise((resolve) => {
          resolve(MOCK_TRACKER_REMINDER_RESPONSE);
        }),
        setEnv: () => new Promise((resolve) => {
          resolve();
        }),
      },
    }));
  });

  // Set up - start niceday-api REST server (and wait until it is ready)
  beforeEach((done) => {
    const { createNicedayApiServer } = require('./index'); // eslint-disable-line global-require
    server = createNicedayApiServer();
    server.listen(NICEDAY_TEST_SERVERPORT, () => {
      console.debug('Test server up and listening on port %d', NICEDAY_TEST_SERVERPORT);
      done();
    });
  });

  // Tear down - stop niceday-api REST server after each test
  afterEach((done) => {
    console.debug('Stopping server');
    server.close(done);
  });

  it('Test fetching user data from userdata/ endpoint', () => {
    /*
      Sends a GET to the /userdata/ endpoint and checks that the expected
      (mock) user data is returned.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/userdata/${NICEDAY_TEST_USER_ID}`;
    return fetch(urlreq)
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toEqual(MOCK_USER_DATA);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });

  it('Test setting user tracker statuses with /usertrackers/statuses endpoint', () => {
    /*
      Sends a POST to the /usertrackers/statuses endpoint.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/usertrackers/statuses`;
    const data = JSON.stringify({
      userId: NICEDAY_TEST_USER_ID,
      trackerStatuses: [{ trackerId: 1, isEnabled: true }],
    });
    return fetch(urlreq, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    })
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toEqual(MOCK_TRACKER_RESPONSE);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });

  it('Test getting smoking tracker data with /usertrackers/smoking/ endpoint', () => {
    /*
      Sends a GET to the /usertrackers/smoking endpoint.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/usertrackers/smoking/${NICEDAY_TEST_USER_ID}?`;
    const params = new URLSearchParams({
      startTime: '2021-01-13T09:12:28Z',
      endTime: '2022-02-15T09:12:28Z',
    });
    return fetch(urlreq + params)
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toEqual([MOCK_TRACKER_RESPONSE]);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });

  it('Test setting user tracker reminder with /usertrackers/reminder endpoint', () => {
    /*
      Sends a POST to the /usertrackers/reminder endpoint.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/usertrackers/reminder`;
    const data = JSON.stringify({
      userId: NICEDAY_TEST_USER_ID.toString(),
      recurringSchedule: {
        title: 'Mok title',
        schedule_type: 'tracker_smoking',
        recurring_expression: {
          margin: { before: 0, after: 0 },
          reminder_enabled: true,
          reminder_margin: [{ before: 0, after: 0 }],
          rrule: NICEDAY_TEST_TRACKER_RRULE,
        },
      },
    });
    return fetch(urlreq, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    })
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toMatchObject(MOCK_TRACKER_REMINDER_RESPONSE);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });

  it('Test getting pending contact request with /connectionrequests endpoint', () => {
    /*
      Sends a GET to the /connectionrequests endpoint.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/connectionrequests`;
    return fetch(urlreq)
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toEqual(MOCK_PENDING_REQUESTS);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });

  it('Test accepting contact request /acceptconnection endpoint', () => {
    /*
      Sends a POST to the /acceptconnection endpoint.
    */

    const urlreq = `http://localhost:${NICEDAY_TEST_SERVERPORT}/acceptconnection`;
    const data = JSON.stringify({
      invitation_id: MOCK_REQUEST_ID,
    });
    return fetch(urlreq, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    })
      .then((response) => response.json())
      .then((responseBody) => {
        expect(responseBody).toEqual(MOCK_ACCEPT_REQUESTS);
      })
      .catch((error) => {
        throw new Error(`Error during fetch: ${error}`);
      });
  });
});
