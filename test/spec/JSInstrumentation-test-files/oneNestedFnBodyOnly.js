// test_before
function callMe(arg) {
    console.log('Called me ' + arg);
    
    // Simple nested
    {{2}}function nested1() {
        console.log("nested1");
    }{{3}}
}
// test_after nextId=2
console.log('Called me ' + arg);
                
    // Simple nested
    function nested1() {
        // id = 1
        // hasParentId = true
        // parentId = 0
        // vars = 
        // before body
        console.log("nested1");
        // after body
    }