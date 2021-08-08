define([], function() {
    doh.register(
        "testBaseUrl", 
        [
            function testBaseUrl(t){
                t.is(true, true);
            }
        ]
    );
    doh.run();
});