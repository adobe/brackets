require.config({
    paths: {
        text: '../../../text/text'
    }
});

require(['main'], function(main) {

    var subRegExp = /\/sub$/,
        nestedRegExp = /\/sub\/nested$/;

    doh.register(
        "toUrl",
        [
            function toUrl(t){
                var a, b, expected;

                a = require.toUrl('lib/../../bower_components/hello/src/modules/../hello.js');
                b = require.toUrl('lib/../../bower_components/hello/./src/hello.js');
                expected = './lib/../../bower_components/hello/src/hello.js';
                t.is(expected, a);
                t.is(a, b);

                a = require.toUrl('lib/../../../bower_components/hello/src/modules/../hello.js');
                b = require.toUrl('lib/../../../bower_components/hello/./src/hello.js');
                expected = './lib/../../../bower_components/hello/src/hello.js';
                t.is(expected, a);
                t.is(a, b);

                a = require.toUrl('../../../bower_components/hello/./src/modules/../hello.js');
                b = require.toUrl('../../../bower_components/hello/src/../src/hello.js');
                expected = './../../../bower_components/hello/src/hello.js';
                t.is(expected, a);
                t.is(a, b);

                a = require.toUrl('../../something/../bower_components/hello/./src/modules/../hello.js');
                b = require.toUrl('../../something/../bower_components/hello/src/../src/hello.js');
                expected = './../../bower_components/hello/src/hello.js';
                t.is(expected, a);
                t.is(a, b);

                t.is(".hidden", main.hidden);
                t.is("main.html", main.html);
                t.is("noext", main.noext);
                t.is("aux", main.util.auxHtml);
                t.is(true, subRegExp.test(main.util.dotPath));
                t.is("util", main.util.html);

                t.is(true, nestedRegExp.test(main.util.thing.dirPath));
                t.is(true, subRegExp.test(main.util.thing.parentPath));
                t.is("noext", main.util.thing.noext);
            }
        ]
    );
    doh.run();
});
