// before
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
            }
    ).apply(this, arguments);
}

// a comment
someVar = 2;

function callAnother() {
    return (
        (window.__bkld_fndefs && window.__bkld_fndefs[1]) ?
            (typeof window.__bkld_fndefs[1] === 'function' ? 
                window.__bkld_fndefs[1] :
                eval('window.__bkld_fndefs[1] = ' + window.__bkld_fndefs[1])) :
            function () { 
                console.log('Called another');
            }
    ).apply(this, arguments);
}

someVar = 3;