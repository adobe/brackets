require({
    "baseUrl": "./scripts/",
    "paths": {
        "jquery": "http://ajax.microsoft.com/ajax/jQuery/jquery-1.7.1.min"
        //"jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min"
    },
    priority: ['jquery']
});

define(["jquery.gamma", "jquery.epsilon"], function() {

    $(function () {
        doh.is('epsilon', $('body').epsilon());
        doh.is('epsilon', $('body').epsilon());
        readyFired();
    });

});
