/*
 * selectable_methods.js
 */
(function($) {

module("selectable: methods");

test("init", function() {
	expect(6);

	$("<div></div>").appendTo('body').selectable().remove();
	ok(true, '.selectable() called on element');

	$([]).selectable().remove();
	ok(true, '.selectable() called on empty collection');

	$("<div></div>").selectable().remove();
	ok(true, '.selectable() called on disconnected DOMElement');

	$("<div></div>").selectable().selectable("foo").remove();
	ok(true, 'arbitrary method called after init');

	el = $("<div></div>").selectable();
	var foo = el.selectable("option", "foo");
	el.remove();
	ok(true, 'arbitrary option getter after init');

	$("<div></div>").selectable().selectable("option", "foo", "bar").remove();
	ok(true, 'arbitrary option setter after init');
});

test("destroy", function() {
	$("<div></div>").appendTo('body').selectable().selectable("destroy").remove();
	ok(true, '.selectable("destroy") called on element');

	$([]).selectable().selectable("destroy").remove();
	ok(true, '.selectable("destroy") called on empty collection');

	$("<div></div>").selectable().selectable("destroy").remove();
	ok(true, '.selectable("destroy") called on disconnected DOMElement');

	$("<div></div>").selectable().selectable("destroy").selectable("foo").remove();
	ok(true, 'arbitrary method called after destroy');

	var expected = $('<div></div>').selectable(),
		actual = expected.selectable('destroy');
	equal(actual, expected, 'destroy is chainable');
});

test("enable", function() {
	expect(3);
	var expected, actual,
		fired = false;

	el = $("#selectable1");
	el.selectable({
		disabled: true,
		start: function() { fired = true; }
	});
	el.simulate("drag", 20, 20);
	equal(fired, false, "start fired");
	el.selectable("enable");
	el.simulate("drag", 20, 20);
	equal(fired, true, "start fired");
	el.selectable("destroy");

	expected = $('<div></div>').selectable();
	actual = expected.selectable('enable');
	equal(actual, expected, 'enable is chainable');
});

test("disable", function() {
	expect(3);
	var expected, actual,
		fired = false;

	el = $("#selectable1");
	el.selectable({
		disabled: false,
		start: function() { fired = true; }
	});
	el.simulate("drag", 20, 20);
	equal(fired, true, "start fired");
	el.selectable("disable");
	fired = false;
	el.simulate("drag", 20, 20);
	equal(fired, false, "start fired");
	el.selectable("destroy");

	expected = $('<div></div>').selectable();
	actual = expected.selectable('disable');
	equal(actual, expected, 'disable is chainable');
});

})(jQuery);
