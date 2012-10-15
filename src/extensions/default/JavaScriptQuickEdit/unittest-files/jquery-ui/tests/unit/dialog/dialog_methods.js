/*
 * dialog_methods.js
 */
(function($) {

module("dialog: methods", {
	teardown: function() {
		$("body>.ui-dialog").remove();
	}
});

test("init", function() {
	expect(6);

	$("<div></div>").appendTo('body').dialog().remove();
	ok(true, '.dialog() called on element');

	$([]).dialog().remove();
	ok(true, '.dialog() called on empty collection');

	$('<div></div>').dialog().remove();
	ok(true, '.dialog() called on disconnected DOMElement - never connected');

	$('<div></div>').appendTo('body').remove().dialog().remove();
	ok(true, '.dialog() called on disconnected DOMElement - removed');

	el = $('<div></div>').dialog();
	var foo = el.dialog("option", "foo");
	el.remove();
	ok(true, 'arbitrary option getter after init');

	$('<div></div>').dialog().dialog("option", "foo", "bar").remove();
	ok(true, 'arbitrary option setter after init');
});

test("destroy", function() {
	$("<div></div>").appendTo('body').dialog().dialog("destroy").remove();
	ok(true, '.dialog("destroy") called on element');

	$([]).dialog().dialog("destroy").remove();
	ok(true, '.dialog("destroy") called on empty collection');

	$('<div></div>').dialog().dialog("destroy").remove();
	ok(true, '.dialog("destroy") called on disconnected DOMElement');

	var expected = $('<div></div>').dialog(),
		actual = expected.dialog('destroy');
	equal(actual, expected, 'destroy is chainable');
});

test("enable", function() {
	var expected = $('<div></div>').dialog(),
		actual = expected.dialog('enable');
	equal(actual, expected, 'enable is chainable');

	el = $('<div></div>').dialog({ disabled: true });
	el.dialog('enable');
	equal(el.dialog('option', 'disabled'), false, 'enable method sets disabled option to false');
	ok(!dlg().hasClass('ui-dialog-disabled'), 'enable method removes ui-dialog-disabled class from ui-dialog element');
});

test("disable", function() {
	var expected = $('<div></div>').dialog(),
		actual = expected.dialog('disable');
	equal(actual, expected, 'disable is chainable');

	el = $('<div></div>').dialog({ disabled: false });
	el.dialog('disable');
	equal(el.dialog('option', 'disabled'), true, 'disable method sets disabled option to true');
	ok(dlg().hasClass('ui-dialog-disabled'), 'disable method adds ui-dialog-disabled class to ui-dialog element');
});

test("close", function() {
	var expected = $('<div></div>').dialog(),
		actual = expected.dialog('close');
	equal(actual, expected, 'close is chainable');

	el = $('<div></div>').dialog();
	ok(dlg().is(':visible') && !dlg().is(':hidden'), 'dialog visible before close method called');
	el.dialog('close');
	ok(dlg().is(':hidden') && !dlg().is(':visible'), 'dialog hidden after close method called');
});

test("isOpen", function() {
	expect(4);

	el = $('<div></div>').dialog();
	equal(el.dialog('isOpen'), true, "dialog is open after init");
	el.dialog('close');
	equal(el.dialog('isOpen'), false, "dialog is closed");
	el.remove();

	el = $('<div></div>').dialog({autoOpen: false});
	equal(el.dialog('isOpen'), false, "dialog is closed after init");
	el.dialog('open');
	equal(el.dialog('isOpen'), true, "dialog is open");
	el.remove();
});

test("moveToTop", function() {
	var d1, d2, dlg1, dlg2,
		expected = $('<div></div>').dialog(),
		actual = expected.dialog('moveToTop');
	equal(actual, expected, 'moveToTop is chainable');

	d1 = $('<div></div>').dialog();
	dlg1 = d1.parents('.ui-dialog');
	d1.dialog('close');
	d1.dialog('open');
	d2 = $('<div></div>').dialog();
	dlg2 = d2.parents('.ui-dialog');
	d2.dialog('close');
	d2.dialog('open');
	ok(dlg1.css('zIndex') < dlg2.css('zIndex'), 'dialog 1 under dialog 2 before moveToTop method called');
	d1.dialog('moveToTop');
	ok(dlg1.css('zIndex') > dlg2.css('zIndex'), 'dialog 1 above dialog 2 after moveToTop method called');
});

test("open", function() {
	var expected = $('<div></div>').dialog(),
		actual = expected.dialog('open');
	equal(actual, expected, 'open is chainable');

	el = $('<div></div>').dialog({ autoOpen: false });
	ok(dlg().is(':hidden') && !dlg().is(':visible'), 'dialog hidden before open method called');
	el.dialog('open');
	ok(dlg().is(':visible') && !dlg().is(':hidden'), 'dialog visible after open method called');
});

})(jQuery);
