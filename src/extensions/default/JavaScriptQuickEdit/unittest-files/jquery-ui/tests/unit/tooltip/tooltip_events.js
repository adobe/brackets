(function( $ ) {

module( "tooltip: events" );

test( "programmatic triggers", function() {
	expect( 4 );
	var tooltip,
		element = $( "#tooltipped1" ).tooltip();

	element.one( "tooltipopen", function( event, ui ) {
		tooltip = ui.tooltip;
		ok( !( "originalEvent" in event ), "open" );
		strictEqual( ui.tooltip[0],
			$( "#" + element.data( "ui-tooltip-id" ) )[0], "ui.tooltip" );
	});
	element.tooltip( "open" );

	element.one( "tooltipclose", function( event, ui ) {
		ok( !( "originalEvent" in event ), "close" );
		strictEqual( ui.tooltip[0], tooltip[0], "ui.tooltip" );
	});
	element.tooltip( "close" );
});

test( "mouse events", function() {
	expect( 2 );
	var element = $( "#tooltipped1" ).tooltip();

	element.one( "tooltipopen", function( event ) {
		deepEqual( event.originalEvent.type, "mouseover" );
	});
	element.trigger( "mouseover" );

	element.one( "tooltipclose", function( event ) {
		deepEqual( event.originalEvent.type, "mouseleave" );
	});
	element.trigger( "mouseleave" );
});

test( "focus events", function() {
	expect( 2 );
	var element = $( "#tooltipped1" ).tooltip();

	element.one( "tooltipopen", function( event ) {
		deepEqual( event.originalEvent.type, "focusin" );
	});
	element.trigger( "focusin" );

	element.one( "tooltipclose", function( event ) {
		deepEqual( event.originalEvent.type, "focusout" );
	});
	element.trigger( "focusout" );
});

asyncTest( "mixed events", function() {
	expect( 2 );
	var element = $( "#tooltipped1" ).tooltip();

	element.one( "tooltipopen", function( event ) {
		deepEqual( event.originalEvent.type, "focusin" );
	});
	element.simulate( "focus" );

	element.one( "tooltipopen", function() {
		ok( false, "open triggered while already open" );
	});
	element.trigger( "mouseover" );

	element.bind( "tooltipclose", function( event ) {
		ok( false, "close triggered while still focused" );
	});
	element.trigger( "mouseleave" );
	element.unbind( "tooltipclose" );

	// blurring is async in IE
	element.one( "tooltipclose", function( event ) {
		deepEqual( event.originalEvent.type, "focusout" );
		start();
	});
	element.simulate( "blur" );
});

}( jQuery ) );
