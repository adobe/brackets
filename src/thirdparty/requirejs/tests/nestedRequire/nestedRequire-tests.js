require({
        baseUrl: './'
    },
    ['a'],
    function(a) {
        //This call then triggers another require call
        //for a loaded resource. Make sure it does not
        //trigger a double notification.
        a.doSomething();

        doh.register(
            'nestedRequire',
            [
                function nestedRequire(t){
                    t.is(1, a.counter);
                    t.is('base', a.base.name);
                }
            ]
        );
        doh.run();
    }
);
