# simgr - Simple Image Resizer [![Build Status](https://travis-ci.org/expressjs/basic-auth-connect.png)](https://travis-ci.org/expressjs/basic-auth-connect)

Connect's Basic Auth middleware in its own module. This module is considered deprecated. You should instead create your own middleware with [basic-auth](https://github.com/visionmedia/node-basic-auth).

## API

```js
var basicAuth = require('basic-auth-connect');
```

Sorry, couldn't think of a more clever name.

Simple username and password

```js
connect()
.use(basicAuth('username', 'password'));
```

Callback verification

```js
connect()
.use(basicAuth(function(user, pass){
  return 'tj' == user && 'wahoo' == pass;
}))
```

Async callback verification, accepting `fn(err, user)`.

```
connect()
.use(basicAuth(function(user, pass, fn){
  User.authenticate({ user: user, pass: pass }, fn);
}))
```

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.