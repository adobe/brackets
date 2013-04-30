// before
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
// after
var someVar = 1;

function callMe(arg) {
    return (
        (window.__bkld_fndefs && window.__bkld_fndefs[0]) ?
            (typeof window.__bkld_fndefs[0] === 'function' ? 
                window.__bkld_fndefs[0] :
                eval('window.__bkld_fndefs[0] = ' + window.__bkld_fndefs[0])) :
            function () { 
                console.log('Called me ' + arg);
                
                // Simple nested
                function nested1() {
                    return (
                        (window.__bkld_fndefs && window.__bkld_fndefs[1]) ?
                            (typeof window.__bkld_fndefs[1] === 'function' ? 
                                window.__bkld_fndefs[1] :
                                eval('window.__bkld_fndefs[1] = ' + window.__bkld_fndefs[1])) :
                            function () { 
                                console.log("nested1");
                            }
                    ).apply(this, arguments);
                }
            }
    ).apply(this, arguments);
}

// a comment
someVar = 2;

function callAnother() {
    return (
        (window.__bkld_fndefs && window.__bkld_fndefs[2]) ?
            (typeof window.__bkld_fndefs[2] === 'function' ? 
                window.__bkld_fndefs[2] :
                eval('window.__bkld_fndefs[2] = ' + window.__bkld_fndefs[2])) :
            function () {
                console.log('Called another');

                // Nested as callback
                callWithCallback(function (cbArg) {
                    return (
                        (window.__bkld_fndefs && window.__bkld_fndefs[3]) ?
                            (typeof window.__bkld_fndefs[3] === 'function' ? 
                                window.__bkld_fndefs[3] :
                                eval('window.__bkld_fndefs[3] = ' + window.__bkld_fndefs[3])) :
                            function () { 
                                console.log("callback " + cbArg);
                            }
                    ).apply(this, arguments);
                });
            }
    ).apply(this, arguments);
}

someVar = 3;