/*global $, brackets, define, MutationObserver*/

define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    function watchChildren(target, selector, callback, options) {

        options = options || {};

        // create an observer instance
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {

                _.toArray(mutation.addedNodes)
                    .map(function (node) {
                        return $(node).find(selector);
                    })
                    .filter(function ($result) {
                        return $result.length > 0;
                    })
                    .forEach(function (match) {

                        // notify callback about every match
                        match.each(function () {
                            callback($(this));
                        });

                        // disconnect watcher if required
                        if (options.watchOnce) {
                            observer.disconnect();
                        }

                    });

            });
        });

        // pass in the target node, as well as the observer options
        target = target.jquery ? target.toArray() : [target];
        target.forEach(function (el) {
            observer.observe(el, {
                attributes: false,
                childList: true,
                characterData: false
            });
        });

    }

    exports.watchChildren = watchChildren;

});
