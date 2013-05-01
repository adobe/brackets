// test_before
{{0}}function callMe() {
    console.log('Called me');
}{{1}}
// test_after
function callMe() {
    // id = 0
    // before body
    console.log('Called me');
    // after body
}