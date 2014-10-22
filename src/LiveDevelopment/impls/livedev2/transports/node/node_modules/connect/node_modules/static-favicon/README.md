# static-favicon

express/connect middleware to serves a favicon.

```js
app.use(favicon(__dirname + '/public/favicon.ico'));
```

Typically this middleware will come very early in your stack (maybe even first) to avoid processing any other middleware if we already know the request is for favicon.ico

## api

### favicon(path, options)

Create new middleware to serve a favicon from the given `path` to a favicon file.

**options**

  - `maxAge`  cache-control max-age directive, defaulting to 1 day
