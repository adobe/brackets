/**
 * @fileoverview Rule to flag creation of jquery deferreds without new operator
 * @author Ingo Richter
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {

    "use strict";

    return {
        "CallExpression": function (node) {
            var callee = node.callee;
            if (callee.object) {
                if ((callee.object.name === "$" || callee.object.name === "jQuery") && callee.property.name === "Deferred") {
                    context.report(node, "avoid creating jQuery Deferreds without new operator.");
                }
            }
        }
    };
};
