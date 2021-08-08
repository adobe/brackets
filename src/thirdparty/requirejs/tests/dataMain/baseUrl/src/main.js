define(['a'], function (a) {
    doh.register(
        "dataMainBaseUrl",
        [
            function dataMainBaseUrl(t){
                t.is("a", a.name);
            }
        ]
    );
    doh.run();
});
