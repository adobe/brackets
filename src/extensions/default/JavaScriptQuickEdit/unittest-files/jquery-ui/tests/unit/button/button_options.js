/*
 * button_options.js
 */
(function($) {

module("button: options");

test("disabled, explicit value", function() {
	$("#radio01").button({ disabled: false });
	deepEqual(false, $("#radio01").button("option", "disabled"),
		"disabled option set to false");
	deepEqual(false, $("#radio01").prop("disabled"), "element is disabled");

	$("#radio02").button({ disabled: true });
	deepEqual(true, $("#radio02").button("option", "disabled"),
		"disabled option set to true");
	deepEqual(true, $("#radio02").prop("disabled"), "element is not disabled");
});

test("disabled, null", function() {
	$("#radio01").button({ disabled: null });
	deepEqual(false, $("#radio01").button("option", "disabled"),
		"disabled option set to false");
	deepEqual(false, $("#radio01").prop("disabled"), "element is disabled");

	$("#radio02").prop("disabled", true).button({ disabled: null });
	deepEqual(true, $("#radio02").button("option", "disabled"),
		"disabled option set to true");
	deepEqual(true, $("#radio02").prop("disabled"), "element is not disabled");
});

test("text false without icon", function() {
	$("#button").button({
		text: false
	});
	ok( $("#button").is(".ui-button-text-only:not(.ui-button-icon-only)") );

	$("#button").button("destroy");
});

test("text false with icon", function() {
	$("#button").button({
		text: false,
		icons: {
			primary: "iconclass"
		}
	});
	ok( $("#button").is(".ui-button-icon-only:not(.ui-button-text):has(span.ui-icon.iconclass)") );

	$("#button").button("destroy");
});

test("label, default", function() {
	$("#button").button();
	deepEqual( $("#button").text(), "Label" );
	deepEqual( $( "#button").button( "option", "label" ), "Label" );

	$("#button").button("destroy");
});

test("label", function() {
	$("#button").button({
		label: "xxx"
	});
	deepEqual( $("#button").text(), "xxx" );
	deepEqual( $("#button").button( "option", "label" ), "xxx" );

	$("#button").button("destroy");
});

test("label default with input type submit", function() {
	deepEqual( $("#submit").button().val(), "Label" );
	deepEqual( $("#submit").button( "option", "label" ), "Label" );
});

test("label with input type submit", function() {
	var label = $("#submit").button({
		label: "xxx"
	}).val();
	deepEqual( label, "xxx" );
	deepEqual( $("#submit").button( "option", "label" ), "xxx" );
});

test("icons", function() {
	$("#button").button({
		text: false,
		icons: {
			primary: "iconclass",
			secondary: "iconclass2"
		}
	});
	ok( $("#button").is(":has(span.ui-icon.ui-button-icon-primary.iconclass):has(span.ui-icon.ui-button-icon-secondary.iconclass2)") );

	$("#button").button("destroy");
});

})(jQuery);
