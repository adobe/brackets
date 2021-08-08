require({baseUrl: requirejs.isBrowser ? "./" : "./universal/"}, ["spell"], function(spell) {
    doh.register(
        "universal",
        [
            function universal(t){
                t.is('spell', spell.name);
                t.is('newt', spell.newtName);
                t.is('tail', spell.tailName);
                t.is('eye', spell.eyeName);
            }
        ]
    );

    doh.run();
});
