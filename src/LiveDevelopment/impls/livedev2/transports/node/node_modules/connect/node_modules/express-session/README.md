# express-session

Setup session store with the given `options`.

Session data is _not_ saved in the cookie itself, however
cookies are used, so we must use the [cookieParser()](cookieParser.html)
middleware _before_ `session()`.

## Example

```js
 app.use(connect.cookieParser())
 app.use(connect.session({ secret: 'keyboard cat', key: 'sid', cookie: { secure: true }}))
```

**Options**

  - `key` cookie name defaulting to `connect.sid`
  - `store` session store instance
  - `secret` session cookie is signed with this secret to prevent tampering
  - `cookie` session cookie settings, defaulting to `{ path: '/', httpOnly: true, maxAge: null }`
  - `proxy` trust the reverse proxy when setting secure cookies (via "x-forwarded-proto")

**Cookie options**

By default `cookie.maxAge` is `null`, meaning no "expires" parameter is set
so the cookie becomes a browser-session cookie. When the user closes the
browser the cookie (and session) will be removed.

## req.session

To store or access session data, simply use the request property `req.session`,
which is (generally) serialized as JSON by the store, so nested objects
are typically fine. For example below is a user-specific view counter:

```js
app.use(cookieParser())
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

app.use(function(req, res, next){
  var sess = req.session;
  if (sess.views) {
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>views: ' + sess.views + '</p>');
    res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>');
    res.end();
    sess.views++;
  } else {
    sess.views = 1;
    res.end('welcome to the session demo. refresh!');
  }
})
```

## Session#regenerate()

To regenerate the session simply invoke the method, once complete
a new SID and `Session` instance will be initialized at `req.session`.

```js
req.session.regenerate(function(err){
  // will have a new session here
});
```

## Session#destroy()

Destroys the session, removing `req.session`, will be re-generated next request.

```js
req.session.destroy(function(err){
  // cannot access session here
});
```

## Session#reload()

Reloads the session data.

```js
req.session.reload(function(err){
  // session updated
});
```

## Session#save()

Save the session.

```js
req.session.save(function(err){
  // session saved
});
```

## Session#touch()

Updates the `.maxAge` property. Typically this is
not necessary to call, as the session middleware does this for you.

## Session#cookie

Each session has a unique cookie object accompany it. This allows
you to alter the session cookie per visitor. For example we can
set `req.session.cookie.expires` to `false` to enable the cookie
to remain for only the duration of the user-agent.

## Session#maxAge

Alternatively `req.session.cookie.maxAge` will return the time
remaining in milliseconds, which we may also re-assign a new value
to adjust the `.expires` property appropriately. The following
are essentially equivalent

```js
var hour = 3600000;
req.session.cookie.expires = new Date(Date.now() + hour);
req.session.cookie.maxAge = hour;
```

For example when `maxAge` is set to `60000` (one minute), and 30 seconds
has elapsed it will return `30000` until the current request has completed,
at which time `req.session.touch()` is called to reset `req.session.maxAge`
to its original value.

```js
req.session.cookie.maxAge;
// => 30000
```

## Session Store Implementation

Every session store _must_ implement the following methods

   - `.get(sid, callback)`
   - `.set(sid, session, callback)`
   - `.destroy(sid, callback)`

Recommended methods include, but are not limited to:

   - `.length(callback)`
   - `.clear(callback)`
