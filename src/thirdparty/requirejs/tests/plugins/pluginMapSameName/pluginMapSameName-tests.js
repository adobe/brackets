require({
    map: {
        '*': {
            'plugin': 'plugin/plugin'
        }
    }
}, ['plugin!foo'], function (value) {

    doh.register(
        'pluginMapSameName',
        [
            function pluginMapSameName(t){
                t.is('foo', value);
            }
        ]
    );
    doh.run();

});
