(function( $ ) {

module( "tooltip: options" );

test( "content: default", function() {
	var element = $( "#tooltipped1" ).tooltip().tooltip( "open" );
	deepEqual( $( "#" + element.data( "ui-tooltip-id" ) ).text(), "anchortitle" );
});

test( "content: return string", function() {
	var element = $( "#tooltipped1" ).tooltip({
		content: function() {
			return "customstring";
		}
	}).tooltip( "open" );
	deepEqual( $( "#" + element.data( "ui-tooltip-id" ) ).text(), "customstring" );
});

test( "content: return jQuery", function() {
	var element = $( "#tooltipped1" ).tooltip({
		content: function() {
			return $( "<div>" ).html( "cu<b>s</b>tomstring" );
		}
	}).tooltip( "open" );
	deepEqual( $( "#" + element.data( "ui-tooltip-id" ) ).text(), "customstring" );
});

asyncTest( "content: sync + async callback", function() {
	expect( 2 );
	var element = $( "#tooltipped1" ).tooltip({
		content: function( response ) {
			setTimeout(function() {
				deepEqual( $( "#" + element.data("ui-tooltip-id") ).text(), "loading..." );

				response( "customstring2" );
				setTimeout(function() {
					deepEqual( $( "#" + element.data("ui-tooltip-id") ).text(), "customstring2" );
					start();
				}, 13 );
			}, 13 );
			return "loading...";
		}
	}).tooltip( "open" );
});

test( "items", function() {
	expect( 2 );
	var event,
		element = $( "#qunit-fixture" ).tooltip({
			items: "#fixture-span"
		});

	event = $.Event( "mouseenter" );
	event.target = $( "#fixture-span" )[ 0 ];
	element.tooltip( "open", event );
	deepEqual( $( "#" + $( "#fixture-span" ).data( "ui-tooltip-id" ) ).text(), "title-text" );

	// make sure default [title] doesn't get used
	event.target = $( "#tooltipped1" )[ 0 ];
	element.tooltip( "open", event );
	deepEqual( $( "#tooltipped1" ).data( "ui-tooltip-id" ), undefined );

	element.tooltip( "destroy" );
});

test( "tooltipClass", function() {
	expect( 1 );
	var element = $( "#tooltipped1" ).tooltip({
		tooltipClass: "custom"
	}).tooltip( "open" );
	ok( $( "#" + element.data( "ui-tooltip-id" ) ).hasClass( "custom" ) );
});

}( jQuery ) );
