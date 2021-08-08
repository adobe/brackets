require({
    packages: [{
        name: 'foo',
        main: 'lib/index'
    }]
}, ['foo'], function (foo) {

    doh.register(
        'packagesNestedMain',
        [
            function packagesNestedMain(t){
                t.is('foo', foo.name);
                t.is('bar', foo.bar.name);
            }
        ]
    );
    doh.run();
});
