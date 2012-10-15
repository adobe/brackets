(function( $ ) {

var state = TestHelpers.tabs.state;

module( "tabs: core" );

test( "markup structure", function() {
	expect( 3 );
	var element = $( "#tabs1" ).tabs();
	ok( element.hasClass( "ui-tabs" ), "main element is .ui-tabs" );
	ok( element.find( "ul" ).hasClass( "ui-tabs-nav" ), "list item is .ui-tabs-nav" );
	equal( element.find( ".ui-tabs-panel" ).length, 3,
		".ui-tabs-panel elements exist, correct number" );
});

$.each({
	"deep ul": "#tabs3",
	"multiple lists, ul first": "#tabs4",
	"multiple lists, ol first": "#tabs5",
	"empty list": "#tabs6"
}, function( type, selector ) {
	test( "markup structure: " + type, function() {
		expect( 2 );
		var element = $( selector ).tabs();
		ok( element.hasClass( "ui-tabs" ), "main element is .ui-tabs" );
		ok( $( selector + "-list" ).hasClass( "ui-tabs-nav" ),
			"list item is .ui-tabs-nav" );
	});
});

// #5893 - Sublist in the tab list are considered as tab
test( "nested list", function() {
	expect( 1 );

	var element = $( "#tabs6" ).tabs();
	equal( element.data( "tabs" ).anchors.length, 2, "should contain 2 tab" );
});

test( "disconnected from DOM", function() {
	expect( 2 );

	var element = $( "#tabs1" ).remove().tabs();
	equal( element.find( ".ui-tabs-nav" ).length, 1, "should initialize nav" );
	equal( element.find( ".ui-tabs-panel" ).length, 3, "should initialize panels" );
});

test( "aria-controls", function() {
	expect( 7 );
	var element = $( "#tabs1" ).tabs(),
		tabs = element.find( ".ui-tabs-nav li" );
	tabs.each(function() {
		var tab = $( this ),
			anchor = tab.find( ".ui-tabs-anchor" );
		equal( anchor.prop( "hash" ).substring( 1 ), tab.attr( "aria-controls" ) );
	});

	element = $( "#tabs2" ).tabs();
	tabs = element.find( ".ui-tabs-nav li" );
	equal( tabs.eq( 0 ).attr( "aria-controls" ), "colon:test" );
	equal( tabs.eq( 1 ).attr( "aria-controls" ), "inline-style" );
	ok( /^ui-tabs-\d+$/.test( tabs.eq( 2 ).attr( "aria-controls" ) ), "generated id" );
	equal( tabs.eq( 3 ).attr( "aria-controls" ), "custom-id" );
});

test( "accessibility", function() {
	expect( 49 );
	var element = $( "#tabs1" ).tabs({
			active: 1,
			disabled: [ 2 ]
		}),
		tabs = element.find( ".ui-tabs-nav li" ),
		anchors = tabs.find( ".ui-tabs-anchor" ),
		panels = element.find( ".ui-tabs-panel" );

	equal( element.find( ".ui-tabs-nav" ).attr( "role" ), "tablist", "tablist role" );
	tabs.each(function( index ) {
		var tab = tabs.eq( index ),
			anchor = anchors.eq( index ),
			anchorId = anchor.attr( "id" ),
			panel = panels.eq( index );
		equal( tab.attr( "role" ), "tab", "tab " + index + " role" );
		equal( tab.attr( "aria-labelledby" ), anchorId, "tab " + index + " aria-labelledby" );
		equal( anchor.attr( "role" ), "presentation", "anchor " + index + " role" );
		equal( anchor.attr( "tabindex" ), -1, "anchor " + index + " tabindex" );
		equal( panel.attr( "role" ), "tabpanel", "panel " + index + " role" );
		equal( panel.attr( "aria-labelledby" ), anchorId, "panel " + index + " aria-labelledby" );
	});

	equal( tabs.eq( 1 ).attr( "aria-selected" ), "true", "active tab has aria-selected=true" );
	equal( tabs.eq( 1 ).attr( "tabindex" ), 0, "active tab has tabindex=0" );
	equal( tabs.eq( 1 ).attr( "aria-disabled" ), null, "enabled tab does not have aria-disabled" );
	equal( panels.eq( 1 ).attr( "aria-expanded" ), "true", "active panel has aria-expanded=true" );
	equal( panels.eq( 1 ).attr( "aria-hidden" ), "false", "active panel has aria-hidden=false" );
	equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( tabs.eq( 0 ).attr( "tabindex" ), -1, "inactive tab has tabindex=-1" );
	equal( tabs.eq( 0 ).attr( "aria-disabled" ), null, "enabled tab does not have aria-disabled" );
	equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "inactive panel has aria-expanded=false" );
	equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "inactive panel has aria-hidden=true" );
	equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( tabs.eq( 2 ).attr( "tabindex" ), -1, "inactive tab has tabindex=-1" );
	equal( tabs.eq( 2 ).attr( "aria-disabled" ), "true", "disabled tab has aria-disabled=true" );
	equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "inactive panel has aria-expanded=false" );
	equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "inactive panel has aria-hidden=true" );

	element.tabs( "option", "active", 0 );
	equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "active tab has aria-selected=true" );
	equal( tabs.eq( 0 ).attr( "tabindex" ), 0, "active tab has tabindex=0" );
	equal( tabs.eq( 0 ).attr( "aria-disabled" ), null, "enabled tab does not have aria-disabled" );
	equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "active panel has aria-expanded=true" );
	equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "active panel has aria-hidden=false" );
	equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( tabs.eq( 1 ).attr( "tabindex" ), -1, "inactive tab has tabindex=-1" );
	equal( tabs.eq( 1 ).attr( "aria-disabled" ), null, "enabled tab does not have aria-disabled" );
	equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "inactive panel has aria-expanded=false" );
	equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "inactive panel has aria-hidden=true" );
	equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( tabs.eq( 2 ).attr( "tabindex" ), -1, "inactive tab has tabindex=-1" );
	equal( tabs.eq( 2 ).attr( "aria-disabled" ), "true", "disabled tab has aria-disabled=true" );
	equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "inactive panel has aria-expanded=false" );
	equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "inactive panel has aria-hidden=true" );

	// TODO: aria-live and aria-busy tests for ajax tabs
});

