/*jslint */
/*global requirejs: false, doh: false, document: false */

requirejs.config({
    paths: {
        domReady: '../../../domReady/domReady'
    }
});

//Event handlers can fire out of order, so way until both have fired before
//doing the final test.
var finishCounter = 0;
function finished() {
    finishCounter += 1;
    if (finishCounter === 2) {
        doh.register(
            "domReady",
            [
                function domReady(t) {
                    t.is('one', document.getElementById('one').getAttribute('data-name'));
                    t.is('two', document.getElementById('two').getAttribute('data-name'));
                }
            ]
        );
        doh.run();
    }
}

requirejs(['domReady'], function (domReady) {
    requirejs(['one'], function (one) {
        domReady(function () {
            one.addToDom();
            finished();
        });
    });

    requirejs(['two'], function (two) {
        domReady(function () {
            two.addToDom();
            finished();
        });
    });
});