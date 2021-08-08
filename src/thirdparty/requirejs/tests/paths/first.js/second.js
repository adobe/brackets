define(['./first'], function () {
    return function (id, parentRequire, loaded) {
        loaded({
            name: 'first',
            secondName: 'second'
        });
    };
});
