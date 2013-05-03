// test_before
{{0}}function callMe() {
    console.log('Called me');
}{{1}}
// test_after nextId=1
function callMe() {
    // id = 0
    // hasParentId = false
    // parentId = 
    // vars = 
    // before body
    console.log('Called me');
    // after body
}