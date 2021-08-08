var doneCount = 0;
var master = new doh.Deferred();

function finish(a) {
    doh.is('a', a.name);
    doh.is('b', a.b.name);
    doh.is(2, a.ids.length);
    doh.is('b', a.ids[0]);
    doh.is('a', a.ids[1]);
    master.callback(true);
}

requirejs.onResourceLoad = function (context, map, depArray) {
    require(["a"], function(a) {
        doneCount += 1;
        a.add(map.id);

        if (doneCount === 2) {
            finish(a);
        }
    });
};

require({
        baseUrl: './'
    },
    ['a'],
    function(a, b) {

        doh.register(
            "onResourceLoadNestedRequire",
            [
                {
                    name: "onResourceLoadNestedRequire",
                    timeout: 5000,
                    runTest: function () {
                        return master;
                    }
                }
            ]
        );
        doh.run();
    }
);
