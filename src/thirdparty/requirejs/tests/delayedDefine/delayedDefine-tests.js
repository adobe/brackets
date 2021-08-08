var globals = {};
var master = new doh.Deferred();

define('a', ['b'], function (b) {
    globals.a = 'a';
});

define('b', function () {
    return (globals.b = 'b');
});

define('c', function () {
    globals.c = 'c';
});

//Register the test
doh.register(
    "delayedDefine",
    [
        {
            name: "delayedDefine",
            timeout: 5000,
            runTest: function () {
                return master;
            }
        }
    ]
);
doh.run();

//At this point no require calls, so there should be no globals.
doh.is(undefined, globals.a);
doh.is(undefined, globals.b);
doh.is(undefined, globals.c);


require({
        baseUrl: './'
    },
    ['a'],
    function(a) {
        doh.is('a', globals.a);
        doh.is('b', globals.b);
        doh.is(undefined, globals.c);

        setTimeout(function () {
            //Make sure nothing new is defined after this require callback.
            doh.is('a', globals.a);
            doh.is('b', globals.b);
            doh.is(undefined, globals.c);
            master.callback(true);
        }, 15);
    }
);
