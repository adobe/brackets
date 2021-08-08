require({
    config: {
        a: {
            id: 'magic'
        },
        multilevel: {
            start: 'start',
            nested: {
                sub: {
                    id: 'sub',
                    regExp: /bad/,

                }
            }
        }
    }
});

define('multilevel', ['module'], function (module) {
    return module.config();
});

require({
        baseUrl: './',
        config: {
            'b/c': {
                id: 'beans'
            },
            multilevel: {
                end: 'end',
                nested: {
                    sub: {
                        values: ['a', 'b'],
                        regExp: /good/,
                        fn: function () { return 'ok'; }
                    }
                }
            }
        }
    },
    ['a', 'b/c', 'plain', 'multilevel'],
    function(a, c, plain, m) {
        doh.register(
            'moduleConfig',
            [
                function moduleConfig(t){
                    t.is('magic', a.type);
                    t.is('beans', c.food);
                    t.is('plain', plain.id);

                    t.is('start', m.start);
                    t.is('end', m.end);
                    t.is('sub', m.nested.sub.id);
                    t.is(true, m.nested.sub.regExp.test('good'));
                    t.is('a', m.nested.sub.values[0]);
                    t.is('b', m.nested.sub.values[1]);
                    t.is('ok', m.nested.sub.fn());

                }
            ]
        );
        doh.run();
    }
);
