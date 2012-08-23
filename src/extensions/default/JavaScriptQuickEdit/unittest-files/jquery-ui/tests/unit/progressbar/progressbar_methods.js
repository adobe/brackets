module( "progressbar: methods" );

test( "destroy", function() {
	expect( 1 );
	domEqual( "#progressbar", function() {
		$( "#progressbar" ).progressbar().progressbar( "destroy" );
	});
});

test( "value", function() {
	expect( 3 );

	var element = $( "<div>" ).progressbar({ value: 20 });
	equal( element.progressbar( "value" ), 20, "correct value as getter" );
	equal( element.progressbar( "value", 30), element, "chainable as setter" );
	equal( element.progressbar( "option", "value" ), 30, "correct value after setter" );
});
