const { SenseServer, FileChat } = require('@sense-os/goalie-js');
const FormData = require('form-data');
const fetch = require('isomorphic-fetch');
const { ENVIRONMENT } = process.env;
/**
 * Upload a file
 *
 * @param req - The node.js express request object
 * @param body - The node.js express body object
 * */
exports.uploadFile = (req, body) => new Promise((resolve, reject) => {
  const fileChat = new FileChat();

  if (ENVIRONMENT == 'dev'){
      fileChat.init(SenseServer.Alpha);
  }
  else {
      fileChat.init(SenseServer.Production);
  }
  const baseUrl = fileChat.baseUrl();

  const token = req.app.get('token');
  // eslint-disable-next-line no-undef
  const requestHeaders = new Headers();
  requestHeaders.append('Authorization', `Token ${token}`);
  const formData = new FormData();
  formData.append('file', req.files[0].buffer, {
    filepath: body.file_path,
  });
  formData.append('name', req.files[0].originalname);
  formData.append('receiver', Number(body.receiver_id));

  const requestOptions = {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
    redirect: 'follow',
  };

  fetch(`${baseUrl}?Authorization=${token}`, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      console.log('Successfully uploaded file ', result);
      resolve(result);
    })
    .catch((err) => {
      console.log('Error:', err);
      reject(err);
    });
});
