const express = require('express');
const path = require('path');
const curl = require('curl');
const session = require('express-session');
const app = express();
const OAuth = require('oauth').OAuth;
const fs = require('fs');
const port = process.env.PORT || 3000;

app.use(
  session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true
  })
);

app.get('/', (req, res) => {
  res.send('hello');
});

app.get('/jira', function(req, res) {
  var base_url = 'http://192.168.0.7:8080';
  var oa = new OAuth(
    base_url + '/plugins/servlet/oauth/request-token',
    base_url + '/plugins/servlet/oauth/access-token',
    'mykey',
    fs.readFileSync('jira.pem', 'utf8'),
    '1.0',
    'http://localhost:3000/jira/callback',
    'RSA-SHA1'
  );

  console.log(oa, '!@#$!@#$!@$!@#$');
  oa.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret) {
    if (error) {
      console.log(fs.readFileSync('jira.pem', 'utf8'));
      console.log(oauthToken, '!!!!!!!!!!!!!!');
      console.log(oauthTokenSecret, '!!!!!!!!!!!!!!');
      console.log(error.data);
      res.send('Error getting OAuth access token');
    } else {
      req.session.oa = oa;
      req.session.oauth_token = oauthToken;
      req.session.oauth_token_secret = oauthTokenSecret;
      return res.redirect(
        base_url + '/plugins/servlet/oauth/authorize?oauth_token=' + oauthToken
      );
    }
  });
});
app.get('/jira/callback', function(req, res) {
  var oa = new OAuth(
    req.session.oa._requestUrl,
    req.session.oa._accessUrl,
    req.session.oa._consumerKey,
    fs.readFileSync('./jira.pem’, ‘utf8'),
    req.session.oa._version,
    req.session.oa._authorize_callback,
    req.session.oa._signatureMethod
  );
  oa.getOAuthAccessToken(
    req.session.oauth_token,
    req.session.oauth_token_secret,
    req.param('oauth_verifier'),
    function(error, oauth_access_token, oauth_access_token_secret, results2) {
      if (error) {
        console.log('error');
        console.log(error);
      } else {
        // store the access token in the session
        req.session.oauth_access_token = oauth_access_token;
        req.session.oauth_access_token_secret = oauth_access_token_secret;
        res.send({
          message: 'successfully authenticated.',
          access_token: oauth_access_token,
          secret: oauth_access_token_secret
        });
      }
    }
  );
});

app.get('/projects', function(req, res) {
  var consumer = new OAuth(
    'base_url/plugins/servlet/oauth/request-token',
    'base_url/plugins/servlet/oauth/access-token',
    'mykey',
    fs.readFileSync('jira.pem', 'utf8'),
    '1.0',
    'http://localhost:1337 /jira/callback',
    'RSA-SHA1'
  );
  function callback(error, data, resp) {
    console.log('data,', data, 'error,', error);
    return res.send(data);
  }
  consumer.get(
    'base_url/rest/api/2/project',
    'mytoken', //authtoken
    'mysecret', //oauth secret
    callback
  );
});

app.listen(port, () => {
  console.log('listening..');
});
