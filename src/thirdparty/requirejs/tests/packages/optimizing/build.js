({
    appDir: '.',
    baseUrl: '.',
    dir: 'built',
    optimize: 'none',

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
    ],

    modules: [
        { name: "main" },
        { name: "engine" },
        { name: "tires" },
        { name: "fuel" }
    ]

})