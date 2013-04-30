// test_before
var someVar = 1;

{{0}}function callMe(arg) {
    console.log('Called me ' + arg);
}{{1}}

// a comment
someVar = 2;

{{2}}function callAnother() {
    console.log('Called another');
}{{3}}

someVar = 3;
// test_after
var someVar = 1;

function callMe(arg) {
    // id = 0
    // before body
    console.log('Called me ' + arg);
    // after body
}

// a comment
someVar = 2;

function callAnother() {
    // id = 1
    // before body
    console.log('Called another');
    // after body
}

someVar = 3;