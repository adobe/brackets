/*jslint */
/*global requirejs: false, doh: false, document: false */

requirejs.config({
    paths: {
        domReady: '../../../domReady/domReady'
    }
});

//Event handlers can fire out of order, so way until both have fired before
//doing the final test.
var finishCounter = 0,
    master = new doh.Deferred();

function finished() {
    finishCounter += 1;
    if (finishCounter === 2) {
        master.callback(true);
    }
}

doh.register(
    "domReadyExtraConfig",
    [
        {
            name: "domReadyExtraConfig",
            timeout: 3000,
            runTest: function () {
                return master;
            }
        }
    ]
);
doh.run();

requirejs(['domReady'], finished);

require(['domReady!'], finished);

//This should not cause a problem, but did before #398 was fixed.
require.config({ });
