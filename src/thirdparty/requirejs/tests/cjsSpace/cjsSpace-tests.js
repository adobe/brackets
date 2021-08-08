require({
        baseUrl: './'
    },
    ['a'],
    function(a) {
        doh.register(
            'cjsSpace',
            [
                function cjsSpace(t){
                    t.is('a', a.name);
                    t.is('b', a.b.name);
                }
            ]
        );
        doh.run();
    }
);
