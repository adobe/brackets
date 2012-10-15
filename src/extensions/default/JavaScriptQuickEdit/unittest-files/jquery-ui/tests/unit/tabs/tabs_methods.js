(function( $ ) {

var disabled = TestHelpers.tabs.disabled,
	state = TestHelpers.tabs.state;

module( "tabs: methods" );

test( "destroy", function() {
	domEqual( "#tabs1", function() {
		$( "#tabs1" ).tabs().tabs( "destroy" );
	});
});

test( "enable", function() {
	expect( 8 );

	var element = $( "#tabs1" ).tabs({ disabled: true });
	disabled( element, true );
	element.tabs( "enable" );
	disabled( element, false );
	element.tabs( "destroy" );

	element.tabs({ disabled: [ 0, 1 ] });
	disabled( element, [ 0, 1 ] );
	element.tabs( "enable" );
	disabled( element, false );
});

test( "enable( index )", function() {
    expect( 10 );

	var element = $( "#tabs1" ).tabs({ disabled: true });
	disabled( element, true );
	// fully disabled -> partially disabled
	element.tabs( "enable", 1 );
	disabled( element, [ 0, 2 ] );
	// partially disabled -> partially disabled
	element.tabs( "enable", 2 );
	disabled( element, [ 0 ] );
	// already enabled tab, no change
	element.tabs( "enable", 2 );
	disabled( element, [ 0 ] );
	// partially disabled -> fully enabled
	element.tabs( "enable", 0 );
	disabled( element, false );
});

test( "disable", function() {
	expect( 8 );

	var element = $( "#tabs1" ).tabs({ disabled: false });
	disabled( element, false );
	element.tabs( "disable" );
	disabled( element, true );
	element.tabs( "destroy" );

	element.tabs({ disabled: [ 0, 1 ] });
	disabled( element, [ 0, 1 ] );
	element.tabs( "disable" );
	disabled( element, true );
});

test( "disable( index )", function() {
    expect( 10 );

	var element = $( "#tabs1" ).tabs({ disabled: false });
	disabled( element, false );
	// fully enabled -> partially disabled
	element.tabs( "disable", 1 );
	disabled( element, [ 1 ] );
	// partially disabled -> partially disabled
	element.tabs( "disable", 2 );
	disabled( element, [ 1, 2 ] );
	// already disabled tab, no change
	element.tabs( "disable", 2 );
	disabled( element, [ 1, 2 ] );
	// partially disabled -> fully disabled
	element.tabs( "disable", 0 );
	disabled( element, true );
});

test( "refresh", function() {
	expect( 27 );

	var element = $( "#tabs1" ).tabs();
	state( element, 1, 0, 0 );
	disabled( element, false );

	// disable tab via markup
	element.find( ".ui-tabs-nav li" ).eq( 1 ).addClass( "ui-state-disabled" );
	element.tabs( "refresh" );
	state( element, 1, 0, 0 );
	disabled( element, [ 1 ] );

	// add remote tab
	element.find( ".ui-tabs-nav" ).append( "<li id='newTab'><a href='data/test.html'>new</a></li>" );
	element.tabs( "refresh" );
	state( element, 1, 0, 0, 0 );
	disabled( element, [ 1 ] );
	equal( element.find( "#" + $( "#newTab" ).attr( "aria-controls" ) ).length, 1,
		"panel added for remote tab" );

	// remove all tabs
	element.find( ".ui-tabs-nav li, .ui-tabs-panel" ).remove();
	element.tabs( "refresh" );
	state( element );
	equal( element.tabs( "option", "active" ), false, "no active tab" );

	// add tabs
	element.find( ".ui-tabs-nav" )
		.append( "<li class='ui-state-disabled'><a href='#newTab2'>new 2</a></li>" )
		.append( "<li><a href='#newTab3'>new 3</a></li>" )
		.append( "<li><a href='#newTab4'>new 4</a></li>" )
		.append( "<li><a href='#newTab5'>new 5</a></li>" );
	element
		.append( "<div id='newTab2'>new 2</div>" )
		.append( "<div id='newTab3'>new 3</div>" )
		.append( "<div id='newTab4'>new 4</div>" )
		.append( "<div id='newTab5'>new 5</div>" );
	element.tabs( "refresh" );
	state( element, 0, 0, 0, 0 );
	disabled( element, [ 0 ] );

	// activate third tab
	element.tabs( "option", "active", 2 );
	state( element, 0, 0, 1, 0 );
	disabled( element, [ 0 ] );

	// remove fourth tab, third tab should stay active
	element.find( ".ui-tabs-nav li" ).eq( 3 ).remove();
	element.find( ".ui-tabs-panel" ).eq( 3 ).remove();
	element.tabs( "refresh" );
	state( element, 0, 0, 1 );
	disabled( element, [ 0 ] );

	// remove third (active) tab, second tab should become active
	element.find( ".ui-tabs-nav li" ).eq( 2 ).remove();
	element.find( ".ui-tabs-panel" ).eq( 2 ).remove();
	element.tabs( "refresh" );
	state( element, 0, 1 );
	disabled( element, [ 0 ] );

	// remove first tab, previously active tab (now first) should stay active
	element.find( ".ui-tabs-nav li" ).eq( 0 ).remove();
	element.find( ".ui-tabs-panel" ).eq( 0 ).remove();
	element.tabs( "refresh" );
	state( element, 1 );
	disabled( element, false );
});

test( "refresh - looping", function() {
	expect( 6 );

	var element = $( "#tabs1" ).tabs({
		disabled: [ 0 ],
		active: 1
	});
	state( element, 0, 1, 0 );
	disabled( element, [ 0 ] );

	// remove active, jump to previous
	// previous is disabled, just back one more
	// reached first tab, move to end
	// activate last tab
	element.find( ".ui-tabs-nav li" ).eq( 2 ).remove();
	element.tabs( "refresh" );
	state( element, 0, 1 );
	disabled( element, [ 0 ] );
});

asyncTest( "load", function() {
	expect( 30 );

	var element = $( "#tabs2" ).tabs();

	// load content of inactive tab
	// useful for preloading content with custom caching
	element.one( "tabsbeforeload", function( event, ui ) {
		var tab = element.find( ".ui-tabs-nav li" ).eq( 3 ),
			panelId = tab.attr( "aria-controls" ),
			panel = $( "#" + panelId );

		ok( !( "originalEvent" in event ), "originalEvent" );
		equal( ui.tab.length, 1, "tab length" );
		strictEqual( ui.tab[ 0 ], tab[ 0 ], "tab" );
		equal( ui.panel.length, 1, "panel length" );
		strictEqual( ui.panel[ 0 ], panel[ 0 ], "panel" );
		state( element, 1, 0, 0, 0, 0 );
	});
	element.one( "tabsload", function( event, ui ) {
		// TODO: remove wrapping in 2.0
		var uiTab = $( ui.tab ),
			uiPanel = $( ui.panel ),
			tab = element.find( ".ui-tabs-nav li" ).eq( 3 ),
			panelId = tab.attr( "aria-controls" ),
			panel = $( "#" + panelId );

		ok( !( "originalEvent" in event ), "originalEvent" );
		equal( uiTab.length, 1, "tab length" );
		if ( $.uiBackCompat === false ) {
			strictEqual( uiTab[ 0 ], tab[ 0 ], "tab" );
		} else {
			strictEqual( uiTab[ 0 ], tab.find( ".ui-tabs-anchor" )[ 0 ], "tab" );
		}
		equal( uiPanel.length, 1, "panel length" );
		strictEqual( uiPanel[ 0 ], panel[ 0 ], "panel" );
		equal( uiPanel.find( "p" ).length, 1, "panel html" );
		state( element, 1, 0, 0, 0, 0 );
		setTimeout( tabsload1, 100 );
	});
	element.tabs( "load", 3 );
	state( element, 1, 0, 0, 0, 0 );

	function tabsload1() {
		// no need to test details of event (tested in events tests)
		element.one( "tabsbeforeload", function() {
			ok( true, "tabsbeforeload invoked" );
		});
		element.one( "tabsload", function() {
			ok( true, "tabsload invoked" );
			setTimeout( tabsload2, 100 );
		});
		element.tabs( "option", "active", 3 );
		state( element, 0, 0, 0, 1, 0 );
	}

	function tabsload2() {
		// reload content of active tab
		element.one( "tabsbeforeload", function( event, ui ) {
			var tab = element.find( ".ui-tabs-nav li" ).eq( 3 ),
				panelId = tab.attr( "aria-controls" ),
				panel = $( "#" + panelId );

			ok( !( "originalEvent" in event ), "originalEvent" );
			equal( ui.tab.length, 1, "tab length" );
			strictEqual( ui.tab[ 0 ], tab[ 0 ], "tab" );
			equal( ui.panel.length, 1, "panel length" );
			strictEqual( ui.panel[ 0 ], panel[ 0 ], "panel" );
			state( element, 0, 0, 0, 1, 0 );
		});
		element.one( "tabsload", function( event, ui ) {
			// TODO: remove wrapping in 2.0
			var uiTab = $( ui.tab ),
				uiPanel = $( ui.panel ),
				tab = element.find( ".ui-tabs-nav li" ).eq( 3 ),
				panelId = tab.attr( "aria-controls" ),
				panel = $( "#" + panelId );

			ok( !( "originalEvent" in event ), "originalEvent" );
			equal( uiTab.length, 1, "tab length" );
			if ( $.uiBackCompat === false ) {
				strictEqual( uiTab[ 0 ], tab[ 0 ], "tab" );
			} else {
				strictEqual( uiTab[ 0 ], tab.find( ".ui-tabs-anchor" )[ 0 ], "tab" );
			}
			equal( uiPanel.length, 1, "panel length" );
			strictEqual( uiPanel[ 0 ], panel[ 0 ], "panel" );
			state( element, 0, 0, 0, 1, 0 );
			start();
		});
		element.tabs( "load", 3 );
		state( element, 0, 0, 0, 1, 0 );
	}
});

}( jQuery ) );
