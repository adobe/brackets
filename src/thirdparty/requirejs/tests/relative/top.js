
define(function () {
    require.relativeBaseUrlCounter += 1;
    return {
        id: require.relativeBaseUrlCounter
    };
});
