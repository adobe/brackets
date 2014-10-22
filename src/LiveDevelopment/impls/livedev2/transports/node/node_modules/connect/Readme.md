# Connect [![build status](https://secure.travis-ci.org/senchalabs/connect.png)](http://travis-ci.org/senchalabs/connect)

  Connect is an extensible HTTP server framework for [node](http://nodejs.org), providing high performance "plugins" known as _middleware_.

 Connect is bundled with over _20_ commonly used middleware, including
 a logger, session support, cookie parser, and [more](http://senchalabs.github.com/connect). Be sure to view the 2.x [documentation](http://www.senchalabs.org/connect/).

```js
var connect = require('connect')
  , http = require('http');

var app = connect()
  .use(connect.favicon())
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .use(connect.directory('public'))
  .use(connect.cookieParser())
  .use(connect.session({ secret: 'my secret here' }))
  .use(function(req, res){
    res.end('Hello from Connect!\n');
  });

http.createServer(app).listen(3000);
```

## Middleware

  - [basicAuth](http://www.senchalabs.org/connect/basicAuth.html)
  - [bodyParser](http://www.senchalabs.org/connect/bodyParser.html)
  - [compress](http://www.senchalabs.org/connect/compress.html)
  - [cookieParser](http://www.senchalabs.org/connect/cookieParser.html)
  - [cookieSession](http://www.senchalabs.org/connect/cookieSession.html)
  - [csrf](http://www.senchalabs.org/connect/csrf.html)
  - [directory](http://www.senchalabs.org/connect/directory.html)
  - [errorHandler](http://www.senchalabs.org/connect/errorHandler.html)
  - [favicon](http://www.senchalabs.org/connect/favicon.html)
  - [json](http://www.senchalabs.org/connect/json.html)
  - [limit](http://www.senchalabs.org/connect/limit.html)
  - [logger](http://www.senchalabs.org/connect/logger.html)
  - [methodOverride](http://www.senchalabs.org/connect/methodOverride.html)
  - [multipart](http://www.senchalabs.org/connect/multipart.html)
  - [urlencoded](http://www.senchalabs.org/connect/urlencoded.html)
  - [query](http://www.senchalabs.org/connect/query.html)
  - [responseTime](http://www.senchalabs.org/connect/responseTime.html)
  - [session](http://www.senchalabs.org/connect/session.html)
  - [static](http://www.senchalabs.org/connect/static.html)
  - [staticCache](http://www.senchalabs.org/connect/staticCache.html)
  - [subdomains](http://www.senchalabs.org/connect/subdomains.html)
  - [vhost](http://www.senchalabs.org/connect/vhost.html)

## Running Tests

first:

    $ npm install -d

then:

    $ make test

## Contributors

 https://github.com/senchalabs/connect/graphs/contributors

## Node Compatibility

  Connect `< 1.x` is compatible with node 0.2.x


  Connect `1.x` is compatible with node 0.4.x


  Connect `2.x` is compatible with node 0.6.x


  Connect (_master_) is compatible with node 0.8.x

## CLA

 [http://sencha.com/cla](http://sencha.com/cla)

## License

View the [LICENSE](https://github.com/senchalabs/connect/blob/master/LICENSE) file. The [Silk](http://www.famfamfam.com/lab/icons/silk/) icons used by the `directory` middleware created by/copyright of [FAMFAMFAM](http://www.famfamfam.com/).
