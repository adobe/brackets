// test_before
{{0}}function outer() {
    var outerVar = 1, outerVar2 = 2;
    var outerFuncVar = {{2}}function (args) {
        console.log("outerFuncVar");
    }{{3}};
    
    {{4}}function outerFuncDef(args) {
        var innerVar = 3;
        console.log("outerFuncDef");
    }{{5}};
}{{1}}
// test_after nextId=3
function outer() {
    // id = 0
    // hasParentId = false
    // parentId = 
    // vars = outerVar outerVar2 outerFuncVar outerFuncDef
    // before body
    var outerVar = 1, outerVar2 = 2;
    var outerFuncVar = function (args) {
        // id = 1
        // hasParentId = true
        // parentId = 0
        // vars = 
        // before body
        console.log("outerFuncVar");
        // after body
    };
    
    function outerFuncDef(args) {
        // id = 2
        // hasParentId = true
        // parentId = 0
        // vars = innerVar
        // before body
        var innerVar = 3;
        console.log("outerFuncDef");
        // after body
    };
    // after body
}