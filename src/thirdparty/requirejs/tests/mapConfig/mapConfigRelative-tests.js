define('lib/b', [], { name: 'b' });

define('b1', [], { name: 'b1' });

define('lib/a', ['./b'], function(b) {
    return {
        name: 'a',
        b: b
    };
});

require({
    map: {
        'lib/a': {
            'lib/b': 'b1'
        }
    }
},['lib/a'], function(a) {
    doh.register(
        'mapConfigRelative',
        [
            function mapConfigRelative(t){
                t.is('a', a.name);
                t.is('b1', a.b.name);
            }
        ]
    );
    doh.run();
});
