(function( $ ) {

module( "tooltip: methods" );

test( "destroy", function() {
	expect( 2 );
	domEqual( "#tooltipped1", function() {
		$( "#tooltipped1" ).tooltip().tooltip( "destroy" );
	});

	// make sure that open tooltips are removed on destroy
	$( "#tooltipped1" ).tooltip().tooltip( "open" ).tooltip( "destroy" );
	equal( $( ".ui-tooltip" ).length, 0 );
});

test( "open/close", function() {
	expect( 3 );
	$.fx.off = true;
	var tooltip,
		element = $( "#tooltipped1" ).tooltip();
	equal( $( ".ui-tooltip" ).length, 0, "no tooltip on init" );

	element.tooltip( "open" );
	tooltip = $( "#" + element.data( "ui-tooltip-id" ) );
	ok( tooltip.is( ":visible" ) );

	element.tooltip( "close" );
	ok( tooltip.is( ":hidden" ) );
	$.fx.off = false;
});

test( "enable/disable", function() {
	expect( 7 );
	$.fx.off = true;
	var tooltip,
		element = $( "#tooltipped1" ).tooltip();
	equal( $( ".ui-tooltip" ).length, 0, "no tooltip on init" );

	element.tooltip( "open" );
	tooltip = $( "#" + element.data( "ui-tooltip-id" ) );
	ok( tooltip.is( ":visible" ) );

	element.tooltip( "disable" );
	equal( $( ".ui-tooltip" ).length, 0, "no tooltip when disabled" );
	equal( tooltip.attr( "title" ), undefined, "title removed on disable" );

	element.tooltip( "open" );
	equal( $( ".ui-tooltip" ).length, 0, "open does nothing when disabled" );

	element.tooltip( "enable" );
	equal( element.attr( "title" ), "anchortitle", "title restored on enable" );

	element.tooltip( "open" );
	tooltip = $( "#" + element.data( "ui-tooltip-id" ) );
	ok( tooltip.is( ":visible" ) );
	$.fx.off = false;
});

/*
TODO currently tooltip doesn't override widget
can't return anything useful if no element is kept around and there's no useful reference
test("widget", function() {
	var tooltip = $("#tooltipped1").tooltip();
	deepEqual(tooltip.tooltip("widget")[0], $(".ui-tooltip")[0]);
	deepEqual(tooltip.tooltip("widget").end()[0], tooltip[0]);
});
*/

}( jQuery ) );
