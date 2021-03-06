// Generated by CoffeeScript 2.3.2
(function() {
  var AWS, helpers;

  helpers = require('../helpers');

  AWS = helpers.AWS;

  describe('AWS.Signers.S3', function() {
    var accessKeyId, addAuth, body, buildRequest, credentials, date, headers, method, path, secretAccessKey, sessionToken, stringToSign, virtualHostedBucket;
    // these can be overriden in tests
    method = null;
    path = null;
    headers = null;
    body = null;
    date = null;
    virtualHostedBucket = null;
    accessKeyId = null;
    secretAccessKey = null;
    sessionToken = null;
    // reset the overriden variable before each test
    beforeEach(function() {
      method = 'POST';
      path = '/';
      virtualHostedBucket = null;
      date = new Date(0);
      headers = {};
      body = null;
      accessKeyId = 'akid';
      secretAccessKey = 'secret';
      return sessionToken = null;
    });
    buildRequest = function() {
      var req;
      req = new AWS.HttpRequest('https://s3.amazonaws.com');
      req.method = method;
      req.path = path;
      req.headers = headers;
      req.body = body;
      req.virtualHostedBucket = virtualHostedBucket;
      return req;
    };
    credentials = function() {
      var creds;
      creds = {};
      creds.accessKeyId = accessKeyId;
      creds.secretAccessKey = secretAccessKey;
      if (sessionToken) {
        creds.sessionToken = sessionToken;
      }
      return creds;
    };
    addAuth = function(req) {
      var signer;
      signer = new AWS.Signers.S3(req || buildRequest());
      signer.addAuthorization(credentials(), date);
      return signer.request;
    };
    stringToSign = function(req) {
      var signer;
      signer = new AWS.Signers.S3(req || buildRequest());
      return signer.stringToSign();
    };
    describe('addAuthorization', function() {
      it('sets the date header when not present', function() {
        var req;
        req = buildRequest();
        addAuth(req);
        return expect(req.headers['X-Amz-Date']).to.equal(AWS.util.date.rfc822(date));
      });
      it('overwrites Date if present', function() {
        var req;
        req = buildRequest();
        req.headers['X-Amz-Date'] = 'date-string';
        addAuth(req);
        return expect(req.headers['X-Amz-Date']).to.equal(AWS.util.date.rfc822(date));
      });
      it('omits the security token header when session token is blank', function() {
        var req;
        sessionToken = null;
        req = addAuth();
        return expect(req.headers['x-amz-security-token']).to.equal(void 0);
      });
      it('adds a security token header when session token available', function() {
        var req;
        sessionToken = 'session';
        req = addAuth();
        return expect(req.headers['x-amz-security-token']).to.equal('session');
      });
      it('adds an Authorization header which contains akid and signature', function() {
        var creds, req, signer;
        creds = {
          accessKeyId: 'AKID',
          secretAccessKey: 'secret'
        };
        req = buildRequest();
        signer = new AWS.Signers.S3(req);
        helpers.spyOn(signer, 'stringToSign');
        signer.stringToSign.andReturn('string-to-sign');
        signer.addAuthorization(creds, date);
        return expect(req.headers['Authorization']).to.equal('AWS AKID:Gg5WLabTOvH0WMd15wv7lWe4zK0=');
      });
      return it('properly signs special characters', function() {
        var creds, req, signer;
        creds = {
          accessKeyId: 'AKID',
          secretAccessKey: 'secret'
        };
        req = buildRequest();
        signer = new AWS.Signers.S3(req);
        helpers.spyOn(signer, 'stringToSign');
        signer.stringToSign.andReturn('!@#$%^&*();\':"{}[],./?`~');
        signer.addAuthorization(creds, date);
        return expect(req.headers['Authorization']).to.equal('AWS AKID:2E04i7QCa0uZTYtxue9dEqto3dg=');
      });
    });
    return describe('stringToSign', function() {
      beforeEach(function() {
        return headers['X-Amz-Date'] = 'DATE-STRING';
      });
      it('builds a basic string to sign', function() {
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/');
      });
      it('includes content md5 and content type when present', function() {
        headers['Content-Type'] = 'CONTENT-TYPE';
        headers['Content-MD5'] = 'CONTENT-MD5';
        return expect(stringToSign()).to.equal('POST\nCONTENT-MD5\nCONTENT-TYPE\n\nx-amz-date:DATE-STRING\n/');
      });
      it('includes the http method, whatever it is', function() {
        method = 'VERB';
        return expect(stringToSign()).to.equal('VERB\n\n\n\nx-amz-date:DATE-STRING\n/');
      });
      it('includes any x-amz- style headers, but not others', function() {
        headers['X-Amz-Abc'] = 'abc';
        headers['X-Amz-Xyz'] = 'xyz';
        headers['random-header'] = 'random';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-abc:abc\nx-amz-date:DATE-STRING\nx-amz-xyz:xyz\n/');
      });
      it('includes x-amz- headers that are lower-cased', function() {
        headers['x-amz-Abc'] = 'abc';
        headers['x-amz-Xyz'] = 'xyz';
        headers['random-header'] = 'random';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-abc:abc\nx-amz-date:DATE-STRING\nx-amz-xyz:xyz\n/');
      });
      it('sorts headers by their name', function() {
        headers['x-amz-mno'] = 'mno';
        headers['x-amz-Xyz'] = 'xyz';
        headers['x-amz-Abc'] = 'abc';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-abc:abc\nx-amz-date:DATE-STRING\nx-amz-mno:mno\nx-amz-xyz:xyz\n/');
      });
      it('builds a canonical resource from the path', function() {
        path = '/bucket_name/key';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/bucket_name/key');
      });
      it('appends the bucket to the path when it is part of the hostname', function() {
        path = '/';
        virtualHostedBucket = 'bucket-name';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/bucket-name/');
      });
      it('appends the subresource portion of the path querystring', function() {
        path = '/?acl';
        virtualHostedBucket = 'bucket-name';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/bucket-name/?acl');
      });
      it('includes the sub resource value when present', function() {
        path = '/bucket_name/key?versionId=123';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/bucket_name/key?versionId=123');
      });
      it('omits non-sub-resource querystring params from the resource string', function() {
        path = '/?versionId=abc&next-marker=xyz';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?versionId=abc');
      });
      it('sorts sub resources by name', function() {
        path = '/?logging&acl&website&torrent=123'; // made up example
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?acl&logging&torrent=123&website');
      });
      it('sorts sub resources by name', function() {
        path = '/?logging&acl&website&torrent=123'; // made up example
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?acl&logging&torrent=123&website');
      });
      it('includes the un-decoded query string param for sub resources', function() {
        path = '/?versionId=a%2Bb'; // a+b
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?versionId=a%2Bb');
      });
      it('includes the replication subresource without a value', function() {
        path = '/?replication';
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?replication');
      });
      it('includes the non-encoded query string get header overrides', function() {
        path = '/?response-content-type=a%2Bb'; // a+b
        return expect(stringToSign()).to.equal('POST\n\n\n\nx-amz-date:DATE-STRING\n/?response-content-type=a+b');
      });
      return it('omits the date header when not present', function() {
        delete headers['X-Amz-Date'];
        return expect(stringToSign()).to.equal('POST\n\n\n\n/');
      });
    });
  });

}).call(this);