asyncTest( "keyboard support - LEFT, RIGHT, UP, DOWN, HOME, END, SPACE, ENTER", function() {
	expect( 92 );
	var element = $( "#tabs1" ).tabs({
			collapsible: true
		}),
		tabs = element.find( ".ui-tabs-nav li" ),
		panels = element.find( ".ui-tabs-panel" ),
		keyCode = $.ui.keyCode;

	element.data( "tabs" ).delay = 50;

	equal( tabs.filter( ".ui-state-focus" ).length, 0, "no tabs focused on init" );
	tabs.eq( 0 ).simulate( "focus" );

	// down, right, down (wrap), up (wrap)
	function step1() {
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "first tab has focus" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.DOWN } );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "DOWN moves focus to next tab" );
		ok( !tabs.eq( 0 ).is( ".ui-state-focus" ), "first tab is no longer focused" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "true", "second tab has aria-selected=true" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "first tab has aria-selected=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is still hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		tabs.eq( 1 ).simulate( "keydown", { keyCode: keyCode.RIGHT } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "RIGHT moves focus to next tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "second tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.DOWN } );
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "DOWN wraps focus to first tab" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.UP } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "UP wraps focus to last tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "first tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step2, 100 );
	}

	// left, home, space
	function step2() {
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "first tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.LEFT } );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "LEFT moves focus to previous tab" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "true", "second tab has aria-selected=true" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is still hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is still visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );

		tabs.eq( 1 ).simulate( "keydown", { keyCode: keyCode.HOME } );
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "HOME moves focus to first tab" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "second tab has aria-selected=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is still hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is still visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );

		// SPACE activates, cancels delay
		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.SPACE } );
		setTimeout( step3, 1 );
	}

	// end, enter
	function step3() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.END } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "END moves focus to last tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "first tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		// ENTER activates, cancels delay
		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.ENTER } );
		setTimeout( step4, 1 );
	}

	// enter (collapse)
	function step4() {
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );

		// ENTER collapses if active
		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.ENTER } );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		// support: Firefox 12
		// Firefox <13 passes arguments so we can't use setTimeout( start, 1 )
		setTimeout(function() {
			start();
		}, 1 );
	}

	setTimeout( step1, 1 );
});

