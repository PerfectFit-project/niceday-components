const { SenseServer, FileChat } = require('@sense-os/goalie-js');
var FormData = require('form-data');
const fs = require('fs');
require('isomorphic-fetch');

/**
 * Upload a file
 *
 * @param req - The node.js express request object
 * @param body - The node.js express body object
 * */
exports.uploadFile = (req, body) => new Promise((resolve, reject) => {
      console.log('Upload file')
      const fileChat = new FileChat()

      fileChat.init(SenseServer.Alpha)
      var baseUrl = fileChat.baseUrl()

      var token = req.app.get('token')
      var requestHeaders = new Headers();
      requestHeaders.append("Authorization", "Token "+token);

      var formData = new FormData();
      var file=fs.readFileSync(body.file_path)
      formData.append("file", file,{
        filepath: body.file_path
      });
      formData.append("name", body.file_name);
      formData.append("receiver", body.receiver_id);

      var requestOptions = {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
        redirect: 'follow'
      };

      fetch(baseUrl + "?Authorization="+token, requestOptions)
        .then((result) => {
            console.log('Successfully uploaded file ', result)
            resolve()
        })
        .catch((err) => {
          console.log('Error:', err);
          reject(err);
        });
    });
