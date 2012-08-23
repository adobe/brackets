(function( $ ) {

var disabled = TestHelpers.tabs.disabled,
	equalHeight = TestHelpers.tabs.equalHeight,
	state = TestHelpers.tabs.state;

module( "tabs: options" );

test( "{ active: default }", function() {
	expect( 4 );

	var element = $( "#tabs1" ).tabs();
	equal( element.tabs( "option", "active" ), 0, "should be 0 by default" );
	state( element, 1, 0, 0 );
	element.tabs( "destroy" );

	location.hash = "#fragment-3";
	element = $( "#tabs1" ).tabs();
	equal( element.tabs( "option", "active" ), 2, "should be 2 based on URL" );
	state( element, 0, 0, 1 );
	element.tabs( "destroy" );
	location.hash = "#";
});

test( "{ active: false }", function() {
	expect( 7 );

	var element = $( "#tabs1" ).tabs({
		active: false,
		collapsible: true
	});
	state( element, 0, 0, 0 );
	equal( element.find( ".ui-tabs-nav .ui-state-active" ).length, 0, "no tabs selected" );
	strictEqual( element.tabs( "option", "active" ), false );

	element.tabs( "option", "collapsible", false );
	state( element, 1, 0, 0 );
	equal( element.tabs( "option", "active" ), 0 );

	element.tabs( "destroy" );
	element.tabs({
		active: false
	});
	state( element, 1, 0, 0 );
	strictEqual( element.tabs( "option", "active" ), 0 );
});

test( "{ active: Number }", function() {
	expect( 8 );

	var element = $( "#tabs1" ).tabs({
		active: 2
	});
	equal( element.tabs( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.tabs( "option", "active", 0 );
	equal( element.tabs( "option", "active" ), 0 );
	state( element, 1, 0, 0 );

	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 1 ).click();
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.tabs( "option", "active", 10 );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

if ( $.uiBackCompat === false ) {
	test( "{ active: -Number }", function() {
		var element = $( "#tabs1" ).tabs({
			active: -1
		});
		equal( element.tabs( "option", "active" ), 2 );
		state( element, 0, 0, 1 );

		element.tabs( "option", "active", -2 );
		equal( element.tabs( "option", "active" ), 1 );
		state( element, 0, 1, 0 );

		element.tabs( "option", "active", -10 );
		equal( element.tabs( "option", "active" ), 1 );
		state( element, 0, 1, 0 );

		element.tabs( "option", "active", -3 );
		equal( element.tabs( "option", "active" ), 0 );
		state( element, 1, 0, 0 );
	});
}

test( "active - mismatched tab/panel order", function() {
	expect( 3 );

	location.hash = "#tabs7-2";
	var element = $( "#tabs7" ).tabs();
	equal( element.tabs( "option", "active" ), 1, "should be 1 based on URL" );
	state( element, 0, 1 );
	element.tabs( "option", "active", 0 );
	state( element, 1, 0 );
	location.hash = "#";
});

test( "{ collapsible: false }", function() {
	expect( 4 );

	var element = $( "#tabs1" ).tabs({
		active: 1
	});
	element.tabs( "option", "active", false );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-state-active .ui-tabs-anchor" ).eq( 1 ).click();
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ collapsible: true }", function() {
	expect( 6 );

	var element = $( "#tabs1" ).tabs({
		active: 1,
		collapsible: true
	});

	element.tabs( "option", "active", false );
	equal( element.tabs( "option", "active" ), false );
	state( element, 0, 0, 0 );

	element.tabs( "option", "active", 1 );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-state-active .ui-tabs-anchor" ).click();
	equal( element.tabs( "option", "active" ), false );
	state( element, 0, 0, 0 );
});

test( "disabled", function() {
	expect( 10 );

	// fully enabled by default
	var element = $( "#tabs1" ).tabs();
	disabled( element, false );

	// disable single tab
	element.tabs( "option", "disabled", [ 1 ] );
	disabled( element, [ 1 ] );

	// disabled active tab
	element.tabs( "option", "disabled", [ 0, 1 ] );
	disabled( element, [ 0, 1 ] );

	// disable all tabs
	element.tabs( "option", "disabled", [ 0, 1, 2 ] );
	disabled( element, true );

	// enable all tabs
	element.tabs( "option", "disabled", [] );
	disabled( element, false );
});

test( "{ event: null }", function() {
	expect( 5 );

	var element = $( "#tabs1" ).tabs({
		event: null
	});
	state( element, 1, 0, 0 );

	element.tabs( "option", "active", 1 );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	// ensure default click handler isn't bound
	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 2 ).click();
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ event: custom }", function() {
	expect( 11 );

	var element = $( "#tabs1" ).tabs({
		event: "custom1 custom2"
	});
	state( element, 1, 0, 0 );

	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 1 ).trigger( "custom1" );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	// ensure default click handler isn't bound
	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 2 ).trigger( "click" );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 2 ).trigger( "custom2" );
	equal( element.tabs( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.tabs( "option", "event", "custom3" );

	// ensure old event handlers are unbound
	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 1 ).trigger( "custom1" );
	equal( element.tabs( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 1 ).trigger( "custom3" );
	equal( element.tabs( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ heightStyle: 'auto' }", function() {
	expect( 2 );
	var element = $( "#tabs8" ).tabs({ heightStyle: "auto" });
	equalHeight( element, 45 );
});

test( "{ heightStyle: 'content' }", function() {
	expect( 2 );
	var element = $( "#tabs8" ).tabs({ heightStyle: "content" }),
		sizes = element.find( ".ui-tabs-panel" ).map(function() {
			return $( this ).height();
		}).get();
	equal( sizes[ 0 ], 45 );
	equal( sizes[ 1 ], 15 );
});

test( "{ heightStyle: 'fill' }", function() {
	expect( 2 );
	$( "#tabs8Wrapper" ).height( 500 );
	var element = $( "#tabs8" ).tabs({ heightStyle: "fill" });
	equalHeight( element, 485 );
});

test( "{ heightStyle: 'fill' } with sibling", function() {
	expect( 2 );
	$( "#tabs8Wrapper" ).height( 500 );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30
		})
		.prependTo( "#tabs8Wrapper" );
	var element = $( "#tabs8" ).tabs({ heightStyle: "fill" });
	equalHeight( element, 385 );
});

test( "{ heightStyle: 'fill' } with multiple siblings", function() {
	expect( 2 );
	$( "#tabs8Wrapper" ).height( 500 );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30
		})
		.prependTo( "#tabs8Wrapper" );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30,
			position: "absolute"
		})
		.prependTo( "#tabs8Wrapper" );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 25,
			marginTop: 10,
			marginBottom: 15
		})
		.prependTo( "#tabs8Wrapper" );
	var element = $( "#tabs8" ).tabs({ heightStyle: "fill" });
	equalHeight( element, 335 );
});

// TODO: add animation tests

}( jQuery ) );
