require(["require", "uno"],
function (require,   uno) {
    doh.register(
        "depoverlap",
        [
            function depoverlap(t){
                //First confirm there is only one script tag for each
                //module:
                var scripts = document.getElementsByTagName("script"),
                    i, counts = {}, modName, props, something;
                for (var i = scripts.length - 1; i > -1; i--) {
                    modName = scripts[i].getAttribute("data-requiremodule");
                    if (modName) {
                        if (!(modName in counts)) {
                            counts[modName] = 0;
                        }
                        counts[modName] += 1;
                    }
                }

                //Now that we counted all the modules make sure count
                //is always one.
                for (prop in counts) {
                    t.is(1, counts[prop]);
                }

                t.is("uno", uno.name);
                something = uno.doSomething();
                t.is("dos", something.dosName);
                t.is("tres", something.tresName);
            }
        ]
    );
    doh.run();
});
