"use strict";

var Q = require("../q");

function eventually(value) {
    return Q.delay(value, 1000);
}

Q.all([1, 2, 3].map(eventually))
.done(function (result) {
    console.log(x);
});

Q.all([
    eventually(10),
    eventually(20)
])
.spread(function (x, y) {
    console.log(x, y);
})
.done();
