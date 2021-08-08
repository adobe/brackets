
var master = new doh.Deferred();

doh.register(
    "pluginsOnError",
    [
        {
            name: "pluginsOnError",
            timeout: 5000,
            runTest: function () {
                return master;
            }
        }
    ]
);
doh.run();

require({
        baseUrl: requirejs.isBrowser ? "./" : "./plugins/onerror",
        enforceDefine: true
},      ['thrower!'],
function (thrower) {
    master.callback(false);
},
function (err) {
    master.callback(true);
});

//Since enforceDefine is used below, define somthing here.
define({});
