module( "progressbar: events" );

test( "create", function() {
	expect( 1 );
	$( "#progressbar" ).progressbar({
		value: 5,
		create: function() {
			deepEqual( 5, $( this ).progressbar( "value" ) );
		},
		change: function() {
			ok( false, "create() has triggered change()" );
		}
	});
});

test( "change", function() {
	expect( 1 );
	$( "#progressbar" ).progressbar({
		change: function() {
			deepEqual( 5, $( this ).progressbar( "value" ) );
		}
	}).progressbar( "value", 5 );
});

test( "complete", function() {
	expect( 3 );
	var value,
		changes = 0,
		element = $( "#progressbar" ).progressbar({
			change: function() {
				changes++;
				deepEqual( element.progressbar( "value" ), value, "change at " + value );
			},
			complete: function() {
				equal( changes, 2, "complete triggered after change" );
			}
		});

	value = 5;
	element.progressbar( "value", value );
	value = 100;
	element.progressbar( "value", value );
});
