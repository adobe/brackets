require.config({
    packages: [
        {
            name: 'engine',
            location: 'packages/engine'
        },
        {
            name: 'tires',
            location: 'packages/tires'
        },
        {
            name: 'fuel',
            location: 'packages/fuel'
        }
    ]
});

define(['engine', 'tires', 'fuel'], function (engine, tires, fuel) {

    doh.register(
        "optimizingPackages",
        [
            function optimizingPackages(t){
                t.is("engine", engine.name);
                t.is("pistons", engine.pistonsName);
                t.is("sparkplugs", engine.sparkplugsName);
                t.is("tires", tires.name);
                t.is("fuel", fuel.name);
            }
        ]
    );
    doh.run();

});
