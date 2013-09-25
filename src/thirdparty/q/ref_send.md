
This API varies from Tyler Closes ref_send in the
following ways:

*   Promises can be resolved to function values.
*   Promises can be resolved to null or undefined.
*   Promises are distinguishable from arbitrary functions.
*   The promise API is abstracted with a Promise constructor
    that accepts a descriptor that receives all of the
    messages forwarded to that promise and handles the
    common patterns for message receivers.  The promise
    constructor also takes optional fallback and valueOf
    methods which handle the cases for missing handlers on
    the descriptor (rejection by default) and the valueOf
    call (which returns the promise itself by default)
*   near(ref) has been changed to Promise.valueOf() in
    keeping with JavaScript's existing Object.valueOf().
*   post(promise, name, args) has been altered to a variadic
    post(promise, name ...args)
*   variadic arguments are used internally where
    applicable. However, I have not altered the Q.post()
    API to expand variadic arguments since Tyler Close
    informed the CommonJS list that it would restrict
    usage patterns for web_send, posting arbitrary JSON
    objects as the "arguments" over HTTP.

