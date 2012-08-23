/*
 * button_methods.js
 */
(function($) {


module("button: methods");

test("destroy", function() {
	var beforeHtml = $("#button").parent().html(),
		afterHtml = $("#button").button().button("destroy").parent().html();
	// Opera 9 outputs role="" instead of removing the attribute like everyone else
	if ($.browser.opera) {
		afterHtml = afterHtml.replace(/ role=""/g, "");
	}
	equal( afterHtml, beforeHtml );
});

})(jQuery);
