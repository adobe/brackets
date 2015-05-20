/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define*/

define(function(require) {
    "use strict";

    var slowparse = require("slowparse/slowparse");
    var errorMessages = require("text!slowparse/locale/en_US.json");
    errorMessages = JSON.parse(errorMessages);

    function render(html, context) {
        var replaceText = {
            closeTag: context.closeTag && context.closeTag.name ? context.closeTag.name : "",
            openTag: context.openTag && context.openTag.name ? context.openTag.name : "",
            attribute: context.attribute && context.attribute.name && context.attribute.name.value ? context.attribute.name.value : "",
            cssValue: context.cssValue && context.cssValue.value ? context.cssValue.value : "",
            cssSelector: context.cssSelector && context.cssSelector.selector ?  context.cssSelector.selector : "",
            cssProperty: context.cssProperty && context.cssProperty.property ? context.cssProperty.property : "",
            cssKeyword: context.cssKeyword && context.cssKeyword.value ? context.cssKeyword.value : "",
            name: context.name || "",
            error: context.error && context.error.msg ? context.error.msg : "",
            value: context.value || ""
        };

        return html
                .replace(/\[\[closeTag\.name\]\]/g, replaceText.closeTag)
                .replace(/\[\[openTag\.name\]\]/g, replaceText.openTag)
                .replace(/\[\[attribute\.name\.value\]\]/g, replaceText.attribute)
                .replace(/\[\[cssValue\.value\]\]/g, replaceText.cssValue)
                .replace(/\[\[cssSelector\.selector\]\]/g, replaceText.cssSelector)
                .replace(/\[\[cssProperty\.property\]\]/g, replaceText.cssProperty)
                .replace(/\[\[cssKeyword\.value\]\]/g, replaceText.cssKeyword)
                .replace(/\[\[name\]\]/g, replaceText.name)
                .replace(/\[\[error\.msg\]\]/g, replaceText.error)
                .replace(/\[\[value\]\]/g, replaceText.value);
    }

    function parse(input) {
        var result = slowparse.HTML(document, input);
        var error;

        if(result.error) {
            error = {};
            error.message = render(errorMessages[result.error.type], result.error);
            error.cursor = result.error.cursor;
        }

        return error;
    }

    return parse;
});
