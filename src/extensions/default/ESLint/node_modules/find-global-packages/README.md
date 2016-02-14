# find-global-packages

> one module to rule them all, one module to find them,
> one module to bring them all
>
> and in the darkness, lexically bind them

find all globally installed packages, resolving to a list of directories
representing global packages.

```javascript
var findGlobal = require('find-global-packages')

findGlobal(function(err, dirs) {
  // dirs will be a list of strings representing
  // paths to globally installed packages.
})
```

## API

### findGlobal(ready :Function(err :{Error|null}, dirs :Array\<String\>))

Takes a single node-style callback, resolves to either an error or a list
of directories. Directories are vetted by the presence of a file called
`package.json` (but not its contents).

## License

MIT