asyncTest( "keyboard support - CTRL navigation", function() {
	expect( 115 );
	var element = $( "#tabs1" ).tabs(),
		tabs = element.find( ".ui-tabs-nav li" ),
		panels = element.find( ".ui-tabs-panel" ),
		keyCode = $.ui.keyCode;

	element.data( "tabs" ).delay = 50;

	equal( tabs.filter( ".ui-state-focus" ).length, 0, "no tabs focused on init" );
	tabs.eq( 0 ).simulate( "focus" );

	// down
	function step1() {
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "first tab has focus" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.DOWN, ctrlKey: true } );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "DOWN moves focus to next tab" );
		ok( !tabs.eq( 0 ).is( ".ui-state-focus" ), "first tab is no longer focused" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "second tab has aria-selected=false" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is still hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step2, 100 );
	}

	// right
	function step2() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );

		tabs.eq( 1 ).simulate( "keydown", { keyCode: keyCode.RIGHT, ctrlKey: true } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "RIGHT moves focus to next tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step3, 100 );
	}

	// down (wrap)
	function step3() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.DOWN, ctrlKey: true } );
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "DOWN wraps focus to first tab" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step4, 100 );
	}

	// up (wrap)
	function step4() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.UP, ctrlKey: true } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "UP wraps focus to last tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step5, 100 );
	}

	// left
	function step5() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.LEFT, ctrlKey: true } );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "LEFT moves focus to previous tab" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "second tab has aria-selected=false" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is still hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step6, 100 );
	}

	// home
	function step6() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );

		tabs.eq( 1 ).simulate( "keydown", { keyCode: keyCode.HOME, ctrlKey: true } );
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "HOME moves focus to first tab" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "false", "second tab has aria-selected=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is still hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step7, 100 );
	}

	// end
	function step7() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		tabs.eq( 0 ).simulate( "keydown", { keyCode: keyCode.END, ctrlKey: true } );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "END moves focus to last tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "false", "third tab has aria-selected=false" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is still hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is still visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );

		setTimeout( step8, 100 );
	}

	// space
	function step8() {
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.SPACE } );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "false", "first tab has aria-selected=false" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );

		// support: Firefox 12
		// Firefox <13 passes arguments so we can't use setTimeout( start, 1 )
		setTimeout(function() {
			start();
		}, 1 );
	}

	setTimeout( step1, 1 );
});

