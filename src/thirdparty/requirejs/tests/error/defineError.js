define(['a'], function (a) {
    return {
        name: 'hasDefineError',
        broken: a.doesNotExist.blowsUp
    };
});
