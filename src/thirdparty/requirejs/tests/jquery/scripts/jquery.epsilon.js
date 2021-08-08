(function () {
    //Define the plugin.
    function plugin($) {
        $.fn.epsilon = function() {
            return 'epsilon';
        };

        $(function () {
            doh.is('epsilon', $('body').epsilon());
            readyFired();
        });
    }

    //Register the plugin.
    if (typeof define !== 'undefined' && define.amd) {
        define(['jquery'], plugin);
    } else if (typeof jQuery !== 'undefined') {
        plugin(jQuery);
    }
}());
