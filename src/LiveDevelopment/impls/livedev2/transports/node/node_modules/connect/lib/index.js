
/**
 * Connect is a middleware framework for node,
 * shipping with over 18 bundled middleware and a rich selection of
 * 3rd-party middleware.
 *
 *     var app = connect()
 *       .use(connect.logger('dev'))
 *       .use(connect.static('public'))
 *       .use(function(req, res){
 *         res.end('hello world\n');
 *       })
 *
 *     http.createServer(app).listen(3000);
 *
 * Installation:
 *
 *     $ npm install connect
 *
 * Middleware:
 *
 *  - [basicAuth](https://github.com/expressjs/basic-auth-connect) basic http authentication
 *  - [cookieParser](https://github.com/expressjs/cookie-parser) cookie parser
 *  - [compress](https://github.com/expressjs/compression) Gzip compression middleware
 *  - [csrf](https://github.com/expressjs/csurf) Cross-site request forgery protection
 *  - [directory](https://github.com/expressjs/serve-index) directory listing middleware
 *  - [errorHandler](https://github.com/expressjs/errorhandler) flexible error handler
 *  - [favicon](https://github.com/expressjs/favicon) efficient favicon server (with default icon)
 *  - [logger](https://github.com/expressjs/morgan) request logger with custom format support
 *  - [methodOverride](https://github.com/expressjs/method-override) faux HTTP method support
 *  - [responseTime](https://github.com/expressjs/response-time) calculates response-time and exposes via X-Response-Time
 *  - [session](https://github.com/expressjs/session) session management support with bundled MemoryStore
 *  - [static](https://github.com/expressjs/serve-static) streaming static file server supporting `Range` and more
 *  - [timeout](https://github.com/expressjs/timeout) request timeouts
 *  - [vhost](https://github.com/expressjs/vhost) virtual host sub-domain mapping middleware
 *  - [bodyParser](bodyParser.html) extensible request body parser
 *  - [json](json.html) application/json parser
 *  - [urlencoded](urlencoded.html) application/x-www-form-urlencoded parser
 *  - [multipart](multipart.html) multipart/form-data parser
 *  - [cookieSession](cookieSession.html) cookie-based session support
 *  - [staticCache](staticCache.html) memory cache layer for the static() middleware
 *  - [limit](limit.html) limit the bytesize of request bodies
 *  - [query](query.html) automatic querystring parser, populating `req.query`
 *
 * Links:
 *
 *   - list of [3rd-party](https://github.com/senchalabs/connect/wiki) middleware
 *   - GitHub [repository](http://github.com/senchalabs/connect)
 *
 */