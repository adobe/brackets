(function( $ ) {
module( "effect.scale: Scale" );

function run( position, v, h, vo, ho ) {
	var desc = "End Position Correct: " + position + " (" + v + "," + h + ") - origin: (" + vo + "," + ho + ")";
	asyncTest( desc, function() {
		function complete() {
			equal( parseInt( test.css( h ), 10 ), target[ h ], "Horizontal Position Correct " + desc );
			equal( parseInt( test.css( v ), 10 ), target[ v ], "Vertical Position Correct " + desc );
			start();
		}
		var test = $( ".testScale" ),
			css = {
				position: position
			},
			effect = {
				effect: "scale",
				mode: "effect",
				percent: 200,
				origin: [ vo, ho ],
				complete: complete,
				duration: 1
			},
			target = {},
			relative = position === "relative";

		css[ h ] = 33;
		css[ v ] = 33;
		target[ h ] = h === ho ? css[ h ] : ho === "center" ? css[ h ] - 35 : css[ h ] - 70;
		target[ v ] = v === vo ? css[ v ] : vo === "middle" ? css[ v ] - 35 : css[ v ] - 70;
		if ( relative && h === "right" ) {
			target[ h ] += 70;
		}
		if ( relative && v === "bottom" ) {
			target[ v ] += 70;
		}
		test.css( css );
		test.effect( effect );
	});
}

function suite( position ) {
	run( position, "top", "left", "top", "left" );
	run( position, "top", "left", "middle", "center" );
	run( position, "top", "left", "bottom", "right" );
	/* Firefox is currently not capable of supporting detection of bottom and right....
	run( position, "bottom", "right", "top", "left" );
	run( position, "bottom", "right", "middle", "center" );
	run( position, "bottom", "right", "bottom", "right" );
	*/
}

$(function() {
	suite( "absolute" );
	suite( "relative" );
	var fixed = $.support.fixedPosition;
	// jQuery < 1.7 uses $.offset.supportsFixedPosition
	if ( fixed === undefined ) {
		$.offset.initialize();
		fixed = $.offset.supportsFixedPosition;
	}
	if ( fixed ) {
		suite( "fixed" );
	}
});

})( jQuery );
