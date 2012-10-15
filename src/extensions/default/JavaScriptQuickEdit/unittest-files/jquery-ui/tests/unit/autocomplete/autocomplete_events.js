(function( $ ) {

module( "autocomplete: events" );

var data = [ "Clojure", "COBOL", "ColdFusion", "Java", "JavaScript", "Scala", "Scheme" ];

$.each([
	{
		type: "input",
		selector: "#autocomplete",
		valueMethod: "val"
	},
	{
		type: "textarea",
		selector: "#autocomplete-textarea",
		valueMethod: "val"
	},
	{
		type: "contenteditable",
		selector: "#autocomplete-contenteditable",
		valueMethod: "text"
	}
], function( i, settings ) {
	asyncTest( "all events - " + settings.type, function() {
		expect( 13 );
		var element = $( settings.selector )
				.autocomplete({
					autoFocus: false,
					delay: 0,
					source: data,
					search: function( event ) {
						equal( event.originalEvent.type, "keydown", "search originalEvent" );
					},
					response: function( event, ui ) {
						deepEqual( ui.content, [
							{ label: "Clojure", value: "Clojure" },
							{ label: "Java", value: "Java" },
							{ label: "JavaScript", value: "JavaScript" }
						], "response ui.content" );
						ui.content.splice( 0, 1 );
					},
					open: function( event ) {
						ok( menu.is( ":visible" ), "menu open on open" );
					},
					focus: function( event, ui ) {
						equal( event.originalEvent.type, "menufocus", "focus originalEvent" );
						deepEqual( ui.item, { label: "Java", value: "Java" }, "focus ui.item" );
					},
					close: function( event ) {
						equal( event.originalEvent.type, "menuselect", "close originalEvent" );
						ok( menu.is( ":hidden" ), "menu closed on close" );
					},
					select: function( event, ui ) {
						equal( event.originalEvent.type, "menuselect", "select originalEvent" );
						deepEqual( ui.item, { label: "Java", value: "Java" }, "select ui.item" );
					},
					change: function( event, ui ) {
						equal( event.originalEvent.type, "blur", "change originalEvent" );
						deepEqual( ui.item, { label: "Java", value: "Java" }, "change ui.item" );
						ok( menu.is( ":hidden" ), "menu closed on change" );
						start();
					}
				}),
			menu = element.autocomplete( "widget" );

		element.simulate( "focus" )[ settings.valueMethod ]( "j" ).keydown();
		setTimeout(function() {
			ok( menu.is( ":visible" ), "menu is visible after delay" );
			element.simulate( "keydown", { keyCode: $.ui.keyCode.DOWN } );
			element.simulate( "keydown", { keyCode: $.ui.keyCode.ENTER } );
			// blur must be async for IE to handle it properly
			setTimeout(function() {
				element.simulate( "blur" );
			}, 1 );
		}, 50 );
	});
});

asyncTest( "change without selection", function() {
	expect( 1 );
	var element = $( "#autocomplete" ).autocomplete({
		delay: 0,
		source: data,
		change: function( event, ui ) {
			strictEqual( ui.item, null );
			start();
		}
	});
	element.triggerHandler( "focus" );
	element.val( "ja" ).triggerHandler( "blur" );
});

asyncTest( "cancel search", function() {
	expect( 6 );
	var first = true,
		element = $( "#autocomplete" ).autocomplete({
			delay: 0,
			source: data,
			search: function() {
				if ( first ) {
					equal( element.val(), "ja", "val on first search" );
					first = false;
					return false;
				}
				equal( element.val(), "java", "val on second search" );
			},
			open: function() {
				ok( true, "menu opened" );
			}
		}),
		menu = element.autocomplete( "widget" );
	element.val( "ja" ).keydown();
	setTimeout(function() {
		ok( menu.is( ":hidden" ), "menu is hidden after first search" );
		element.val( "java" ).keydown();
		setTimeout(function() {
			ok( menu.is( ":visible" ), "menu is visible after second search" );
			equal( menu.find( ".ui-menu-item" ).length, 2, "# of menu items" );
			start();
		}, 50 );
	}, 50 );
});

asyncTest( "cancel focus", function() {
	expect( 1 );
	var customVal = "custom value",
		element = $( "#autocomplete" ).autocomplete({
			delay: 0,
			source: data,
			focus: function( event, ui ) {
				$( this ).val( customVal );
				return false;
			}
		});
	element.val( "ja" ).keydown();
	setTimeout(function() {
		element.simulate( "keydown", { keyCode: $.ui.keyCode.DOWN } );
		equal( element.val(), customVal );
		start();
	}, 50 );
});

asyncTest( "cancel select", function() {
	expect( 1 );
	var customVal = "custom value",
		element = $( "#autocomplete" ).autocomplete({
			delay: 0,
			source: data,
			select: function( event, ui ) {
				$( this ).val( customVal );
				return false;
			}
		});
	element.val( "ja" ).keydown();
	setTimeout(function() {
		element.simulate( "keydown", { keyCode: $.ui.keyCode.DOWN } );
		element.simulate( "keydown", { keyCode: $.ui.keyCode.ENTER } );
		equal( element.val(), customVal );
		start();
	}, 50 );
});

asyncTest( "blur during remote search", function() {
	expect( 1 );
	var ac = $( "#autocomplete" ).autocomplete({
		delay: 0,
		source: function( request, response ) {
			ok( true, "trigger request" );
			ac.simulate( "blur" );
			setTimeout(function() {
				response([ "result" ]);
				start();
			}, 100 );
		},
		open: function() {
			ok( false, "opened after a blur" );
		}
	});
	ac.val( "ro" ).keydown();
});

}( jQuery ) );
