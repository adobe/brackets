/*
 * draggable_methods.js
 */
(function($) {

function shouldmove(why) {
	drag(el, 50, 50);
	moved(50, 50, why);
}

function shouldnotmove(why) {
	drag(el, 50, 50);
	moved(0, 0, why);
}

module("draggable: methods");

test("init", function() {
	expect(6);

	$("<div></div>").appendTo('body').draggable().remove();
	ok(true, '.draggable() called on element');

	$([]).draggable();
	ok(true, '.draggable() called on empty collection');

	$("<div></div>").draggable();
	ok(true, '.draggable() called on disconnected DOMElement');

	$("<div></div>").draggable().draggable("foo");
	ok(true, 'arbitrary method called after init');

	$("<div></div>").draggable().draggable("option", "foo");
	ok(true, 'arbitrary option getter after init');

	$("<div></div>").draggable().draggable("option", "foo", "bar");
	ok(true, 'arbitrary option setter after init');
});

test("destroy", function() {
	$("<div></div>").appendTo('body').draggable().draggable("destroy").remove();
	ok(true, '.draggable("destroy") called on element');

	$([]).draggable().draggable("destroy");
	ok(true, '.draggable("destroy") called on empty collection');

	$("<div></div>").draggable().draggable("destroy");
	ok(true, '.draggable("destroy") called on disconnected DOMElement');

	$("<div></div>").draggable().draggable("destroy").draggable("foo");
	ok(true, 'arbitrary method called after destroy');

	var expected = $('<div></div>').draggable(),
		actual = expected.draggable('destroy');
	equal(actual, expected, 'destroy is chainable');
});

test("enable", function() {
	expect(7);
	el = $("#draggable2").draggable({ disabled: true });
	shouldnotmove('.draggable({ disabled: true })');
	el.draggable("enable");
	shouldmove('.draggable("enable")');
	equal(el.draggable("option", "disabled"), false, "disabled option getter");

	el.draggable("destroy");
	el.draggable({ disabled: true });
	shouldnotmove('.draggable({ disabled: true })');
	el.draggable("option", "disabled", false);
	equal(el.draggable("option", "disabled"), false, "disabled option setter");
	shouldmove('.draggable("option", "disabled", false)');

	var expected = $('<div></div>').draggable(),
		actual = expected.draggable('enable');
	equal(actual, expected, 'enable is chainable');
});

test("disable", function() {
	expect(7);
	el = $("#draggable2").draggable({ disabled: false });
	shouldmove('.draggable({ disabled: false })');
	el.draggable("disable");
	shouldnotmove('.draggable("disable")');
	equal(el.draggable("option", "disabled"), true, "disabled option getter");

	el.draggable("destroy");

	el.draggable({ disabled: false });
	shouldmove('.draggable({ disabled: false })');
	el.draggable("option", "disabled", true);
	equal(el.draggable("option", "disabled"), true, "disabled option setter");
	shouldnotmove('.draggable("option", "disabled", true)');

	var expected = $('<div></div>').draggable(),
		actual = expected.draggable('disable');
	equal(actual, expected, 'disable is chainable');
});

})(jQuery);
