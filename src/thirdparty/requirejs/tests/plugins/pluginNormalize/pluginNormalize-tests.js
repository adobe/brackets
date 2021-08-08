require(['modA!modB!no-dotdot',
         'modA!modB!../one-dotdot',
         'modA!modB!../../two-dotdot-is-broken'], function (a, b, c) {

    doh.register(
        "pluginNormalize",
        [
            function pluginNormalize(t){
                t.is('no-dotdot-foo', a);
                t.is('../one-dotdot-foo', b);
                t.is('../../two-dotdot-is-broken-foo', c);
            }
        ]
    );

    doh.run();
});
