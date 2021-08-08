define(['./pistons', './sparkplugs'], function (pistons, sparkplugs) {
    return {
        name: 'engine',
        pistonsName: pistons.name,
        sparkplugsName: sparkplugs.name
    };
});