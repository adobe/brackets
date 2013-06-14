/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */
define(["credits", "products"], function (credits, products) {
    'use strict';
    return {
        purchaseProduct: function () {
            var credit = credits.getCredits();
            if (credit > 0) {
                products.reserveProduct();
                return true;
            }
            return false;
        }
    };
});
