
//Trailing comma is there ON PURPOSE
require(['a',], function(a) {
    doh.register(
        "trailingComma",
        [
            function trailingComma(t){
                t.is('a', a.name, 'a.name is a');
            }
        ]
    );
    doh.run();
});
