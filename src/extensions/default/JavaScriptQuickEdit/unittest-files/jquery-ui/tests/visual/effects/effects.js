$(function() {

var duration = 1000,
	wait = 500;

function effect( elem, name, options ) {
	$.extend( options, {
		easing: "easeOutQuint"
	});

	$( elem ).click(function() {
		$( this )
			.addClass( "current" )
			// delaying the initial animation makes sure that the queue stays in tact
			.delay( 10 )
			.hide( name, options, duration )
			.delay( wait )
			.show( name, options, duration, function() {
				$( this ).removeClass( "current" );
			});
	});
}

$( "#hide" ).click(function() {
	$( this )
		.addClass( "current" )
		.hide( duration )
		.delay( wait )
		.show( duration, function() {
			$( this ).removeClass( "current" );
		});
});

effect( "#blindLeft", "blind", { direction: "left" } );
effect( "#blindUp", "blind", { direction: "up" } );
effect( "#blindRight", "blind", { direction: "right" } );
effect( "#blindDown", "blind", { direction: "down" } );

effect( "#bounce3times", "bounce", { times: 3 } );

effect( "#clipHorizontally", "clip", { direction: "horizontal" } );
effect( "#clipVertically", "clip", { direction: "vertical" } );

effect( "#dropDown", "drop", { direction: "down" } );
effect( "#dropUp", "drop", { direction: "up" } );
effect( "#dropLeft", "drop", { direction: "left" } );
effect( "#dropRight", "drop", { direction: "right" } );

effect( "#explode9", "explode", {} );
effect( "#explode36", "explode", { pieces: 36 } );

effect( "#fade", "fade", {} );

effect( "#fold", "fold", { size: 50 } );

effect( "#highlight", "highlight", {} );

effect( "#pulsate", "pulsate", { times: 2 } );

effect( "#puff", "puff", { times: 2 } );
effect( "#scale", "scale", {} );
effect( "#size", "size", {} );
$( "#sizeToggle" ).click(function() {
	var options = { to: { width: 300, height: 300 } };
	$( this )
		.addClass( "current" )
		.toggle( "size", options, duration )
		.delay( wait )
		.toggle( "size", options, duration, function() {
			$( this ).removeClass( "current" );
		});
});

$( "#shake" ).click(function() {
	$( this )
		.addClass( "current" )
		.effect( "shake", {}, 100, function() {
			$( this ).removeClass( "current" );
		});
});

effect( "#slideDown", "slide", { direction: "down" } );
effect( "#slideUp", "slide", { direction: "up" } );
effect( "#slideLeft", "slide", { direction: "left" } );
effect( "#slideRight", "slide", { direction: "right" } );

$( "#transfer" ).click(function() {
	$( this )
		.addClass( "current" )
		.effect( "transfer", { to: "div:eq(0)" }, 1000, function() {
			$( this ).removeClass( "current" );
		});
});

$( "#addClass" ).click(function() {
	$( this ).addClass( "current", duration, function() {
		$( this ).removeClass( "current" );
	});
});
$( "#removeClass" ).click(function() {
	$( this ).addClass( "current" ).removeClass( "current", duration );
});
$( "#toggleClass" ).click(function() {
	$( this ).toggleClass( "current", duration );
});

});
