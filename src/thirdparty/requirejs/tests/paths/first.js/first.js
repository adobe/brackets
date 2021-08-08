globalCounter += 1;

define(['./second'], function (second) {
    globalCounter += 1;
    return {
        load: second
    };
});
