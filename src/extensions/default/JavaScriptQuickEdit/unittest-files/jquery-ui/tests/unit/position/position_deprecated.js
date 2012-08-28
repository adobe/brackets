(function( $ ) {

test( "offset", function() {
	$( "#elx" ).position({
		my: "left top",
		at: "left bottom",
		of: "#parentx",
		offset: "10",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 70, left: 50 }, "single value" );

	$( "#elx" ).position({
		my: "left top",
		at: "left bottom",
		of: "#parentx",
		offset: "5 -3",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 57, left: 45 }, "two values" );

	$( "#elx" ).position({
		my: "left top",
		at: "left bottom",
		of: "#parentx",
		offset: "5px -3px",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 57, left: 45 }, "with units" );
});

}( jQuery ) );
