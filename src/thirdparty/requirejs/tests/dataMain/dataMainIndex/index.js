define('a', {
    name: 'a'
});

define('index', ['a'], function (a) {
    doh.register(
        "dataMainIndex",
        [
            function dataMainIndex(t){
                t.is("a", a.name);
            }
        ]
    );
    doh.run();
});
