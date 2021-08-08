require(["require", "spell", "a/../b"], function(require, spell, b) {
    doh.register(
        "dotTrim",
        [
            function dotTrim(t){
                t.is('spell', spell.name);
                t.is('ext', spell.ext.name);
                t.is('./util/helper', spell.ext.helperPath);
                t.is('b', b.name);
                t.is('./b.html', require.toUrl('a/../b.html'));
                t.is('helper', spell.ext.helper.name);
            }
        ]
    );

    doh.run();
});
