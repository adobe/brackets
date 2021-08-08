/*global doh */
require({
        baseUrl: './',
        map: {
            '*': {
                'd': 'adapter/d'
            },
            'adapter/d': {
                d: 'd'
            }
        }
    },
    ['e', 'adapter/d'],
    function(e, adapterD) {
        'use strict';
        doh.register(
            'mapConfigStarAdapter',
            [
                function mapConfigStarAdapter(t){
                    t.is('e', e.name);
                    t.is('d', e.d.name);
                    t.is(true, e.d.adapted);
                    t.is(true, adapterD.adapted);
                    t.is('d', adapterD.name);
                }
            ]
        );
        doh.run();
    }
);
