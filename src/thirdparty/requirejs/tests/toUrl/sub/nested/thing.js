define(function (require) {
    return {
        noext: require('text!../noext'),
        dirPath: require.toUrl('.'),
        parentPath: require.toUrl('..')
    };
});