# cookie-parser

Parse _Cookie_ header and populate `req.cookies` with an object keyed by the cookie
names. Optionally you may enabled signed cookie support by passing a `secret` string,
which assigns `req.secret` so it may be used by other middleware.

```js
var cookieParser = require('cookie-parser');

connect()
 .use(cookieParser('optional secret string'))
 .use(function(req, res, next){
   res.end(JSON.stringify(req.cookies));
 })
```

## install

```shell
npm install cookie-parser
```

## License

MIT
