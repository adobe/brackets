module( "progressbar: options" );

test( "{ value : 0 }, default", function() {
	$( "#progressbar" ).progressbar();
	equal( 0, $( "#progressbar" ).progressbar( "value" ) );
});

// Ticket #7231 - valueDiv should be hidden when value is at 0%
test( "value: visibility of valueDiv", function() {
	expect( 5 );
	var element = $( "#progressbar" ).progressbar({
		value: 0
	});
	ok( element.children( ".ui-progressbar-value" ).is( ":hidden" ),
		"valueDiv hidden when value is initialized at 0" );
	element.progressbar( "value", 1 );
	ok( element.children( ".ui-progressbar-value" ).is( ":visible" ),
		"valueDiv visible when value is set to 1" );
	element.progressbar( "value", 100 );
	ok( element.children( ".ui-progressbar-value" ).is( ":visible" ),
		"valueDiv visible when value is set to 100" );
	element.progressbar( "value", 0 );
	ok( element.children( ".ui-progressbar-value" ).is( ":hidden" ),
		"valueDiv hidden when value is set to 0" );
	element.progressbar( "value", -1 );
	ok( element.children( ".ui-progressbar-value" ).is( ":hidden" ),
		"valueDiv hidden when value set to -1 (normalizes to 0)" );
});

test( "{ value : 5 }", function() {
	$( "#progressbar" ).progressbar({
		value: 5
	});
	equal( 5, $( "#progressbar" ).progressbar( "value" ) );
});

test( "{ value : -5 }", function() {
	$( "#progressbar" ).progressbar({
		value: -5
	});
	deepEqual( 0, $( "#progressbar" ).progressbar( "value" ) );
});

test( "{ value : 105 }", function() {
	$( "#progressbar" ).progressbar({
		value: 105
	});
	deepEqual( 100, $( "#progressbar" ).progressbar( "value" ) );
});

test( "{ max : 5, value : 10 }", function() {
	$("#progressbar").progressbar({
		max: 5,
		value: 10
	});
	deepEqual( 5, $( "#progressbar" ).progressbar( "value" ) );
});
