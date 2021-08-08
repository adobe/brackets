
var globals = {};

define('plug',{
    load: function () {
        throw new Error('Cannot dynamically load');
    }
});

define('app/test',[], function() {
    return { name: 'test' };
});

define('app/test2',[], function() {
    return { name: 'test2' };
});

define('plug!app/main',["!app/test", "!app/test2"], function(test, test2) {
    return {
        name: 'main',
        test: test,
        test2: test2
    };
});

require(["plug!app/main"],
    function(main) {
        globals.main = main;
    }
);
define("app/run", function(){});


require({
        baseUrl: "./"
    },
    ["app/run"],
    function() {
        require(["plug!app/main"], function () {
            doh.register(
                "requirePluginLoad",
                [
                    function requirePluginLoad(t){
                        var main = globals.main;

                        t.is("main", main.name);
                        t.is("test", main.test.name);
                        t.is("test2", main.test2.name);
                    }
                ]
            );

            doh.run();
        });
    }
);
