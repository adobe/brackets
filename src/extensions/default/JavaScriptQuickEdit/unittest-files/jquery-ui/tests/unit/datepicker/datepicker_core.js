/*
 * datepicker_core.js
 */

function equalsDate(d1, d2, message) {
	if (!d1 || !d2) {
		ok(false, message + ' - missing date');
		return;
	}
	d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
	d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
	equal(d1.toString(), d2.toString(), message);
}

function equalsDateArray(a1, a2, message) {
	if (!a1 || !a2) {
		ok(false, message + ' - missing dates');
		return;
	}
	a1[0] = (a1[0] ? new Date(a1[0].getFullYear(), a1[0].getMonth(), a1[0].getDate()) : '');
	a1[1] = (a1[1] ? new Date(a1[1].getFullYear(), a1[1].getMonth(), a1[1].getDate()) : '');
	a2[0] = (a2[0] ? new Date(a2[0].getFullYear(), a2[0].getMonth(), a2[0].getDate()) : '');
	a2[1] = (a2[1] ? new Date(a2[1].getFullYear(), a2[1].getMonth(), a2[1].getDate()) : '');
	deepEqual(a1, a2, message);
}

function addMonths(date, offset) {
	var maxDay = 32 - new Date(date.getFullYear(), date.getMonth() + offset, 32).getDate();
	date.setDate(Math.min(date.getDate(), maxDay));
	date.setMonth(date.getMonth() + offset);
	return date;
}

function init(id, options) {
	$.datepicker.setDefaults($.datepicker.regional['']);
	return $(id).datepicker($.extend({showAnim: ''}, options || {}));
}

var PROP_NAME = 'datepicker';

