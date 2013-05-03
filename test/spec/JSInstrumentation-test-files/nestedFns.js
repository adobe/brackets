// test_before
var someVar = 1;

{{0}}function callMe(arg) {
    console.log('Called me ' + arg);
    
    // Simple nested
    {{2}}function nested1() {
        console.log("nested1");
    }{{3}}
}{{1}}

// a comment
someVar = 2;

{{4}}function callAnother() {
    console.log('Called another');
    
    // Nested as callback
    callWithCallback({{6}}function (cbArg) {
        console.log("callback " + cbArg);
    }{{7}});
}{{5}}

someVar = 3;
// test_after nextId=4
var someVar = 1;

function callMe(arg) {
    // id = 0
    // hasParentId = false
    // parentId = 
    // vars = nested1
    // before body
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
    // after body
}

// a comment
someVar = 2;

function callAnother() {
    // id = 2
    // hasParentId = false
    // parentId = 
    // vars = 
    // before body
    console.log('Called another');

    // Nested as callback
    callWithCallback(function (cbArg) {
        // id = 3
        // hasParentId = true
        // parentId = 2
        // vars = 
        // before body
        console.log("callback " + cbArg);
        // after body
    });
    // after body
}

someVar = 3;