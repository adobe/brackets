/*global doh */
var master = new doh.Deferred();
//Register the test
doh.register(
    "definedSpecified",
    [
        {
            name: "definedSpecified",
            timeout: 5000,
            runTest: function () {
                'use strict';
                return master;
            }
        }
    ]
);
doh.run();

require.config({
    baseUrl: './'
});

define('tests', ['require', 'a', 'b'], function(require, a, b) {
    'use strict';
    doh.is(true, require.specified('a'));
    doh.is(true, require.specified('b'));
    doh.is(true, require.defined('a'));
    doh.is(true, require.defined('b'));
    master.callback(true);
});

require(['tests']);