(function($) {

module("datepicker: core");

test( "widget method - empty collection", function() {
	$( "#nonExist" ).datepicker(); // should create nothing
	ok( !$( "#ui-datepicker-div" ).length, "Non init on empty collection" );
});

test("widget method", function() {
	var actual = $("#inp").datepicker().datepicker("widget")[0];
	deepEqual($("body > #ui-datepicker-div:last-child")[0], actual);
});

test('baseStructure', function() {
	var header, title, table, thead, week, panel, inl, child,
		inp = init('#inp').focus(),
		dp = $('#ui-datepicker-div'),
		iframe = ($.browser.msie && parseInt($.browser.version, 10) < 7);
	ok(dp.is(':visible'), 'Structure - datepicker visible');
	ok(!dp.is('.ui-datepicker-rtl'), 'Structure - not right-to-left');
	ok(!dp.is('.ui-datepicker-multi'), 'Structure - not multi-month');
	equal(dp.children().length, 2 + (iframe ? 1 : 0), 'Structure - child count');

	header = dp.children(':first');
	ok(header.is('div.ui-datepicker-header'), 'Structure - header division');
	equal(header.children().length, 3, 'Structure - header child count');
	ok(header.children(':first').is('a.ui-datepicker-prev') && header.children(':first').html() !== '', 'Structure - prev link');
	ok(header.children(':eq(1)').is('a.ui-datepicker-next') && header.children(':eq(1)').html() !== '', 'Structure - next link');

	title = header.children(':last');
	ok(title.is('div.ui-datepicker-title') && title.html() !== '','Structure - title division');
	equal(title.children().length, 2, 'Structure - title child count');
	ok(title.children(':first').is('span.ui-datepicker-month') && title.children(':first').text() !== '', 'Structure - month text');
	ok(title.children(':last').is('span.ui-datepicker-year') && title.children(':last').text() !== '', 'Structure - year text');

	table = dp.children(':eq(1)');
	ok(table.is('table.ui-datepicker-calendar'), 'Structure - month table');
	ok(table.children(':first').is('thead'), 'Structure - month table thead');
	thead = table.children(':first').children(':first');
	ok(thead.is('tr'), 'Structure - month table title row');
	equal(thead.find('th').length, 7, 'Structure - month table title cells');
	ok(table.children(':eq(1)').is('tbody'), 'Structure - month table body');
	ok(table.children(':eq(1)').children('tr').length >= 4, 'Structure - month table week count');
	week = table.children(':eq(1)').children(':first');
	ok(week.is('tr'), 'Structure - month table week row');
	equal(week.children().length, 7, 'Structure - week child count');
	ok(week.children(':first').is('td.ui-datepicker-week-end'), 'Structure - month table first day cell');
	ok(week.children(':last').is('td.ui-datepicker-week-end'), 'Structure - month table second day cell');
	ok(dp.children('iframe').length === (iframe ? 1 : 0), 'Structure - iframe');
	inp.datepicker('hide').datepicker('destroy');

	// Editable month/year and button panel
	inp = init('#inp', {changeMonth: true, changeYear: true, showButtonPanel: true});
	inp.focus();

	title = dp.find('div.ui-datepicker-title');
	ok(title.children(':first').is('select.ui-datepicker-month'), 'Structure - month selector');
	ok(title.children(':last').is('select.ui-datepicker-year'), 'Structure - year selector');

	panel = dp.children(':last');
	ok(panel.is('div.ui-datepicker-buttonpane'), 'Structure - button panel division');
	equal(panel.children().length, 2, 'Structure - button panel child count');
	ok(panel.children(':first').is('button.ui-datepicker-current'), 'Structure - today button');
	ok(panel.children(':last').is('button.ui-datepicker-close'), 'Structure - close button');
	inp.datepicker('hide').datepicker('destroy');

	// Multi-month 2
	inp = init('#inp', {numberOfMonths: 2});
	inp.focus();
	ok(dp.is('.ui-datepicker-multi'), 'Structure multi [2] - multi-month');
	equal(dp.children().length, 3 + (iframe ? 1 : 0), 'Structure multi [2] - child count');
	child = dp.children(':first');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-first'), 'Structure multi [2] - first month division');
	child = dp.children(':eq(1)');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-last'), 'Structure multi [2] - second month division');
	child = dp.children(':eq(2)');
	ok(child.is('div.ui-datepicker-row-break'), 'Structure multi [2] - row break');
	ok(dp.is('.ui-datepicker-multi-2'), 'Structure multi [2] - multi-2');
	inp.datepicker('hide').datepicker('destroy');

	// Multi-month 3
	inp = init('#inp', {numberOfMonths: 3});
	inp.focus();
	ok(dp.is('.ui-datepicker-multi-3'), 'Structure multi [3] - multi-3');
	ok(! dp.is('.ui-datepicker-multi-2'), 'Structure multi [3] - Trac #6704');
	inp.datepicker('hide').datepicker('destroy');

	// Multi-month [2, 2]
	inp = init('#inp', {numberOfMonths: [2, 2]});
	inp.focus();
	ok(dp.is('.ui-datepicker-multi'), 'Structure multi - multi-month');
	equal(dp.children().length, 6 + (iframe ? 1 : 0), 'Structure multi [2,2] - child count');
	child = dp.children(':first');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-first'), 'Structure multi [2,2] - first month division');
	child = dp.children(':eq(1)');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-last'), 'Structure multi [2,2] - second month division');
	child = dp.children(':eq(2)');
	ok(child.is('div.ui-datepicker-row-break'), 'Structure multi [2,2] - row break');
	child = dp.children(':eq(3)');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-first'), 'Structure multi [2,2] - third month division');
	child = dp.children(':eq(4)');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-last'), 'Structure multi [2,2] - fourth month division');
	child = dp.children(':eq(5)');
	ok(child.is('div.ui-datepicker-row-break'), 'Structure multi [2,2] - row break');
	inp.datepicker('hide').datepicker('destroy');

	// Inline
	inl = init('#inl');
	dp = inl.children();
	ok(dp.is('.ui-datepicker-inline'), 'Structure inline - main div');
	ok(!dp.is('.ui-datepicker-rtl'), 'Structure inline - not right-to-left');
	ok(!dp.is('.ui-datepicker-multi'), 'Structure inline - not multi-month');
	equal(dp.children().length, 2, 'Structure inline - child count');
	header = dp.children(':first');
	ok(header.is('div.ui-datepicker-header'), 'Structure inline - header division');
	equal(header.children().length, 3, 'Structure inline - header child count');
	table = dp.children(':eq(1)');
	ok(table.is('table.ui-datepicker-calendar'), 'Structure inline - month table');
	ok(table.children(':first').is('thead'), 'Structure inline - month table thead');
	ok(table.children(':eq(1)').is('tbody'), 'Structure inline - month table body');
	inl.datepicker('destroy');

	// Inline multi-month
	inl = init('#inl', {numberOfMonths: 2});
	dp = inl.children();
	ok(dp.is('.ui-datepicker-inline') && dp.is('.ui-datepicker-multi'), 'Structure inline multi - main div');
	equal(dp.children().length, 3 + (iframe ? 1 : 0), 'Structure inline multi - child count');
	child = dp.children(':first');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-first'), 'Structure inline multi - first month division');
	child = dp.children(':eq(1)');
	ok(child.is('div.ui-datepicker-group') && child.is('div.ui-datepicker-group-last'), 'Structure inline multi - second month division');
	child = dp.children(':eq(2)');
	ok(child.is('div.ui-datepicker-row-break'), 'Structure inline multi - row break');
	inl.datepicker('destroy');
});

test('customStructure', function() {
	var iframe, header, panel, title, thead,
		dp = $('#ui-datepicker-div'),
		// Check right-to-left localisation
		inp = init('#inp', $.datepicker.regional.he);
	inp.data('showButtonPanel.datepicker',true);
	inp.focus();
	iframe = ($.browser.msie && parseInt($.browser.version, 10) < 7);
	ok(dp.is('.ui-datepicker-rtl'), 'Structure RTL - right-to-left');
	header = dp.children(':first');
	ok(header.is('div.ui-datepicker-header'), 'Structure RTL - header division');
	equal(header.children().length, 3, 'Structure RTL - header child count');
	ok(header.children(':first').is('a.ui-datepicker-next'), 'Structure RTL - prev link');
	ok(header.children(':eq(1)').is('a.ui-datepicker-prev'), 'Structure RTL - next link');
	panel = dp.children(':last');
	ok(panel.is('div.ui-datepicker-buttonpane'), 'Structure RTL - button division');
	equal(panel.children().length, 2, 'Structure RTL - button panel child count');
	ok(panel.children(':first').is('button.ui-datepicker-close'), 'Structure RTL - close button');
	ok(panel.children(':last').is('button.ui-datepicker-current'), 'Structure RTL - today button');
	inp.datepicker('hide').datepicker('destroy');

	// Hide prev/next
	inp = init('#inp', {hideIfNoPrevNext: true, minDate: new Date(2008, 2 - 1, 4), maxDate: new Date(2008, 2 - 1, 14)});
	inp.val('02/10/2008').focus();
	header = dp.children(':first');
	ok(header.is('div.ui-datepicker-header'), 'Structure hide prev/next - header division');
	equal(header.children().length, 1, 'Structure hide prev/next - links child count');
	ok(header.children(':first').is('div.ui-datepicker-title'), 'Structure hide prev/next - title division');
	inp.datepicker('hide').datepicker('destroy');

	// Changeable Month with read-only year
	inp = init('#inp', {changeMonth: true});
	inp.focus();
	title = dp.children(':first').children(':last');
	equal(title.children().length, 2, 'Structure changeable month - title child count');
	ok(title.children(':first').is('select.ui-datepicker-month'), 'Structure changeable month - month selector');
	ok(title.children(':last').is('span.ui-datepicker-year'), 'Structure changeable month - read-only year');
	inp.datepicker('hide').datepicker('destroy');

	// Changeable year with read-only month
	inp = init('#inp', {changeYear: true});
	inp.focus();
	title = dp.children(':first').children(':last');
	equal(title.children().length, 2, 'Structure changeable year - title child count');
	ok(title.children(':first').is('span.ui-datepicker-month'), 'Structure changeable year - read-only month');
	ok(title.children(':last').is('select.ui-datepicker-year'), 'Structure changeable year - year selector');
	inp.datepicker('hide').datepicker('destroy');

	// Read-only first day of week
	inp = init('#inp', {changeFirstDay: false});
	inp.focus();
	thead = dp.find('.ui-datepicker-calendar thead tr');
	equal(thead.children().length, 7, 'Structure read-only first day - thead child count');
	equal(thead.find('a').length, 0, 'Structure read-only first day - thead links count');
	inp.datepicker('hide').datepicker('destroy');
});

test('keystrokes', function() {
	var inp = init('#inp'),
		date = new Date();
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke enter');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Keystroke enter - preset');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.HOME}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke ctrl+home');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.END});
	ok(inp.datepicker('getDate') == null, 'Keystroke ctrl+end');
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	ok(inp.datepicker('getDate') == null, 'Keystroke esc');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Keystroke esc - preset');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Keystroke esc - abandoned');
	// Moving by day or week
	inp.val('').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.LEFT}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 1);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke ctrl+left');
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.LEFT}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 1);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke left');
	inp.val('').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.RIGHT}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 1);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke ctrl+right');
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.RIGHT}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 1);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke right');
	inp.val('').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 7);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke ctrl+up');
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 7);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke up');
	inp.val('').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 7);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke ctrl+down');
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 7);
	equalsDate(inp.datepicker('getDate'), date, 'Keystroke down');
	// Moving by month or year
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 1 - 1, 4),
		'Keystroke pgup');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 3 - 1, 4),
		'Keystroke pgdn');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2007, 2 - 1, 4),
		'Keystroke ctrl+pgup');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2009, 2 - 1, 4),
		'Keystroke ctrl+pgdn');
	// Check for moving to short months
	inp.val('03/31/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 29),
		'Keystroke pgup - Feb');
	inp.val('01/30/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 29),
		'Keystroke pgdn - Feb');
	inp.val('02/29/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2007, 2 - 1, 28),
		'Keystroke ctrl+pgup - Feb');
	inp.val('02/29/2008').datepicker('show').
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2009, 2 - 1, 28),
		'Keystroke ctrl+pgdn - Feb');
	// Goto current
	inp.datepicker('option', {gotoCurrent: true}).
		datepicker('hide').val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.HOME}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Keystroke ctrl+home');
	// Change steps
	inp.datepicker('option', {stepMonths: 2, gotoCurrent: false}).
		datepicker('hide').val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2007, 12 - 1, 4),
		'Keystroke pgup step 2');
	inp.val('02/04/2008').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 4 - 1, 4),
		'Keystroke pgdn step 2');
});

