log("two.js script");
setTimeout(function () {
    log("two.js timeout -- should occur after two.js load");
}, 13);