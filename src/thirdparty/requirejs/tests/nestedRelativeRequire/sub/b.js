define(function(require) {
    doh.register(
        'nestedRelativeRequire',
        [
            function nestedRelativeRequire(t){
                //Just confirm it loaded.
                t.is(true, true);
            }
        ]
    );
    doh.run();
});
