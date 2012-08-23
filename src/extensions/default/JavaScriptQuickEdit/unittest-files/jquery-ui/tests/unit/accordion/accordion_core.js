(function( $ ) {

var setupTeardown = TestHelpers.accordion.setupTeardown,
	state = TestHelpers.accordion.state;

module( "accordion: core", setupTeardown() );

$.each( { div: "#list1", ul: "#navigation", dl: "#accordion-dl" }, function( type, selector ) {
	test( "markup structure: " + type, function() {
		expect( 4 );
		var element = $( selector ).accordion();
		ok( element.hasClass( "ui-accordion" ), "main element is .ui-accordion" );
		equal( element.find( ".ui-accordion-header" ).length, 3,
			".ui-accordion-header elements exist, correct number" );
		equal( element.find( ".ui-accordion-content" ).length, 3,
			".ui-accordion-content elements exist, correct number" );
		deepEqual( element.find( ".ui-accordion-header" ).next().get(),
			element.find( ".ui-accordion-content" ).get(),
			"content panels come immediately after headers" );
	});
});

test( "handle click on header-descendant", function() {
	expect( 1 );
	var element = $( "#navigation" ).accordion();
	$( "#navigation h2:eq(1) a" ).click();
	state( element, 0, 1, 0 );
});

test( "accessibility", function () {
	expect( 37 );
	var element = $( "#list1" ).accordion({
			active: 1
		}),
		headers = element.find( ".ui-accordion-header" );

	equal( element.attr( "role" ), "tablist", "element role" );
	headers.each(function( i ) {
		var header = headers.eq( i ),
			panel = header.next();
		equal( header.attr( "role" ), "tab", "header " + i + " role" );
		equal( header.attr( "aria-controls" ), panel.attr( "id" ), "header " + i + " aria-controls" );
		equal( panel.attr( "role" ), "tabpanel", "panel " + i + " role" );
		equal( panel.attr( "aria-labelledby" ), header.attr( "id" ), "panel " + i + " aria-labelledby" );
	});

	equal( headers.eq( 1 ).attr( "tabindex" ), 0, "active header has tabindex=0" );
	equal( headers.eq( 1 ).attr( "aria-selected" ), "true", "active tab has aria-selected=true" );
	equal( headers.eq( 1 ).next().attr( "aria-expanded" ), "true", "active tabpanel has aria-expanded=true" );
	equal( headers.eq( 1 ).next().attr( "aria-hidden" ), "false", "active tabpanel has aria-hidden=false" );
	equal( headers.eq( 0 ).attr( "tabindex" ), -1, "inactive header has tabindex=-1" );
	equal( headers.eq( 0 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( headers.eq( 0 ).next().attr( "aria-expanded" ), "false", "inactive tabpanel has aria-expanded=false" );
	equal( headers.eq( 0 ).next().attr( "aria-hidden" ), "true", "inactive tabpanel has aria-hidden=true" );
	equal( headers.eq( 2 ).attr( "tabindex" ), -1, "inactive header has tabindex=-1" );
	equal( headers.eq( 2 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( headers.eq( 2 ).next().attr( "aria-expanded" ), "false", "inactive tabpanel has aria-expanded=false" );
	equal( headers.eq( 2 ).next().attr( "aria-hidden" ), "true", "inactive tabpanel has aria-hidden=true" );

	element.accordion( "option", "active", 0 );
	equal( headers.eq( 0 ).attr( "tabindex" ), 0, "active header has tabindex=0" );
	equal( headers.eq( 0 ).attr( "aria-selected" ), "true", "active tab has aria-selected=true" );
	equal( headers.eq( 0 ).next().attr( "aria-expanded" ), "true", "active tabpanel has aria-expanded=true" );
	equal( headers.eq( 0 ).next().attr( "aria-hidden" ), "false", "active tabpanel has aria-hidden=false" );
	equal( headers.eq( 1 ).attr( "tabindex" ), -1, "inactive header has tabindex=-1" );
	equal( headers.eq( 1 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( headers.eq( 1 ).next().attr( "aria-expanded" ), "false", "inactive tabpanel has aria-expanded=false" );
	equal( headers.eq( 1 ).next().attr( "aria-hidden" ), "true", "inactive tabpanel has aria-hidden=true" );
	equal( headers.eq( 2 ).attr( "tabindex" ), -1, "inactive header has tabindex=-1" );
	equal( headers.eq( 2 ).attr( "aria-selected" ), "false", "inactive tab has aria-selected=false" );
	equal( headers.eq( 2 ).next().attr( "aria-expanded" ), "false", "inactive tabpanel has aria-expanded=false" );
	equal( headers.eq( 2 ).next().attr( "aria-hidden" ), "true", "inactive tabpanel has aria-hidden=true" );
});

asyncTest( "keyboard support", function() {
	expect( 13 );
	var element = $( "#list1" ).accordion(),
		headers = element.find( ".ui-accordion-header" ),
		anchor = headers.eq( 1 ).next().find( "a" ).eq( 0 ),
		keyCode = $.ui.keyCode;
	equal( headers.filter( ".ui-state-focus" ).length, 0, "no headers focused on init" );
	headers.eq( 0 ).simulate( "focus" );
	setTimeout(function() {
		ok( headers.eq( 0 ).is( ".ui-state-focus" ), "first header has focus" );
		headers.eq( 0 ).simulate( "keydown", { keyCode: keyCode.DOWN } );
		ok( headers.eq( 1 ).is( ".ui-state-focus" ), "DOWN moves focus to next header" );
		headers.eq( 1 ).simulate( "keydown", { keyCode: keyCode.RIGHT } );
		ok( headers.eq( 2 ).is( ".ui-state-focus" ), "RIGHT moves focus to next header" );
		headers.eq( 2 ).simulate( "keydown", { keyCode: keyCode.DOWN } );
		ok( headers.eq( 0 ).is( ".ui-state-focus" ), "DOWN wraps focus to first header" );

		headers.eq( 0 ).simulate( "keydown", { keyCode: keyCode.UP } );
		ok( headers.eq( 2 ).is( ".ui-state-focus" ), "UP wraps focus to last header" );
		headers.eq( 2 ).simulate( "keydown", { keyCode: keyCode.LEFT } );
		ok( headers.eq( 1 ).is( ".ui-state-focus" ), "LEFT moves focus to previous header" );

		headers.eq( 1 ).simulate( "keydown", { keyCode: keyCode.HOME } );
		ok( headers.eq( 0 ).is( ".ui-state-focus" ), "HOME moves focus to first header" );
		headers.eq( 0 ).simulate( "keydown", { keyCode: keyCode.END } );
		ok( headers.eq( 2 ).is( ".ui-state-focus" ), "END moves focus to last header" );

		headers.eq( 2 ).simulate( "keydown", { keyCode: keyCode.ENTER } );
		equal( element.accordion( "option", "active" ) , 2, "ENTER activates panel" );
		headers.eq( 1 ).simulate( "keydown", { keyCode: keyCode.SPACE } );
		equal( element.accordion( "option", "active" ), 1, "SPACE activates panel" );

		anchor.simulate( "focus" );
		setTimeout(function() {
			ok( !headers.eq( 1 ).is( ".ui-state-focus" ), "header loses focus when focusing inside the panel" );
			anchor.simulate( "keydown", { keyCode: keyCode.UP, ctrlKey: true } );
			ok( headers.eq( 1 ).is( ".ui-state-focus" ), "CTRL+UP moves focus to header" );
			start();
		}, 1 );
	}, 1 );
});

}( jQuery ) );
