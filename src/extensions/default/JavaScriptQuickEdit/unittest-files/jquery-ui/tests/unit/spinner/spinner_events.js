(function( $ ) {

var simulateKeyDownUp = TestHelpers.spinner.simulateKeyDownUp;

module( "spinner: events" );

test( "start", function() {
	expect( 6 );
	var element = $( "#spin" ).spinner();

	function shouldStart( expectation, msg ) {
		element.spinner( "option", "start", function() {
			ok( expectation, msg );
		});
	}

	shouldStart( true, "key UP" );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	shouldStart( true, "key DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );

	shouldStart( true, "key PAGE_UP" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	shouldStart( true, "key PAGE_DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );

	shouldStart( true, "button up" );
	element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
	shouldStart( true, "button down" );
	element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();

	shouldStart( false, "stepUp" );
	element.spinner( "stepUp" );
	shouldStart( false, "stepDown" );
	element.spinner( "stepDown" );

	shouldStart( false, "pageUp" );
	element.spinner( "pageUp" );
	shouldStart( false, "pageDown" );
	element.spinner( "pageDown" );

	shouldStart( false, "value" );
	element.spinner( "value", 999 );
});

test( "spin", function() {
	expect( 6 );
	var element = $( "#spin" ).spinner();

	function shouldSpin( expectation, msg ) {
		element.spinner( "option", "spin", function() {
			ok( expectation, msg );
		});
	}

	shouldSpin( true, "key UP" );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	shouldSpin( true, "key DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );

	shouldSpin( true, "key PAGE_UP" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	shouldSpin( true, "key PAGE_DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );

	shouldSpin( true, "button up" );
	element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
	shouldSpin( true, "button down" );
	element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();

	shouldSpin( false, "stepUp" );
	element.spinner( "stepUp" );
	shouldSpin( false, "stepDown" );
	element.spinner( "stepDown" );

	shouldSpin( false, "pageUp" );
	element.spinner( "pageUp" );
	shouldSpin( false, "pageDown" );
	element.spinner( "pageDown" );

	shouldSpin( false, "value" );
	element.spinner( "value", 999 );
});

test( "stop", function() {
	expect( 6 );
	var element = $( "#spin" ).spinner();

	function shouldStop( expectation, msg ) {
		element.spinner( "option", "stop", function() {
			ok( expectation, msg );
		});
	}

	shouldStop( true, "key UP" );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	shouldStop( true, "key DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );

	shouldStop( true, "key PAGE_UP" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	shouldStop( true, "key PAGE_DOWN" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );

	shouldStop( true, "button up" );
	element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
	shouldStop( true, "button down" );
	element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();

	shouldStop( false, "stepUp" );
	element.spinner( "stepUp" );
	shouldStop( false, "stepDown" );
	element.spinner( "stepDown" );

	shouldStop( false, "pageUp" );
	element.spinner( "pageUp" );
	shouldStop( false, "pageDown" );
	element.spinner( "pageDown" );

	shouldStop( false, "value" );
	element.spinner( "value", 999 );
});

asyncTest( "change", function() {
	expect( 14 );
	var element = $( "#spin" ).spinner();

	function shouldChange( expectation, msg ) {
		element.spinner( "option", "change", function() {
			ok( expectation, msg );
		});
	}

	element.focus();
	shouldChange( false, "key UP, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	shouldChange( true, "blur after key UP" );
	element.blur();

	element.focus();
	shouldChange( false, "key DOWN, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	shouldChange( true, "blur after key DOWN" );
	element.blur();

	element.focus();
	shouldChange( false, "key PAGE_UP, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_UP );
	shouldChange( true, "blur after key PAGE_UP" );
	element.blur();

	element.focus();
	shouldChange( false, "key PAGE_DOWN, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	shouldChange( true, "blur after key PAGE_DOWN" );
	element.blur();

	shouldChange( false, "many keys, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.PAGE_DOWN );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	shouldChange( true, "blur after many keys" );
	element.blur();

	shouldChange( false, "many keys, same final value, before blur" );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	simulateKeyDownUp( element, $.ui.keyCode.UP );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	simulateKeyDownUp( element, $.ui.keyCode.DOWN );
	shouldChange( false, "blur after many keys, same final value" );

	shouldChange( false, "button up, before blur" );
	element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
	shouldChange( true, "blur after button up" );
	setTimeout(function() {
		element.blur();

		shouldChange( false, "button down, before blur" );
		element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();
		shouldChange( true, "blur after button down" );
		setTimeout(function() {
			element.blur();

			shouldChange( false, "many buttons, same final value, before blur" );
			element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
			element.spinner( "widget" ).find( ".ui-spinner-up" ).mousedown().mouseup();
			element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();
			element.spinner( "widget" ).find( ".ui-spinner-down" ).mousedown().mouseup();
			shouldChange( false, "blur after many buttons, same final value" );
			element.blur();
			setTimeout(function() {
				shouldChange( true, "stepUp" );
				element.spinner( "stepUp" );

				shouldChange( true, "stepDown" );
				element.spinner( "stepDown" );

				shouldChange( true, "pageUp" );
				element.spinner( "pageUp" );

				shouldChange( true, "pageDown" );
				element.spinner( "pageDown" );

				shouldChange( true, "value" );
				element.spinner( "value", 999 );

				shouldChange( false, "value, same value" );
				element.spinner( "value", 999 );

				shouldChange( true, "max, value changed" );
				element.spinner( "option", "max", 900 );

				shouldChange( false, "max, value not changed" );
				element.spinner( "option", "max", 1000 );

				shouldChange( true, "min, value changed" );
				element.spinner( "option", "min", 950 );

				shouldChange( false, "min, value not changed" );
				element.spinner( "option", "min", 200 );
				start();
			});
		});
	});
});

})( jQuery );
