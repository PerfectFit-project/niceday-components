const { SenseServer, FileChat } = require('@sense-os/goalie-js');
const FormData = require('form-data');
const fetch = require('isomorphic-fetch');

/**
 * Upload a file
 *
 * @param req - The node.js express request object
 * @param body - The node.js express body object
 * */
exports.uploadFile = (req, body) => new Promise((resolve, reject) => {
  const fileChat = new FileChat();

  fileChat.init(SenseServer.Alpha);
  const baseUrl = fileChat.baseUrl();

  const token = req.app.get('token');
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
