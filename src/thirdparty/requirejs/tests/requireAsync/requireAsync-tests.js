define('a', {
    name: 'a'
});

require(['a', 'b'], function (a, b) {
    doh.register(
        "requireAsync",
        [
            function requireAsync(t){
                t.is('a', a.name);
                t.is('b', b.name);
            }
        ]
    );

    doh.run();
});

define('b', {
    name: 'b'
});
