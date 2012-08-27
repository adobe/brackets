/*
 * datepicker_methods.js
 */
(function($) {

module("datepicker: methods");

test('destroy', function() {
	var inl,
		inp = init('#inp');
	ok(inp.is('.hasDatepicker'), 'Default - marker class set');
	ok($.data(inp[0], PROP_NAME), 'Default - instance present');
	ok(inp.next().is('#alt'), 'Default - button absent');
	inp.datepicker('destroy');
	inp = $('#inp');
	ok(!inp.is('.hasDatepicker'), 'Default - marker class cleared');
	ok(!$.data(inp[0], PROP_NAME), 'Default - instance absent');
	ok(inp.next().is('#alt'), 'Default - button absent');
	// With button
	inp= init('#inp', {showOn: 'both'});
	ok(inp.is('.hasDatepicker'), 'Button - marker class set');
	ok($.data(inp[0], PROP_NAME), 'Button - instance present');
	ok(inp.next().text() === '...', 'Button - button added');
	inp.datepicker('destroy');
	inp = $('#inp');
	ok(!inp.is('.hasDatepicker'), 'Button - marker class cleared');
	ok(!$.data(inp[0], PROP_NAME), 'Button - instance absent');
	ok(inp.next().is('#alt'), 'Button - button removed');
	// With append text
	inp = init('#inp', {appendText: 'Testing'});
	ok(inp.is('.hasDatepicker'), 'Append - marker class set');
	ok($.data(inp[0], PROP_NAME), 'Append - instance present');
	ok(inp.next().text() === 'Testing', 'Append - append text added');
	inp.datepicker('destroy');
	inp = $('#inp');
	ok(!inp.is('.hasDatepicker'), 'Append - marker class cleared');
	ok(!$.data(inp[0], PROP_NAME), 'Append - instance absent');
	ok(inp.next().is('#alt'), 'Append - append text removed');
	// With both
	inp= init('#inp', {showOn: 'both', buttonImageOnly: true,
		buttonImage: 'img/calendar.gif', appendText: 'Testing'});
	ok(inp.is('.hasDatepicker'), 'Both - marker class set');
	ok($.data(inp[0], PROP_NAME), 'Both - instance present');
	ok(inp.next()[0].nodeName.toLowerCase() === 'img', 'Both - button added');
	ok(inp.next().next().text() === 'Testing', 'Both - append text added');
	inp.datepicker('destroy');
	inp = $('#inp');
	ok(!inp.is('.hasDatepicker'), 'Both - marker class cleared');
	ok(!$.data(inp[0], PROP_NAME), 'Both - instance absent');
	ok(inp.next().is('#alt'), 'Both - button and append text absent');
	// Inline
	inl = init('#inl');
	ok(inl.is('.hasDatepicker'), 'Inline - marker class set');
	ok(inl.html() !== '', 'Inline - datepicker present');
	ok($.data(inl[0], PROP_NAME), 'Inline - instance present');
	ok(inl.next().length === 0 || inl.next().is('p'), 'Inline - button absent');
	inl.datepicker('destroy');
	inl = $('#inl');
	ok(!inl.is('.hasDatepicker'), 'Inline - marker class cleared');
	ok(inl.html() === '', 'Inline - datepicker absent');
	ok(!$.data(inl[0], PROP_NAME), 'Inline - instance absent');
	ok(inl.next().length === 0 || inl.next().is('p'), 'Inline - button absent');
});

test('enableDisable', function() {
	var inl, dp,
		inp = init('#inp');
	ok(!inp.datepicker('isDisabled'), 'Enable/disable - initially marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable - field initially enabled');
	inp.datepicker('disable');
	ok(inp.datepicker('isDisabled'), 'Enable/disable - now marked as disabled');
	ok(inp[0].disabled, 'Enable/disable - field now disabled');
	inp.datepicker('enable');
	ok(!inp.datepicker('isDisabled'), 'Enable/disable - now marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable - field now enabled');
	inp.datepicker('destroy');
	// With a button
	inp = init('#inp', {showOn: 'button'});
	ok(!inp.datepicker('isDisabled'), 'Enable/disable button - initially marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable button - field initially enabled');
	ok(!inp.next('button')[0].disabled, 'Enable/disable button - button initially enabled');
	inp.datepicker('disable');
	ok(inp.datepicker('isDisabled'), 'Enable/disable button - now marked as disabled');
	ok(inp[0].disabled, 'Enable/disable button - field now disabled');
	ok(inp.next('button')[0].disabled, 'Enable/disable button - button now disabled');
	inp.datepicker('enable');
	ok(!inp.datepicker('isDisabled'), 'Enable/disable button - now marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable button - field now enabled');
	ok(!inp.next('button')[0].disabled, 'Enable/disable button - button now enabled');
	inp.datepicker('destroy');
	// With an image button
	inp = init('#inp', {showOn: 'button', buttonImageOnly: true,
		buttonImage: 'img/calendar.gif'});
	ok(!inp.datepicker('isDisabled'), 'Enable/disable image - initially marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable image - field initially enabled');
	ok(parseFloat(inp.next('img').css('opacity')) === 1, 'Enable/disable image - image initially enabled');
	inp.datepicker('disable');
	ok(inp.datepicker('isDisabled'), 'Enable/disable image - now marked as disabled');
	ok(inp[0].disabled, 'Enable/disable image - field now disabled');
	ok(parseFloat(inp.next('img').css('opacity')) !== 1, 'Enable/disable image - image now disabled');
	inp.datepicker('enable');
	ok(!inp.datepicker('isDisabled'), 'Enable/disable image - now marked as enabled');
	ok(!inp[0].disabled, 'Enable/disable image - field now enabled');
	ok(parseFloat(inp.next('img').css('opacity')) === 1, 'Enable/disable image - image now enabled');
	inp.datepicker('destroy');
	// Inline
	inl = init('#inl', {changeYear: true});
	dp = $('.ui-datepicker-inline', inl);
	ok(!inl.datepicker('isDisabled'), 'Enable/disable inline - initially marked as enabled');
	ok(!dp.children().is('.ui-state-disabled'), 'Enable/disable inline - not visually disabled initially');
	ok(!dp.find('select').prop('disabled'), 'Enable/disable inline - form element enabled initially');
	inl.datepicker('disable');
	ok(inl.datepicker('isDisabled'), 'Enable/disable inline - now marked as disabled');
	ok(dp.children().is('.ui-state-disabled'), 'Enable/disable inline - visually disabled');
	ok(dp.find('select').prop('disabled'), 'Enable/disable inline - form element disabled');
	inl.datepicker('enable');
	ok(!inl.datepicker('isDisabled'), 'Enable/disable inline - now marked as enabled');
	ok(!dp.children().is('.ui-state-disabled'), 'Enable/disable inline - not visiually disabled');
	ok(!dp.find('select').prop('disabled'), 'Enable/disable inline - form element enabled');
	inl.datepicker('destroy');
});

})(jQuery);
