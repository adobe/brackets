require({
        baseUrl: requirejs.isBrowser ? "./" : "./plugins/"
},      ['require', 'nameOnly!'],
function (require,   nameOnly) {

    doh.register(
        "pluginsNameOnly",
        [
            function pluginsNameOnly(t){
                t.is("nameOnly", nameOnly.name);
             }
        ]
    );
    doh.run();
});
