var enableGlobalPackages = require('./index');

enableGlobalPackages.on('error', function (err) {
  console.log('enableGlobalPackages-error', err);
});

enableGlobalPackages.on('ready', function (dirs) {
  console.log('enableGlobalPackages-ready', dirs);
});
