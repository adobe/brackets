// before
{{0}}function callMe() {
    console.log('Called me');
}{{1}}
// after
function callMe() {
    return (
        (window.__bkld_fndefs && window.__bkld_fndefs[0]) ?
            (typeof window.__bkld_fndefs[0] === 'function' ? 
                window.__bkld_fndefs[0] :
                eval('window.__bkld_fndefs[0] = ' + window.__bkld_fndefs[0])) :
            function () { 
                console.log('Called me');
            }
    ).apply(this, arguments);
}