asyncTest( "keyboard support - CTRL+UP, ALT+PAGE_DOWN, ALT+PAGE_UP", function() {
	expect( 50 );
	var element = $( "#tabs1" ).tabs(),
		tabs = element.find( ".ui-tabs-nav li" ),
		panels = element.find( ".ui-tabs-panel" ),
		keyCode = $.ui.keyCode;

	equal( tabs.filter( ".ui-state-focus" ).length, 0, "no tabs focused on init" );
	panels.attr( "tabindex", -1 );
	panels.eq( 0 ).simulate( "focus" );

	function step1() {
		strictEqual( document.activeElement, panels[ 0 ], "first panel is activeElement" );

		panels.eq( 0 ).simulate( "keydown", { keyCode: keyCode.PAGE_DOWN, altKey: true } );
		strictEqual( document.activeElement, tabs[ 1 ], "second tab is activeElement" );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "ALT+PAGE_DOWN moves focus to next tab" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "true", "second tab has aria-selected=true" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel is visible" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "true", "second panel has aria-expanded=true" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "false", "second panel has aria-hidden=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );

		tabs.eq( 1 ).simulate( "keydown", { keyCode: keyCode.PAGE_DOWN, altKey: true } );
		strictEqual( document.activeElement, tabs[ 2 ], "third tab is activeElement" );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "ALT+PAGE_DOWN moves focus to next tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );
		ok( panels.eq( 1 ).is( ":hidden" ), "second panel is hidden" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "false", "second panel has aria-expanded=false" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "true", "second panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.PAGE_DOWN, altKey: true } );
		strictEqual( document.activeElement, tabs[ 0 ], "first tab is activeElement" );
		ok( tabs.eq( 0 ).is( ".ui-state-focus" ), "ALT+PAGE_DOWN wraps focus to first tab" );
		equal( tabs.eq( 0 ).attr( "aria-selected" ), "true", "first tab has aria-selected=true" );
		ok( panels.eq( 0 ).is( ":visible" ), "first panel is visible" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "true", "first panel has aria-expanded=true" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "false", "first panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		panels.eq( 0 ).simulate( "focus" );
		setTimeout( step2, 1 );
	}

	function step2() {
		strictEqual( document.activeElement, panels[ 0 ], "first panel is activeElement" );

		panels.eq( 0 ).simulate( "keydown", { keyCode: keyCode.PAGE_UP, altKey: true } );
		strictEqual( document.activeElement, tabs[ 2 ], "third tab is activeElement" );
		ok( tabs.eq( 2 ).is( ".ui-state-focus" ), "ALT+PAGE_UP wraps focus to last tab" );
		equal( tabs.eq( 2 ).attr( "aria-selected" ), "true", "third tab has aria-selected=true" );
		ok( panels.eq( 2 ).is( ":visible" ), "third panel is visible" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "true", "third panel has aria-expanded=true" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "false", "third panel has aria-hidden=false" );
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel is hidden" );
		equal( panels.eq( 0 ).attr( "aria-expanded" ), "false", "first panel has aria-expanded=false" );
		equal( panels.eq( 0 ).attr( "aria-hidden" ), "true", "first panel has aria-hidden=true" );

		tabs.eq( 2 ).simulate( "keydown", { keyCode: keyCode.PAGE_UP, altKey: true } );
		strictEqual( document.activeElement, tabs[ 1 ], "second tab is activeElement" );
		ok( tabs.eq( 1 ).is( ".ui-state-focus" ), "ALT+PAGE_UP moves focus to previous tab" );
		equal( tabs.eq( 1 ).attr( "aria-selected" ), "true", "second tab has aria-selected=true" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel is visible" );
		equal( panels.eq( 1 ).attr( "aria-expanded" ), "true", "second panel has aria-expanded=true" );
		equal( panels.eq( 1 ).attr( "aria-hidden" ), "false", "second panel has aria-hidden=false" );
		ok( panels.eq( 2 ).is( ":hidden" ), "third panel is hidden" );
		equal( panels.eq( 2 ).attr( "aria-expanded" ), "false", "third panel has aria-expanded=false" );
		equal( panels.eq( 2 ).attr( "aria-hidden" ), "true", "third panel has aria-hidden=true" );

		panels.eq( 1 ).simulate( "focus" );
		setTimeout( step3, 1 );
	}

	function step3() {
		strictEqual( document.activeElement, panels[ 1 ], "second panel is activeElement" );

		panels.eq( 1 ).simulate( "keydown", { keyCode: keyCode.UP, ctrlKey: true } );
		strictEqual( document.activeElement, tabs[ 1 ], "second tab is activeElement" );

		// support: Firefox 12
		// Firefox <13 passes arguments so we can't use setTimeout( start, 1 )
		setTimeout(function() {
			start();
		}, 1 );
	}

	setTimeout( step1, 1 );
});

test( "#3627 - Ajax tab with url containing a fragment identifier fails to load", function() {
	expect( 1 );

	var element = $( "#tabs2" ).tabs({
		active: 2,
		beforeLoad: function( event, ui ) {
			event.preventDefault();
			ok( /test.html$/.test( ui.ajaxSettings.url ), "should ignore fragment identifier" );
		}
	});
});

test( "#4033 - IE expands hash to full url and misinterprets tab as ajax", function() {
	expect( 2 );

	var element = $( "<div><ul><li><a href='#tab'>Tab</a></li></ul><div id='tab'></div></div>" );
	element.appendTo( "#main" );
	element.tabs({
		beforeLoad: function( event, ui ) {
			event.preventDefault();
			ok( false, "should not be an ajax tab" );
		}
	});

	equal( element.find( ".ui-tabs-nav li" ).attr( "aria-controls" ), "tab", "aria-contorls attribute is correct" );
	state( element, 1 );
});

}( jQuery ) );
