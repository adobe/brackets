var connect = require('connect')
  , request = require('supertest')
  , signature = require('cookie-signature');

var app = connect();

app.use(connect.cookieParser('keyboard cat'));

app.use(function(req, res, next){
  if ('/signed' != req.url) return next();
  res.end(JSON.stringify(req.signedCookies));
});

app.use(function(req, res, next){
  res.end(JSON.stringify(req.cookies));
});

describe('connect.cookieParser()', function(){
  describe('when no cookies are sent', function(){
    it('should default req.cookies to {}', function(done){
      request(app)
      .get('/')
      .expect('{}', done);
    })

    it('should default req.signedCookies to {}', function(done){
      request(app)
      .get('/signed')
      .expect('{}', done);
    })
  })

  describe('when cookies are sent', function(){
    it('should populate req.cookies', function(done){
      request(app)
      .get('/')
      .set('Cookie', 'foo=bar; bar=baz')
      .expect('{"foo":"bar","bar":"baz"}', done);
    })
  })

  describe('when a secret is given', function(){
    var val = signature.sign('foobarbaz', 'keyboard cat');
    // TODO: "bar" fails...

    it('should populate req.signedCookies', function(done){
      request(app)
      .get('/signed')
      .set('Cookie', 'foo=s:' + val)
      .expect('{"foo":"foobarbaz"}', done);
    })

    it('should remove the signed value from req.cookies', function(done){
      request(app)
      .get('/')
      .set('Cookie', 'foo=s:' + val)
      .expect('{}', done);
    })

    it('should omit invalid signatures', function(done){
      request(app)
      .get('/signed')
      .set('Cookie', 'foo=' + val + '3')
      .expect('{}', function(){
        request(app)
        .get('/')
        .set('Cookie', 'foo=' + val + '3')
        .expect('{"foo":"foobarbaz.CP7AWaXDfAKIRfH49dQzKJx7sKzzSoPq7/AcBBRVwlI3"}', done);
      });
    })
  })
})
