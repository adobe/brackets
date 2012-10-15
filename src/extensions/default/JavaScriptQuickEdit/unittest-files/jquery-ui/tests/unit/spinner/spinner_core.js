(function( $ ) {

var simulateKeyDownUp = TestHelpers.spinner.simulateKeyDownUp;

module( "spinner: core" );

test( "keydown UP on input, increases value not greater than max", function() {
	expect( 5 );
	var element = $( "#spin" ).val( 70 ).spinner({
		max: 100,
		step: 10
	});

	simulateKeyDownUp( element, $.ui.keyCode.UP );
	equal( element.val(), 80 );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	equal( element.val(), 90 );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	equal( element.val(), 100 );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	equal( element.val(), 100 );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	equal( element.val(), 100 );
});

test( "keydown DOWN on input, decreases value not less than min", function() {
	expect( 5 );
	var element = $( "#spin" ).val( 50 ).spinner({
		min: 20,
		step: 10
	});

	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	equal( element.val(), 40 );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	equal( element.val(), 30 );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	equal( element.val(), 20 );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	equal( element.val(), 20 );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	equal( element.val(), 20 );
});

test( "keydown PAGE_UP on input, increases value not greater than max", function() {
	expect( 5 );
	var element = $( "#spin" ).val( 70 ).spinner({
		max: 100,
		page: 10
	});

	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	equal( element.val(), 80 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	equal( element.val(), 90 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	equal( element.val(), 100 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	equal( element.val(), 100 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	equal( element.val(), 100 );
});

test( "keydown PAGE_DOWN on input, decreases value not less than min", function() {
	expect( 5 );
	var element = $( "#spin" ).val( 50 ).spinner({
		min: 20,
		page: 10
	});

	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	equal( element.val(), 40 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	equal( element.val(), 30 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	equal( element.val(), 20 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	equal( element.val(), 20 );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	equal( element.val(), 20 );
});

test( "mouse click on up button, increases value not greater than max", function() {
	expect( 3 );
	var element = $( "#spin" ).val( 18 ).spinner({
			max: 20
		}),
		button = element.spinner( "widget" ).find( ".ui-spinner-up" );

	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 19 );
	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 20 );
	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 20 );
});

test( "mouse click on up button, increases value not greater than max", function() {
	expect( 3 );
	var element = $( "#spin" ).val( 2 ).spinner({
		min: 0
	}),
	button = element.spinner( "widget" ).find( ".ui-spinner-down" );

	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 1 );
	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 0 );
	button.trigger( "mousedown" ).trigger( "mouseup" );
	equal( element.val(), 0 );
});

test( "mousewheel on input", function() {
	expect( 4 );

	var element = $( "#spin" ).val( 0 ).spinner({
		step: 2
	});

	element.trigger( "mousewheel" );
	equal( element.val(), 0, "mousewheel event without delta does not change value" );

	element.trigger( "mousewheel", 1 );
	equal( element.val(), 2 );

	element.trigger( "mousewheel", -0.2 );
	equal( element.val(), 0 );

	element.trigger( "mousewheel", -15 );
	equal(element.val(), -2 );
});

test( "reading HTML5 attributes", function() {
	expect( 6 );
	var markup = "<input type='number' min='-100' max='100' value='5' step='2'>",
		element = $( markup ).spinner();
	equal( element.spinner( "option", "min" ), -100, "min from markup" );
	equal( element.spinner( "option", "max" ), 100, "max from markup" );
	equal( element.spinner( "option", "step" ), 2, "step from markup" );

	element = $( markup ).spinner({
		min: -200,
		max: 200,
		step: 5
	});
	equal( element.spinner( "option", "min" ), -200, "min from options" );
	equal( element.spinner( "option", "max" ), 200, "max from options" );
	equal( element.spinner( "option", "step" ), 5, "stop from options" );
});

test( "ARIA attributes", function() {
	expect( 9 );
	var element = $( "#spin" ).val( 2 ).spinner({ min: -5, max: 5 });

	equal( element.attr( "role" ), "spinbutton", "role" );
	equal( element.attr( "aria-valuemin" ), "-5", "aria-valuemin" );
	equal( element.attr( "aria-valuemax" ), "5", "aria-valuemax" );
	equal( element.attr( "aria-valuenow" ), "2", "aria-valuenow" );

	element.spinner( "stepUp" );

	equal( element.attr( "aria-valuenow" ), "3", "stepUp 1 step changes aria-valuenow" );

	element.spinner( "option", { min: -10, max: 10 } );

	equal( element.attr( "aria-valuemin" ), "-10", "min option changed aria-valuemin changes" );
	equal( element.attr( "aria-valuemax" ), "10", "max option changed aria-valuemax changes" );

	element.spinner( "option", "min", null );
	equal( element.attr( "aria-valuemin" ), undefined, "aria-valuemin not set when no min" );

	element.spinner( "option", "max", null );
	equal( element.attr( "aria-valuemax" ), undefined, "aria-valuemax not set when no max" );
});

test( "focus text field when pressing button", function() {
	expect( 2 );
	var element = $( "#spin" ).spinner();
	$( "body" ).focus();
	ok( element[ 0 ] !== document.activeElement, "not focused before" );
	element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown();
	ok( element[ 0 ] === document.activeElement, "focused after" );
});

test( "don't clear invalid value on blur", function() {
	expect( 1 );
	var element = $( "#spin" ).spinner();
	element.focus().val( "a" ).blur();
	equal( element.val(), "a" );
});

test( "precision", function() {
	expect( 2 );
	var element = $( "#spin" ).val( 0.05 ).spinner({
		step: 0.0001
	});
	element.spinner( "stepUp" );
	equal( element.val(), "0.0501", "precision from step" );

	element.val( 1.05 ).spinner( "option", {
		step: 1,
		min: -9.95
	});
	element.spinner( "stepDown" );
	equal( element.val(), "0.05", "precision from min" );
});

})( jQuery );
