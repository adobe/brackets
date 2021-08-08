define('components/one/One', ['jquery'], function () {
    return {
        name: 'One'
    };
});

require([], function () {
    require({
        paths : {
            'jquery' : 'http://code.jquery.com/jquery-1.7.2.min'
        }
    },
    [
        'components/one/One'
    ], function (One) {
        doh.register(
            "nestedRequireConfig",
            [
                function nestedRequireConfig(t){
                    t.is('One', One.name);
                    t.is(true, !!jQuery);
                }
            ]
        );
        doh.run();
    });

});
define("nestedRequireConfig", function(){});