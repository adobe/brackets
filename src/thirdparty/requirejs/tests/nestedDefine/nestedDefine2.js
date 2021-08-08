
require(['one'], function (one) {

    define('nested', ['two'], function (two) {
        return {
            name: 'nested',
            two: two
        };
    });

    require(['nested'], function (nested) {
        doh.register(
            "nestedDefine2",
            [
                function nestedDefine2(t) {
                    t.is("one", one.name);
                    t.is("two", nested.two.name);
                    t.is("nested", nested.name);
                }
            ]
        );
        doh.run();
    });
});
