/*
 * datepicker_options.js
 */

(function($) {

module("datepicker: options");

test('setDefaults', function() {
	var inp = init('#inp');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial showOn');
	$.datepicker.setDefaults({showOn: 'button'});
	equal($.datepicker._defaults.showOn, 'button', 'Change default showOn');
	$.datepicker.setDefaults({showOn: 'focus'});
	equal($.datepicker._defaults.showOn, 'focus', 'Restore showOn');
});

test('option', function() {
	var inp = init('#inp'),
	inst = $.data(inp[0], PROP_NAME);
	// Set option
	equal(inst.settings.showOn, null, 'Initial setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Initial instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial default showOn');
	inp.datepicker('option', 'showOn', 'button');
	equal(inst.settings.showOn, 'button', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'button', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('option', {showOn: 'both'});
	equal(inst.settings.showOn, 'both', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'both', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('option', 'showOn', undefined);
	equal(inst.settings.showOn, null, 'Clear setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Restore instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	// Get option
	inp = init('#inp');
	equal(inp.datepicker('option', 'showOn'), 'focus', 'Initial setting showOn');
	inp.datepicker('option', 'showOn', 'button');
	equal(inp.datepicker('option', 'showOn'), 'button', 'Change instance showOn');
	inp.datepicker('option', 'showOn', undefined);
	equal(inp.datepicker('option', 'showOn'), 'focus', 'Reset instance showOn');
	deepEqual(inp.datepicker('option', 'all'), {showAnim: ''}, 'Get instance settings');
	deepEqual(inp.datepicker('option', 'defaults'), $.datepicker._defaults,
		'Get default settings');
});

test('change', function() {
	var inp = init('#inp'),
	inst = $.data(inp[0], PROP_NAME);
	equal(inst.settings.showOn, null, 'Initial setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Initial instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Initial default showOn');
	inp.datepicker('change', 'showOn', 'button');
	equal(inst.settings.showOn, 'button', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'button', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('change', {showOn: 'both'});
	equal(inst.settings.showOn, 'both', 'Change setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'both', 'Change instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
	inp.datepicker('change', 'showOn', undefined);
	equal(inst.settings.showOn, null, 'Clear setting showOn');
	equal($.datepicker._get(inst, 'showOn'), 'focus', 'Restore instance showOn');
	equal($.datepicker._defaults.showOn, 'focus', 'Retain default showOn');
});

test('invocation', function() {
	var button, image,
		inp = init('#inp'),
		dp = $('#ui-datepicker-div'),
		body = $('body');
	// On focus
	button = inp.siblings('button');
	ok(button.length === 0, 'Focus - button absent');
	image = inp.siblings('img');
	ok(image.length === 0, 'Focus - image absent');
	inp.focus();
	ok(dp.is(':visible'), 'Focus - rendered on focus');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	ok(!dp.is(':visible'), 'Focus - hidden on exit');
	inp.focus();
	ok(dp.is(':visible'), 'Focus - rendered on focus');
	body.simulate('mousedown', {});
	ok(!dp.is(':visible'), 'Focus - hidden on external click');
	inp.datepicker('hide').datepicker('destroy');
	// On button
	inp = init('#inp', {showOn: 'button', buttonText: 'Popup'});
	ok(!dp.is(':visible'), 'Button - initially hidden');
	button = inp.siblings('button');
	image = inp.siblings('img');
	ok(button.length === 1, 'Button - button present');
	ok(image.length === 0, 'Button - image absent');
	equal(button.text(), 'Popup', 'Button - button text');
	inp.focus();
	ok(!dp.is(':visible'), 'Button - not rendered on focus');
	button.click();
	ok(dp.is(':visible'), 'Button - rendered on button click');
	button.click();
	ok(!dp.is(':visible'), 'Button - hidden on second button click');
	inp.datepicker('hide').datepicker('destroy');
	// On image button
	inp = init('#inp', {showOn: 'button', buttonImageOnly: true,
		buttonImage: 'img/calendar.gif', buttonText: 'Cal'});
	ok(!dp.is(':visible'), 'Image button - initially hidden');
	button = inp.siblings('button');
	ok(button.length === 0, 'Image button - button absent');
	image = inp.siblings('img');
	ok(image.length === 1, 'Image button - image present');
	equal(image.attr('src'), 'img/calendar.gif', 'Image button - image source');
	equal(image.attr('title'), 'Cal', 'Image button - image text');
	inp.focus();
	ok(!dp.is(':visible'), 'Image button - not rendered on focus');
	image.click();
	ok(dp.is(':visible'), 'Image button - rendered on image click');
	image.click();
	ok(!dp.is(':visible'), 'Image button - hidden on second image click');
	inp.datepicker('hide').datepicker('destroy');
	// On both
	inp = init('#inp', {showOn: 'both', buttonImage: 'img/calendar.gif'});
	ok(!dp.is(':visible'), 'Both - initially hidden');
	button = inp.siblings('button');
	ok(button.length === 1, 'Both - button present');
	image = inp.siblings('img');
	ok(image.length === 0, 'Both - image absent');
	image = button.children('img');
	ok(image.length === 1, 'Both - button image present');
	inp.focus();
	ok(dp.is(':visible'), 'Both - rendered on focus');
	body.simulate('mousedown', {});
	ok(!dp.is(':visible'), 'Both - hidden on external click');
	button.click();
	ok(dp.is(':visible'), 'Both - rendered on button click');
	button.click();
	ok(!dp.is(':visible'), 'Both - hidden on second button click');
	inp.datepicker('hide').datepicker('destroy');
});

test('otherMonths', function() {
	var inp = init('#inp'),
		pop = $('#ui-datepicker-div');
	inp.val('06/01/2009').datepicker('show');
	equal(pop.find('tbody').text(), '\u00a0123456789101112131415161718192021222324252627282930\u00a0\u00a0\u00a0\u00a0',
		'Other months - none');
	ok(pop.find('td:last *').length === 0, 'Other months - no content');
	inp.datepicker('hide').datepicker('option', 'showOtherMonths', true).datepicker('show');
	equal(pop.find('tbody').text(), '311234567891011121314151617181920212223242526272829301234',
		'Other months - show');
	ok(pop.find('td:last span').length === 1, 'Other months - span content');
	inp.datepicker('hide').datepicker('option', 'selectOtherMonths', true).datepicker('show');
	equal(pop.find('tbody').text(), '311234567891011121314151617181920212223242526272829301234',
		'Other months - select');
	ok(pop.find('td:last a').length === 1, 'Other months - link content');
	inp.datepicker('hide').datepicker('option', 'showOtherMonths', false).datepicker('show');
	equal(pop.find('tbody').text(), '\u00a0123456789101112131415161718192021222324252627282930\u00a0\u00a0\u00a0\u00a0',
		'Other months - none');
	ok(pop.find('td:last *').length === 0, 'Other months - no content');
});

test('defaultDate', function() {
	var inp = init('#inp'),
		date = new Date();
	inp.val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date null');
	// Numeric values
	inp.datepicker('option', {defaultDate: -2}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2');
	inp.datepicker('option', {defaultDate: 3}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 5);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 3');
	inp.datepicker('option', {defaultDate: 1 / 0}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 3);
	equalsDate(inp.datepicker('getDate'), date, 'Default date Infinity');
	inp.datepicker('option', {defaultDate: 1 / 'a'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date NaN');
	// String offset values
	inp.datepicker('option', {defaultDate: '-1d'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() - 1);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -1d');
	inp.datepicker('option', {defaultDate: '+3D'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 4);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +3D');
	inp.datepicker('option', {defaultDate: ' -2 w '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date();
	date.setDate(date.getDate() - 14);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2 w');
	inp.datepicker('option', {defaultDate: '+1 W'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setDate(date.getDate() + 21);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1 W');
	inp.datepicker('option', {defaultDate: ' -1 m '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), -1);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -1 m');
	inp.datepicker('option', {defaultDate: '+2M'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +2M');
	inp.datepicker('option', {defaultDate: '-2y'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date();
	date.setFullYear(date.getFullYear() - 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date -2y');
	inp.datepicker('option', {defaultDate: '+1 Y '}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date.setFullYear(date.getFullYear() + 3);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1 Y');
	inp.datepicker('option', {defaultDate: '+1M +10d'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = addMonths(new Date(), 1);
	date.setDate(date.getDate() + 10);
	equalsDate(inp.datepicker('getDate'), date, 'Default date +1M +10d');
	// String date values
	inp.datepicker('option', {defaultDate: '07/04/2007'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date(2007, 7 - 1, 4);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 07/04/2007');
	inp.datepicker('option', {dateFormat: 'yy-mm-dd', defaultDate: '2007-04-02'}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date(2007, 4 - 1, 2);
	equalsDate(inp.datepicker('getDate'), date, 'Default date 2007-04-02');
	// Date value
	date = new Date(2007, 1 - 1, 26);
	inp.datepicker('option', {dateFormat: 'mm/dd/yy', defaultDate: date}).
		datepicker('hide').val('').datepicker('show').
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date, 'Default date 01/26/2007');
});

test('miscellaneous', function() {
	var curYear, longNames, shortNames, date,
		dp = $('#ui-datepicker-div'),
		inp = init('#inp');
	// Year range
	function genRange(start, offset) {
		var i = start,
			range = '';
		for (; i < start + offset; i++) {
			range += i;
		}
		return range;
	}
	curYear = new Date().getFullYear();
	inp.val('02/04/2008').datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), '2008', 'Year range - read-only default');
	inp.datepicker('hide').datepicker('option', {changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2008 - 10, 21), 'Year range - changeable default');
	inp.datepicker('hide').datepicker('option', {yearRange: 'c-6:c+2', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2008 - 6, 9), 'Year range - c-6:c+2');
	inp.datepicker('hide').datepicker('option', {yearRange: '2000:2010', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2000, 11), 'Year range - 2000:2010');
	inp.datepicker('hide').datepicker('option', {yearRange: '-5:+3', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(curYear - 5, 9), 'Year range - -5:+3');
	inp.datepicker('hide').datepicker('option', {yearRange: '2000:-5', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(2000, curYear - 2004), 'Year range - 2000:-5');
	inp.datepicker('hide').datepicker('option', {yearRange: '', changeYear: true}).datepicker('show');
	equal(dp.find('.ui-datepicker-year').text(), genRange(curYear, 1), 'Year range - -6:+2');

	// Navigation as date format
	inp.datepicker('option', {showButtonPanel: true});
	equal(dp.find('.ui-datepicker-prev').text(), 'Prev', 'Navigation prev - default');
	equal(dp.find('.ui-datepicker-current').text(), 'Today', 'Navigation current - default');
	equal(dp.find('.ui-datepicker-next').text(), 'Next', 'Navigation next - default');
	inp.datepicker('hide').datepicker('option', {navigationAsDateFormat: true, prevText: '< M', currentText: 'MM', nextText: 'M >'}).
		val('02/04/2008').datepicker('show');
	longNames = $.datepicker.regional[''].monthNames;
	shortNames = $.datepicker.regional[''].monthNamesShort;
	date = new Date();
	equal(dp.find('.ui-datepicker-prev').text(), '< ' + shortNames[0], 'Navigation prev - as date format');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[date.getMonth()], 'Navigation current - as date format');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[2] + ' >', 'Navigation next - as date format');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN});
	equal(dp.find('.ui-datepicker-prev').text(),
		'< ' + shortNames[1], 'Navigation prev - as date format + pgdn');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[date.getMonth()], 'Navigation current - as date format + pgdn');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[3] + ' >', 'Navigation next - as date format + pgdn');
	inp.datepicker('hide').datepicker('option', {gotoCurrent: true}).
		val('02/04/2008').datepicker('show');
	equal(dp.find('.ui-datepicker-prev').text(),
		'< ' + shortNames[0], 'Navigation prev - as date format + goto current');
	equal(dp.find('.ui-datepicker-current').text(),
		longNames[1], 'Navigation current - as date format + goto current');
	equal(dp.find('.ui-datepicker-next').text(),
		shortNames[2] + ' >', 'Navigation next - as date format + goto current');
});

test('minMax', function() {
	var date,
		inp = init('#inp'),
		lastYear = new Date(2007, 6 - 1, 4),
		nextYear = new Date(2009, 6 - 1, 4),
		minDate = new Date(2008, 2 - 1, 29),
		maxDate = new Date(2008, 12 - 1, 7);
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), lastYear,
		'Min/max - null, null - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), nextYear,
		'Min/max - null, null - ctrl+pgdn');
	inp.datepicker('option', {minDate: minDate}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), minDate,
		'Min/max - 02/29/2008, null - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), nextYear,
		'Min/max - 02/29/2008, null - ctrl+pgdn');
	inp.datepicker('option', {maxDate: maxDate}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), minDate,
		'Min/max - 02/29/2008, 12/07/2008 - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), maxDate,
		'Min/max - 02/29/2008, 12/07/2008 - ctrl+pgdn');
	inp.datepicker('option', {minDate: null}).
		datepicker('hide').val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), lastYear,
		'Min/max - null, 12/07/2008 - ctrl+pgup');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), maxDate,
		'Min/max - null, 12/07/2008 - ctrl+pgdn');
	// Relative dates
	date = new Date();
	date.setDate(date.getDate() - 7);
	inp.datepicker('option', {minDate: '-1w', maxDate: '+1 M +10 D '}).
		datepicker('hide').val('').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_UP}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date,
		'Min/max - -1w, +1 M +10 D - ctrl+pgup');
	date = addMonths(new Date(), 1);
	date.setDate(date.getDate() + 10);
	inp.val('').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equalsDate(inp.datepicker('getDate'), date,
		'Min/max - -1w, +1 M +10 D - ctrl+pgdn');
	// With existing date
	inp = init('#inp');
	inp.val('06/04/2008').datepicker('option', {minDate: minDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate > min');
	inp.datepicker('option', {minDate: null}).val('01/04/2008').datepicker('option', {minDate: minDate});
	equalsDate(inp.datepicker('getDate'), minDate, 'Min/max - setDate < min');
	inp.datepicker('option', {minDate: null}).val('06/04/2008').datepicker('option', {maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate < max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2009').datepicker('option', {maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), maxDate, 'Min/max - setDate > max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2008').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), minDate, 'Min/max - setDate < min');
	inp.datepicker('option', {maxDate: null}).val('06/04/2008').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), new Date(2008, 6 - 1, 4), 'Min/max - setDate > min, < max');
	inp.datepicker('option', {maxDate: null}).val('01/04/2009').datepicker('option', {minDate: minDate, maxDate: maxDate});
	equalsDate(inp.datepicker('getDate'), maxDate, 'Min/max - setDate > max');
});

test('setDate', function() {
	var inl, alt, minDate, maxDate, dateAndTimeToSet, dateAndTimeClone,
		inp = init('#inp'),
		date1 = new Date(2008, 6 - 1, 4),
		date2 = new Date();
	ok(inp.datepicker('getDate') == null, 'Set date - default');
	inp.datepicker('setDate', date1);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - 2008-06-04');
	date1 = new Date();
	date1.setDate(date1.getDate() + 7);
	inp.datepicker('setDate', +7);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - +7');
	date2.setFullYear(date2.getFullYear() + 2);
	inp.datepicker('setDate', '+2y');
	equalsDate(inp.datepicker('getDate'), date2, 'Set date - +2y');
	inp.datepicker('setDate', date1, date2);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - two dates');
	inp.datepicker('setDate');
	ok(inp.datepicker('getDate') == null, 'Set date - null');
	// Relative to current date
	date1 = new Date();
	date1.setDate(date1.getDate() + 7);
	inp.datepicker('setDate', 'c +7');
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - c +7');
	date1.setDate(date1.getDate() + 7);
	inp.datepicker('setDate', 'c+7');
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - c+7');
	date1.setDate(date1.getDate() - 21);
	inp.datepicker('setDate', 'c -3 w');
	equalsDate(inp.datepicker('getDate'), date1, 'Set date - c -3 w');
	// Inline
	inl = init('#inl');
	date1 = new Date(2008, 6 - 1, 4);
	date2 = new Date();
	equalsDate(inl.datepicker('getDate'), date2, 'Set date inline - default');
	inl.datepicker('setDate', date1);
	equalsDate(inl.datepicker('getDate'), date1, 'Set date inline - 2008-06-04');
	date1 = new Date();
	date1.setDate(date1.getDate() + 7);
	inl.datepicker('setDate', +7);
	equalsDate(inl.datepicker('getDate'), date1, 'Set date inline - +7');
	date2.setFullYear(date2.getFullYear() + 2);
	inl.datepicker('setDate', '+2y');
	equalsDate(inl.datepicker('getDate'), date2, 'Set date inline - +2y');
	inl.datepicker('setDate', date1, date2);
	equalsDate(inl.datepicker('getDate'), date1, 'Set date inline - two dates');
	inl.datepicker('setDate');
	ok(inl.datepicker('getDate') == null, 'Set date inline - null');
	// Alternate field
	alt = $('#alt');
	inp.datepicker('option', {altField: '#alt', altFormat: 'yy-mm-dd'});
	date1 = new Date(2008, 6 - 1, 4);
	inp.datepicker('setDate', date1);
	equal(inp.val(), '06/04/2008', 'Set date alternate - 06/04/2008');
	equal(alt.val(), '2008-06-04', 'Set date alternate - 2008-06-04');
	// With minimum/maximum
	inp = init('#inp');
	date1 = new Date(2008, 1 - 1, 4);
	date2 = new Date(2008, 6 - 1, 4);
	minDate = new Date(2008, 2 - 1, 29);
	maxDate = new Date(2008, 3 - 1, 28);
	inp.val('').datepicker('option', {minDate: minDate}).datepicker('setDate', date2);
	equalsDate(inp.datepicker('getDate'), date2, 'Set date min/max - setDate > min');
	inp.datepicker('setDate', date1);
	equalsDate(inp.datepicker('getDate'), minDate, 'Set date min/max - setDate < min');
	inp.val('').datepicker('option', {maxDate: maxDate, minDate: null}).datepicker('setDate', date1);
	equalsDate(inp.datepicker('getDate'), date1, 'Set date min/max - setDate < max');
	inp.datepicker('setDate', date2);
	equalsDate(inp.datepicker('getDate'), maxDate, 'Set date min/max - setDate > max');
	inp.val('').datepicker('option', {minDate: minDate}).datepicker('setDate', date1);
	equalsDate(inp.datepicker('getDate'), minDate, 'Set date min/max - setDate < min');
	inp.datepicker('setDate', date2);
	equalsDate(inp.datepicker('getDate'), maxDate, 'Set date min/max - setDate > max');
	dateAndTimeToSet = new Date(2008, 3 - 1, 28, 1, 11, 0);
	dateAndTimeClone = new Date(2008, 3 - 1, 28, 1, 11, 0);
	inp.datepicker('setDate', dateAndTimeToSet);
	equal(dateAndTimeToSet.getTime(), dateAndTimeClone.getTime(), 'Date object passed should not be changed by setDate');
});

test('altField', function() {
	var inp = init('#inp'),
		alt = $('#alt');
	// No alternate field set
	alt.val('');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equal(inp.val(), '06/04/2008', 'Alt field - dp - enter');
	equal(alt.val(), '', 'Alt field - alt not set');
	// Alternate field set
	alt.val('');
	inp.datepicker('option', {altField: '#alt', altFormat: 'yy-mm-dd'}).
		val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equal(inp.val(), '06/04/2008', 'Alt field - dp - enter');
	equal(alt.val(), '2008-06-04', 'Alt field - alt - enter');
	// Move from initial date
	alt.val('');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	equal(inp.val(), '07/04/2008', 'Alt field - dp - pgdn');
	equal(alt.val(), '2008-07-04', 'Alt field - alt - pgdn');
	// Alternate field set - closed
	alt.val('');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {keyCode: $.ui.keyCode.PAGE_DOWN}).
		simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
	equal(inp.val(), '06/04/2008', 'Alt field - dp - pgdn/esc');
	equal(alt.val(), '', 'Alt field - alt - pgdn/esc');
	// Clear date and alternate
	alt.val('');
	inp.val('06/04/2008').datepicker('show');
	inp.simulate('keydown', {ctrlKey: true, keyCode: $.ui.keyCode.END});
	equal(inp.val(), '', 'Alt field - dp - ctrl+end');
	equal(alt.val(), '', 'Alt field - alt - ctrl+end');
});

test('autoSize', function() {
	var inp = init('#inp');
	equal(inp.prop('size'), 20, 'Auto size - default');
	inp.datepicker('option', 'autoSize', true);
	equal(inp.prop('size'), 10, 'Auto size - mm/dd/yy');
	inp.datepicker('option', 'dateFormat', 'm/d/yy');
	equal(inp.prop('size'), 10, 'Auto size - m/d/yy');
	inp.datepicker('option', 'dateFormat', 'D M d yy');
	equal(inp.prop('size'), 15, 'Auto size - D M d yy');
	inp.datepicker('option', 'dateFormat', 'DD, MM dd, yy');
	equal(inp.prop('size'), 29, 'Auto size - DD, MM dd, yy');
	// French
	inp.datepicker('option', $.extend({autoSize: false}, $.datepicker.regional.fr));
	equal(inp.prop('size'), 29, 'Auto size - fr - default');
	inp.datepicker('option', 'autoSize', true);
	equal(inp.prop('size'), 10, 'Auto size - fr - dd/mm/yy');
	inp.datepicker('option', 'dateFormat', 'm/d/yy');
	equal(inp.prop('size'), 10, 'Auto size - fr - m/d/yy');
	inp.datepicker('option', 'dateFormat', 'D M d yy');
	equal(inp.prop('size'), 18, 'Auto size - fr - D M d yy');
	inp.datepicker('option', 'dateFormat', 'DD, MM dd, yy');
	equal(inp.prop('size'), 28, 'Auto size - fr - DD, MM dd, yy');
	// Hebrew
	inp.datepicker('option', $.extend({autoSize: false}, $.datepicker.regional.he));
	equal(inp.prop('size'), 28, 'Auto size - he - default');
	inp.datepicker('option', 'autoSize', true);
	equal(inp.prop('size'), 10, 'Auto size - he - dd/mm/yy');
	inp.datepicker('option', 'dateFormat', 'm/d/yy');
	equal(inp.prop('size'), 10, 'Auto size - he - m/d/yy');
	inp.datepicker('option', 'dateFormat', 'D M d yy');
	equal(inp.prop('size'), 16, 'Auto size - he - D M d yy');
	inp.datepicker('option', 'dateFormat', 'DD, MM dd, yy');
	equal(inp.prop('size'), 23, 'Auto size - he - DD, MM dd, yy');
});

test('daylightSaving', function() {
	var inp = init('#inp'),
		dp = $('#ui-datepicker-div');
	ok(true, 'Daylight saving - ' + new Date());
	// Australia, Sydney - AM change, southern hemisphere
	inp.val('04/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(6) a', dp).simulate('click');
	equal(inp.val(), '04/05/2008', 'Daylight saving - Australia 04/05/2008');
	inp.val('04/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(7) a', dp).simulate('click');
	equal(inp.val(), '04/06/2008', 'Daylight saving - Australia 04/06/2008');
	inp.val('04/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(8) a', dp).simulate('click');
	equal(inp.val(), '04/07/2008', 'Daylight saving - Australia 04/07/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(6) a', dp).simulate('click');
	equal(inp.val(), '10/04/2008', 'Daylight saving - Australia 10/04/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(7) a', dp).simulate('click');
	equal(inp.val(), '10/05/2008', 'Daylight saving - Australia 10/05/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(8) a', dp).simulate('click');
	equal(inp.val(), '10/06/2008', 'Daylight saving - Australia 10/06/2008');
	// Brasil, Brasilia - midnight change, southern hemisphere
	inp.val('02/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(20) a', dp).simulate('click');
	equal(inp.val(), '02/16/2008', 'Daylight saving - Brasil 02/16/2008');
	inp.val('02/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(21) a', dp).simulate('click');
	equal(inp.val(), '02/17/2008', 'Daylight saving - Brasil 02/17/2008');
	inp.val('02/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(22) a', dp).simulate('click');
	equal(inp.val(), '02/18/2008', 'Daylight saving - Brasil 02/18/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(13) a', dp).simulate('click');
	equal(inp.val(), '10/11/2008', 'Daylight saving - Brasil 10/11/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(14) a', dp).simulate('click');
	equal(inp.val(), '10/12/2008', 'Daylight saving - Brasil 10/12/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(15) a', dp).simulate('click');
	equal(inp.val(), '10/13/2008', 'Daylight saving - Brasil 10/13/2008');
	// Lebanon, Beirut - midnight change, northern hemisphere
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(34) a', dp).simulate('click');
	equal(inp.val(), '03/29/2008', 'Daylight saving - Lebanon 03/29/2008');
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(35) a', dp).simulate('click');
	equal(inp.val(), '03/30/2008', 'Daylight saving - Lebanon 03/30/2008');
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(36) a', dp).simulate('click');
	equal(inp.val(), '03/31/2008', 'Daylight saving - Lebanon 03/31/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(27) a', dp).simulate('click');
	equal(inp.val(), '10/25/2008', 'Daylight saving - Lebanon 10/25/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(28) a', dp).simulate('click');
	equal(inp.val(), '10/26/2008', 'Daylight saving - Lebanon 10/26/2008');
	inp.val('10/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(29) a', dp).simulate('click');
	equal(inp.val(), '10/27/2008', 'Daylight saving - Lebanon 10/27/2008');
	// US, Eastern - AM change, northern hemisphere
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(13) a', dp).simulate('click');
	equal(inp.val(), '03/08/2008', 'Daylight saving - US 03/08/2008');
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(14) a', dp).simulate('click');
	equal(inp.val(), '03/09/2008', 'Daylight saving - US 03/09/2008');
	inp.val('03/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(15) a', dp).simulate('click');
	equal(inp.val(), '03/10/2008', 'Daylight saving - US 03/10/2008');
	inp.val('11/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(6) a', dp).simulate('click');
	equal(inp.val(), '11/01/2008', 'Daylight saving - US 11/01/2008');
	inp.val('11/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(7) a', dp).simulate('click');
	equal(inp.val(), '11/02/2008', 'Daylight saving - US 11/02/2008');
	inp.val('11/01/2008').datepicker('show');
	$('.ui-datepicker-calendar td:eq(8) a', dp).simulate('click');
	equal(inp.val(), '11/03/2008', 'Daylight saving - US 11/03/2008');
});

var beforeShowThis = null,
	beforeShowInput = null,
	beforeShowInst = null,
	beforeShowDayThis = null,
	beforeShowDayOK = true;


function beforeAll(input, inst) {
	beforeShowThis = this;
	beforeShowInput = input;
	beforeShowInst = inst;
	return {currentText: 'Current'};
}

function beforeDay(date) {
	beforeShowDayThis = this;
	beforeShowDayOK &= (date > new Date(2008, 1 - 1, 26) &&
		date < new Date(2008, 3 - 1, 6));
	return [(date.getDate() % 2 === 0), (date.getDate() % 10 === 0 ? 'day10' : ''),
		(date.getDate() % 3 === 0 ? 'Divisble by 3' : '')];
}

function calcWeek(date) {
	var doy = date.getDate() + 6,
		m = date.getMonth() - 1;
	for (; m >= 0; m--) {
		doy += $.datepicker._getDaysInMonth(date.getFullYear(), m);
	}
	// Simple count from 01/01 starting at week 1
	return Math.floor(doy / 7);
}

test('callbacks', function() {
	// Before show
	var dp, day20, day21,
		inp = init('#inp', {beforeShow: beforeAll}),
		inst = $.data(inp[0], 'datepicker');
	equal($.datepicker._get(inst, 'currentText'), 'Today', 'Before show - initial');
	inp.val('02/04/2008').datepicker('show');
	equal($.datepicker._get(inst, 'currentText'), 'Current', 'Before show - changed');
	ok(beforeShowThis.id === inp[0].id, 'Before show - this OK');
	ok(beforeShowInput.id === inp[0].id, 'Before show - input OK');
	deepEqual(beforeShowInst, inst, 'Before show - inst OK');
	inp.datepicker('hide').datepicker('destroy');
	// Before show day
	inp = init('#inp', {beforeShowDay: beforeDay});
	dp = $('#ui-datepicker-div');
	inp.val('02/04/2008').datepicker('show');
	ok(beforeShowDayThis.id === inp[0].id, 'Before show day - this OK');
	ok(beforeShowDayOK, 'Before show day - dates OK');
	day20 = dp.find('.ui-datepicker-calendar td:contains("20")');
	day21 = dp.find('.ui-datepicker-calendar td:contains("21")');
	ok(!day20.is('.ui-datepicker-unselectable'), 'Before show day - unselectable 20');
	ok(day21.is('.ui-datepicker-unselectable'), 'Before show day - unselectable 21');
	ok(day20.is('.day10'), 'Before show day - CSS 20');
	ok(!day21.is('.day10'), 'Before show day - CSS 21');
	ok(!day20.attr('title'), 'Before show day - title 20');
	ok(day21.attr('title') === 'Divisble by 3', 'Before show day - title 21');
	inp.datepicker('hide').datepicker('destroy');
});

test('localisation', function() {
	var dp, month, day, date,
		inp = init('#inp', $.datepicker.regional.fr);
	inp.datepicker('option', {dateFormat: 'DD, d MM yy', showButtonPanel:true, changeMonth:true, changeYear:true}).val('').datepicker('show');
	dp = $('#ui-datepicker-div');
	equal($('.ui-datepicker-close', dp).text(), 'Fermer', 'Localisation - close');
	$('.ui-datepicker-close', dp).simulate('mouseover');
	equal($('.ui-datepicker-prev', dp).text(), 'Précédent', 'Localisation - previous');
	equal($('.ui-datepicker-current', dp).text(), 'Aujourd\'hui', 'Localisation - current');
	equal($('.ui-datepicker-next', dp).text(), 'Suivant', 'Localisation - next');
	month = 0;
	$('.ui-datepicker-month option', dp).each(function() {
		equal($(this).text(), $.datepicker.regional.fr.monthNamesShort[month],
			'Localisation - month ' + month);
		month++;
	});
	day = 1;
	$('.ui-datepicker-calendar th', dp).each(function() {
		equal($(this).text(), $.datepicker.regional.fr.dayNamesMin[day],
			'Localisation - day ' + day);
		day = (day + 1) % 7;
	});
	inp.simulate('keydown', {keyCode: $.ui.keyCode.ENTER});
	date = new Date();
	equal(inp.val(), $.datepicker.regional.fr.dayNames[date.getDay()] + ', ' +
		date.getDate() + ' ' + $.datepicker.regional.fr.monthNames[date.getMonth()] +
		' ' + date.getFullYear(), 'Localisation - formatting');
});

test('noWeekends', function() {
	var i, date;
	for (i = 1; i <= 31; i++) {
		date = new Date(2001, 1 - 1, i);
		deepEqual($.datepicker.noWeekends(date), [(i + 1) % 7 >= 2, ''],
			'No weekends ' + date);
	}
});

test('iso8601Week', function() {
	var date = new Date(2000, 12 - 1, 31);
	equal($.datepicker.iso8601Week(date), 52, 'ISO 8601 week ' + date);
	date = new Date(2001, 1 - 1, 1);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
	date = new Date(2001, 1 - 1, 7);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
	date = new Date(2001, 1 - 1, 8);
	equal($.datepicker.iso8601Week(date), 2, 'ISO 8601 week ' + date);
	date = new Date(2003, 12 - 1, 28);
	equal($.datepicker.iso8601Week(date), 52, 'ISO 8601 week ' + date);
	date = new Date(2003, 12 - 1, 29);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
	date = new Date(2004, 1 - 1, 4);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
	date = new Date(2004, 1 - 1, 5);
	equal($.datepicker.iso8601Week(date), 2, 'ISO 8601 week ' + date);
	date = new Date(2009, 12 - 1, 28);
	equal($.datepicker.iso8601Week(date), 53, 'ISO 8601 week ' + date);
	date = new Date(2010, 1 - 1, 3);
	equal($.datepicker.iso8601Week(date), 53, 'ISO 8601 week ' + date);
	date = new Date(2010, 1 - 1, 4);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
	date = new Date(2010, 1 - 1, 10);
	equal($.datepicker.iso8601Week(date), 1, 'ISO 8601 week ' + date);
});

test('parseDate', function() {
	init('#inp');
	var currentYear, gmtDate, fr, settings, zh;
	ok($.datepicker.parseDate('d m y', '') == null, 'Parse date empty');
	equalsDate($.datepicker.parseDate('d m y', '3 2 01'),
		new Date(2001, 2 - 1, 3), 'Parse date d m y');
	equalsDate($.datepicker.parseDate('dd mm yy', '03 02 2001'),
		new Date(2001, 2 - 1, 3), 'Parse date dd mm yy');
	equalsDate($.datepicker.parseDate('d m y', '13 12 01'),
		new Date(2001, 12 - 1, 13), 'Parse date d m y');
	equalsDate($.datepicker.parseDate('dd mm yy', '13 12 2001'),
		new Date(2001, 12 - 1, 13), 'Parse date dd mm yy');
	equalsDate($.datepicker.parseDate('y-o', '01-34'),
		new Date(2001, 2 - 1, 3), 'Parse date y-o');
	equalsDate($.datepicker.parseDate('yy-oo', '2001-347'),
		new Date(2001, 12 - 1, 13), 'Parse date yy-oo');
	equalsDate($.datepicker.parseDate('oo yy', '348 2004'),
		new Date(2004, 12 - 1, 13), 'Parse date oo yy');
	equalsDate($.datepicker.parseDate('D d M y', 'Sat 3 Feb 01'),
		new Date(2001, 2 - 1, 3), 'Parse date D d M y');
	equalsDate($.datepicker.parseDate('d MM DD yy', '3 February Saturday 2001'),
		new Date(2001, 2 - 1, 3), 'Parse date dd MM DD yy');
	equalsDate($.datepicker.parseDate('DD, MM d, yy', 'Saturday, February 3, 2001'),
		new Date(2001, 2 - 1, 3), 'Parse date DD, MM d, yy');
	equalsDate($.datepicker.parseDate('\'day\' d \'of\' MM (\'\'DD\'\'), yy',
		'day 3 of February (\'Saturday\'), 2001'), new Date(2001, 2 - 1, 3),
		'Parse date \'day\' d \'of\' MM (\'\'DD\'\'), yy');
	currentYear = new Date().getFullYear();
	equalsDate($.datepicker.parseDate('y-m-d', (currentYear - 2000) + '-02-03'),
			new Date(currentYear, 2 - 1, 3), 'Parse date y-m-d - default cutuff');
	equalsDate($.datepicker.parseDate('y-m-d', (currentYear - 2000 + 10) + '-02-03'),
			new Date(currentYear+10, 2 - 1, 3), 'Parse date y-m-d - default cutuff');
	equalsDate($.datepicker.parseDate('y-m-d', (currentYear - 2000 + 11) + '-02-03'),
			new Date(currentYear-89, 2 - 1, 3), 'Parse date y-m-d - default cutuff');
	equalsDate($.datepicker.parseDate('y-m-d', '80-02-03', {shortYearCutoff: 80}),
		new Date(2080, 2 - 1, 3), 'Parse date y-m-d - cutoff 80');
	equalsDate($.datepicker.parseDate('y-m-d', '81-02-03', {shortYearCutoff: 80}),
		new Date(1981, 2 - 1, 3), 'Parse date y-m-d - cutoff 80');
	equalsDate($.datepicker.parseDate('y-m-d', (currentYear - 2000 + 60) + '-02-03', {shortYearCutoff: '+60'}),
			new Date(currentYear + 60, 2 - 1, 3), 'Parse date y-m-d - cutoff +60');
	equalsDate($.datepicker.parseDate('y-m-d', (currentYear - 2000 + 61) + '-02-03', {shortYearCutoff: '+60'}),
			new Date(currentYear - 39, 2 - 1, 3), 'Parse date y-m-d - cutoff +60');
	gmtDate = new Date(2001, 2 - 1, 3);
	gmtDate.setMinutes(gmtDate.getMinutes() - gmtDate.getTimezoneOffset());
	equalsDate($.datepicker.parseDate('@', '981158400000'), gmtDate, 'Parse date @');
	equalsDate($.datepicker.parseDate('!', '631167552000000000'), gmtDate, 'Parse date !');
	fr = $.datepicker.regional.fr;
	settings = {dayNamesShort: fr.dayNamesShort, dayNames: fr.dayNames,
		monthNamesShort: fr.monthNamesShort, monthNames: fr.monthNames};
	equalsDate($.datepicker.parseDate('D d M y', 'Lun. 9 Avril 01', settings),
		new Date(2001, 4 - 1, 9), 'Parse date D M y with settings');
	equalsDate($.datepicker.parseDate('d MM DD yy', '9 Avril Lundi 2001', settings),
		new Date(2001, 4 - 1, 9), 'Parse date d MM DD yy with settings');
	equalsDate($.datepicker.parseDate('DD, MM d, yy', 'Lundi, Avril 9, 2001', settings),
		new Date(2001, 4 - 1, 9), 'Parse date DD, MM d, yy with settings');
	equalsDate($.datepicker.parseDate('\'jour\' d \'de\' MM (\'\'DD\'\'), yy',
		'jour 9 de Avril (\'Lundi\'), 2001', settings), new Date(2001, 4 - 1, 9),
		'Parse date \'jour\' d \'de\' MM (\'\'DD\'\'), yy with settings');

	zh = $.datepicker.regional['zh-CN'];
	equalsDate($.datepicker.parseDate('yy M d', '2011 十一 22', zh),
		new Date(2011, 11 - 1, 22), 'Parse date yy M d with zh-CN');
});

test('parseDateErrors', function() {
	init('#inp');
	var fr, settings;
	function expectError(expr, value, error) {
		try {
			expr();
			ok(false, 'Parsed error ' + value);
		}
		catch (e) {
			equal(e, error, 'Parsed error ' + value);
		}
	}
	expectError(function() { $.datepicker.parseDate(null, 'Sat 2 01'); },
		'Sat 2 01', 'Invalid arguments');
	expectError(function() { $.datepicker.parseDate('d m y', null); },
		'null', 'Invalid arguments');
	expectError(function() { $.datepicker.parseDate('d m y', 'Sat 2 01'); },
		'Sat 2 01 - d m y', 'Missing number at position 0');
	expectError(function() { $.datepicker.parseDate('dd mm yy', 'Sat 2 01'); },
		'Sat 2 01 - dd mm yy', 'Missing number at position 0');
	expectError(function() { $.datepicker.parseDate('d m y', '3 Feb 01'); },
		'3 Feb 01 - d m y', 'Missing number at position 2');
	expectError(function() { $.datepicker.parseDate('dd mm yy', '3 Feb 01'); },
		'3 Feb 01 - dd mm yy', 'Missing number at position 2');
	expectError(function() { $.datepicker.parseDate('d m y', '3 2 AD01'); },
		'3 2 AD01 - d m y', 'Missing number at position 4');
	expectError(function() { $.datepicker.parseDate('d m yy', '3 2 AD01'); },
		'3 2 AD01 - dd mm yy', 'Missing number at position 4');
	expectError(function() { $.datepicker.parseDate('y-o', '01-D01'); },
		'2001-D01 - y-o', 'Missing number at position 3');
	expectError(function() { $.datepicker.parseDate('yy-oo', '2001-D01'); },
		'2001-D01 - yy-oo', 'Missing number at position 5');
	expectError(function() { $.datepicker.parseDate('D d M y', 'D7 3 Feb 01'); },
		'D7 3 Feb 01 - D d M y', 'Unknown name at position 0');
	expectError(function() { $.datepicker.parseDate('D d M y', 'Sat 3 M2 01'); },
		'Sat 3 M2 01 - D d M y', 'Unknown name at position 6');
	expectError(function() { $.datepicker.parseDate('DD, MM d, yy', 'Saturday- Feb 3, 2001'); },
		'Saturday- Feb 3, 2001 - DD, MM d, yy', 'Unexpected literal at position 8');
	expectError(function() { $.datepicker.parseDate('\'day\' d \'of\' MM (\'\'DD\'\'), yy',
		'day 3 of February ("Saturday"), 2001'); },
		'day 3 of Mon2 ("Day7"), 2001', 'Unexpected literal at position 19');
	expectError(function() { $.datepicker.parseDate('d m y', '29 2 01'); },
		'29 2 01 - d m y', 'Invalid date');
	fr = $.datepicker.regional.fr;
	settings = {dayNamesShort: fr.dayNamesShort, dayNames: fr.dayNames,
		monthNamesShort: fr.monthNamesShort, monthNames: fr.monthNames};
	expectError(function() { $.datepicker.parseDate('D d M y', 'Mon 9 Avr 01', settings); },
		'Mon 9 Avr 01 - D d M y', 'Unknown name at position 0');
	expectError(function() { $.datepicker.parseDate('D d M y', 'Lun. 9 Apr 01', settings); },
		'Lun. 9 Apr 01 - D d M y', 'Unknown name at position 7');
});

test('formatDate', function() {
	init('#inp');
	var gmtDate, fr, settings;
	equal($.datepicker.formatDate('d m y', new Date(2001, 2 - 1, 3)),
		'3 2 01', 'Format date d m y');
	equal($.datepicker.formatDate('dd mm yy', new Date(2001, 2 - 1, 3)),
		'03 02 2001', 'Format date dd mm yy');
	equal($.datepicker.formatDate('d m y', new Date(2001, 12 - 1, 13)),
		'13 12 01', 'Format date d m y');
	equal($.datepicker.formatDate('dd mm yy', new Date(2001, 12 - 1, 13)),
		'13 12 2001', 'Format date dd mm yy');
	equal($.datepicker.formatDate('yy-o', new Date(2001, 2 - 1, 3)),
		'2001-34', 'Format date yy-o');
	equal($.datepicker.formatDate('yy-oo', new Date(2001, 2 - 1, 3)),
		'2001-034', 'Format date yy-oo');
	equal($.datepicker.formatDate('D M y', new Date(2001, 2 - 1, 3)),
		'Sat Feb 01', 'Format date D M y');
	equal($.datepicker.formatDate('DD MM yy', new Date(2001, 2 - 1, 3)),
		'Saturday February 2001', 'Format date DD MM yy');
	equal($.datepicker.formatDate('DD, MM d, yy', new Date(2001, 2 - 1, 3)),
		'Saturday, February 3, 2001', 'Format date DD, MM d, yy');
	equal($.datepicker.formatDate('\'day\' d \'of\' MM (\'\'DD\'\'), yy',
		new Date(2001, 2 - 1, 3)), 'day 3 of February (\'Saturday\'), 2001',
		'Format date \'day\' d \'of\' MM (\'\'DD\'\'), yy');
	gmtDate = new Date(2001, 2 - 1, 3);
	gmtDate.setMinutes(gmtDate.getMinutes() - gmtDate.getTimezoneOffset());
	equal($.datepicker.formatDate('@', gmtDate), '981158400000', 'Format date @');
	equal($.datepicker.formatDate('!', gmtDate), '631167552000000000', 'Format date !');
	fr = $.datepicker.regional.fr;
	settings = {dayNamesShort: fr.dayNamesShort, dayNames: fr.dayNames,
		monthNamesShort: fr.monthNamesShort, monthNames: fr.monthNames};
	equal($.datepicker.formatDate('D M y', new Date(2001, 4 - 1, 9), settings),
		'Lun. Avril 01', 'Format date D M y with settings');
	equal($.datepicker.formatDate('DD MM yy', new Date(2001, 4 - 1, 9), settings),
		'Lundi Avril 2001', 'Format date DD MM yy with settings');
	equal($.datepicker.formatDate('DD, MM d, yy', new Date(2001, 4 - 1, 9), settings),
		'Lundi, Avril 9, 2001', 'Format date DD, MM d, yy with settings');
	equal($.datepicker.formatDate('\'jour\' d \'de\' MM (\'\'DD\'\'), yy',
		new Date(2001, 4 - 1, 9), settings), 'jour 9 de Avril (\'Lundi\'), 2001',
		'Format date \'jour\' d \'de\' MM (\'\'DD\'\'), yy with settings');
});

})(jQuery);