test('mouse', function() {
	var inl,
		inp = init('#inp'),
		dp = $('#ui-datepicker-div'),
		date = new Date();
	inp.val('').datepicker('show');
	$('.ui-datepicker-calendar tbody a:contains(10)', dp).simulate('click', {});
	date.setDate(10);
	equalsDate(inp.datepicker('getDate'), date, 'Mouse click');
	inp.val('02/04/2008').datepicker('show');
	$('.ui-datepicker-calendar tbody a:contains(12)', dp).simulate('click', {});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 12),
		'Mouse click - preset');
	inp.val('02/04/2008').datepicker('show');
	inp.val('').datepicker('show');
	$('button.ui-datepicker-close', dp).simulate('click', {});
	ok(inp.datepicker('getDate') == null, 'Mouse click - close');
	inp.val('02/04/2008').datepicker('show');
	$('button.ui-datepicker-close', dp).simulate('click', {});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Mouse click - close + preset');
	inp.val('02/04/2008').datepicker('show');
	$('a.ui-datepicker-prev', dp).simulate('click', {});
	$('button.ui-datepicker-close', dp).simulate('click', {});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 4),
		'Mouse click - abandoned');
	// Current/previous/next
	inp.val('02/04/2008').datepicker('option', {showButtonPanel: true}).datepicker('show');
	$('.ui-datepicker-current', dp).simulate('click', {});
	$('.ui-datepicker-calendar tbody a:contains(14)', dp).simulate('click', {});
	date.setDate(14);
	equalsDate(inp.datepicker('getDate'), date, 'Mouse click - current');
	inp.val('02/04/2008').datepicker('show');
	$('.ui-datepicker-prev', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(16)', dp).simulate('click');
	equalsDate(inp.datepicker('getDate'), new Date(2008, 1 - 1, 16),
		'Mouse click - previous');
	inp.val('02/04/2008').datepicker('show');
	$('.ui-datepicker-next', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(18)', dp).simulate('click');
	equalsDate(inp.datepicker('getDate'), new Date(2008, 3 - 1, 18),
		'Mouse click - next');
	// Previous/next with minimum/maximum
	inp.datepicker('option', {minDate: new Date(2008, 2 - 1, 2),
		maxDate: new Date(2008, 2 - 1, 26)}).val('02/04/2008').datepicker('show');
	$('.ui-datepicker-prev', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(16)', dp).simulate('click');
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 16),
		'Mouse click - previous + min/max');
	inp.val('02/04/2008').datepicker('show');
	$('.ui-datepicker-next', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(18)', dp).simulate('click');
	equalsDate(inp.datepicker('getDate'), new Date(2008, 2 - 1, 18),
		'Mouse click - next + min/max');
	// Inline
	inl = init('#inl');
	dp = $('.ui-datepicker-inline', inl);
	date = new Date();
	inl.datepicker('setDate', date);
	$('.ui-datepicker-calendar tbody a:contains(10)', dp).simulate('click', {});
	date.setDate(10);
	equalsDate(inl.datepicker('getDate'), date, 'Mouse click inline');
	inl.datepicker('option', {showButtonPanel: true}).datepicker('setDate', new Date(2008, 2 - 1, 4));
	$('.ui-datepicker-calendar tbody a:contains(12)', dp).simulate('click', {});
	equalsDate(inl.datepicker('getDate'), new Date(2008, 2 - 1, 12), 'Mouse click inline - preset');
	inl.datepicker('option', {showButtonPanel: true});
	$('.ui-datepicker-current', dp).simulate('click', {});
	$('.ui-datepicker-calendar tbody a:contains(14)', dp).simulate('click', {});
	date.setDate(14);
	equalsDate(inl.datepicker('getDate'), date, 'Mouse click inline - current');
	inl.datepicker('setDate', new Date(2008, 2 - 1, 4));
	$('.ui-datepicker-prev', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(16)', dp).simulate('click');
	equalsDate(inl.datepicker('getDate'), new Date(2008, 1 - 1, 16),
		'Mouse click inline - previous');
	inl.datepicker('setDate', new Date(2008, 2 - 1, 4));
	$('.ui-datepicker-next', dp).simulate('click');
	$('.ui-datepicker-calendar tbody a:contains(18)', dp).simulate('click');
	equalsDate(inl.datepicker('getDate'), new Date(2008, 3 - 1, 18),
		'Mouse click inline - next');
});

})(jQuery);
