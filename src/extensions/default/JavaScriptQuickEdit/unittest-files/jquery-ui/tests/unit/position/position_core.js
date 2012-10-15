(function( $ ) {

var win = $( window ),
	scrollTopSupport = function() {
		var support = win.scrollTop( 1 ).scrollTop() === 1;
		win.scrollTop( 0 );
		scrollTopSupport = function() {
			return support;
		};
		return support;
	};

module( "position", {
	setup: function() {
		win.scrollTop( 0 ).scrollLeft( 0 );
	}
});

TestHelpers.testJshint( "ui.position" );

test( "my, at, of", function() {
	expect( 4 );

	$( "#elx" ).position({
		my: "left top",
		at: "left top",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 40, left: 40 }, "left top, left top" );

	$( "#elx" ).position({
		my: "left top",
		at: "left bottom",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 60, left: 40 }, "left top, left bottom" );

	$( "#elx" ).position({
		my: "left",
		at: "bottom",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 55, left: 50 }, "left, bottom" );

	$( "#elx" ).position({
		my: "left foo",
		at: "bar baz",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 45, left: 50 }, "left foo, bar baz" );
});

test( "multiple elements", function() {
	expect( 3 );

	var elements = $( "#el1, #el2" ),
		result = elements.position({
			my: "left top",
			at: "left bottom",
			of: "#parent",
			collision: "none"
		}),
		expected = { top: 10, left: 4 };

	deepEqual( result, elements );
	elements.each(function() {
		deepEqual( $( this ).offset(), expected );
	});
});

test( "positions", function() {
	expect( 18 );

	var offsets = {
			left: 0,
			center: 3,
			right: 6,
			top: 0,
			bottom: 6
		},
		start = { left: 4, top: 4 },
		el = $( "#el1" );

	$.each( [ 0, 1 ], function( my ) {
		$.each( [ "top", "center", "bottom" ], function( vindex, vertical ) {
			$.each( [ "left", "center", "right" ], function( hindex, horizontal ) {
				var _my = my ? horizontal + " " + vertical : "left top",
					_at = !my ? horizontal + " " + vertical : "left top";
				el.position({
					my: _my,
					at: _at,
					of: "#parent",
					collision: "none"
				});
				deepEqual( el.offset(), {
					top: start.top + offsets[ vertical ] * (my ? -1 : 1),
					left: start.left + offsets[ horizontal ] * (my ? -1 : 1)
				}, "Position via " + QUnit.jsDump.parse({ my: _my, at: _at }) );
			});
		});
	});
});

test( "of", function() {
	expect( 9 + (scrollTopSupport() ? 1 : 0) );

	var event;

	$( "#elx" ).position({
		my: "left top",
		at: "left top",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 40, left: 40 }, "selector" );

	$( "#elx" ).position({
		my: "left top",
		at: "left bottom",
		of: $( "#parentx"),
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 60, left: 40 }, "jQuery object" );

	$( "#elx" ).position({
		my: "left top",
		at: "left top",
		of: $( "#parentx" )[ 0 ],
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 40, left: 40 }, "DOM element" );

	$( "#elx" ).position({
		my: "right bottom",
		at: "right bottom",
		of: document,
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: $( document ).height() - 10,
		left: $( document ).width() - 10
	}, "document" );

	$( "#elx" ).position({
		my: "right bottom",
		at: "right bottom",
		of: $( document ),
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: $( document ).height() - 10,
		left: $( document ).width() - 10
	}, "document as jQuery object" );

	win.scrollTop( 0 );

	$( "#elx" ).position({
		my: "right bottom",
		at: "right bottom",
		of: window,
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: win.height() - 10,
		left: win.width() - 10
	}, "window" );

	$( "#elx" ).position({
		my: "right bottom",
		at: "right bottom",
		of: win,
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: win.height() - 10,
		left: win.width() - 10
	}, "window as jQuery object" );

	if ( scrollTopSupport() ) {
		win.scrollTop( 500 ).scrollLeft( 200 );
		$( "#elx" ).position({
			my: "right bottom",
			at: "right bottom",
			of: window,
			collision: "none"
		});
		deepEqual( $( "#elx" ).offset(), {
			top: win.height() + 500 - 10,
			left: win.width() + 200 - 10
		}, "window, scrolled" );
		win.scrollTop( 0 ).scrollLeft( 0 );
	}

	event = $.extend( $.Event( "someEvent" ), { pageX: 200, pageY: 300 } );
	$( "#elx" ).position({
		my: "left top",
		at: "left top",
		of: event,
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: 300,
		left: 200
	}, "event - left top, left top" );

	event = $.extend( $.Event( "someEvent" ), { pageX: 400, pageY: 600 } );
	$( "#elx" ).position({
		my: "left top",
		at: "right bottom",
		of: event,
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), {
		top: 600,
		left: 400
	}, "event - left top, right bottom" );
});

test( "offsets", function() {
	expect( 4 );

	$( "#elx" ).position({
		my: "left top",
		at: "left+10 bottom+10",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 70, left: 50 }, "offsets in at" );

	$( "#elx" ).position({
		my: "left+10 top-10",
		at: "left bottom",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 50, left: 50 }, "offsets in my" );

	$( "#elx" ).position({
		my: "left top",
		at: "left+50% bottom-10%",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 58, left: 50 }, "percentage offsets in at" );

	$( "#elx" ).position({
		my: "left-30% top+50%",
		at: "left bottom",
		of: "#parentx",
		collision: "none"
	});
	deepEqual( $( "#elx" ).offset(), { top: 65, left: 37 }, "percentage offsets in my" );
});

test( "using", function() {
	expect( 10 );

	var count = 0,
		elems = $( "#el1, #el2" ),
		of = $( "#parentx" ),
		expectedPosition = { top: 60, left: 60 },
		expectedFeedback = {
			target: {
				element: of,
				width: 20,
				height: 20,
				left: 40,
				top: 40
			},
			element: {
				width: 6,
				height: 6,
				left: 60,
				top: 60
			},
			horizontal: "left",
			vertical: "top",
			important: "vertical"
		},
		originalPosition = elems.position({
			my: "right bottom",
			at: "rigt bottom",
			of: "#parentx",
			collision: "none"
		}).offset();

	elems.position({
		my: "left top",
		at: "center+10 bottom",
		of: "#parentx",
		using: function( position, feedback ) {
			deepEqual( this, elems[ count ], "correct context for call #" + count );
			deepEqual( position, expectedPosition, "correct position for call #" + count );
			deepEqual( feedback.element.element[ 0 ], elems[ count ] );
			delete feedback.element.element;
			deepEqual( feedback, expectedFeedback );
			count++;
		}
	});

	elems.each(function() {
		deepEqual( $( this ).offset(), originalPosition, "elements not moved" );
	});
});

function collisionTest( config, result, msg ) {
	var elem = $( "#elx" ).position( $.extend({
		my: "left top",
		at: "right bottom",
		of: "#parent"
	}, config ) );
	deepEqual( elem.offset(), result, msg );
}

function collisionTest2( config, result, msg ) {
	collisionTest( $.extend({
		my: "right bottom",
		at: "left top"
	}, config ), result, msg );
}

test( "collision: fit, no collision", function() {
	expect( 2 );

	collisionTest({
		collision: "fit"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest({
		collision: "fit",
		at: "right+2 bottom+3"
	}, {
		top: 13,
		left: 12
	}, "with offset" );
});

test( "collision: fit, collision", function() {
	expect( 2 + (scrollTopSupport() ? 1 : 0) );

	collisionTest2({
		collision: "fit"
	}, {
		top: 0,
		left: 0
	}, "no offset" );

	collisionTest2({
		collision: "fit",
		at: "left+2 top+3"
	}, {
		top: 0,
		left: 0
	}, "with offset" );

	if ( scrollTopSupport() ) {
		win.scrollTop( 300 ).scrollLeft( 200 );
		collisionTest({
			collision: "fit"
		}, {
			top: 300,
			left: 200
		}, "window scrolled" );

		win.scrollTop( 0 ).scrollLeft( 0 );
	}
});

test( "collision: flip, no collision", function() {
	expect( 2 );

	collisionTest({
		collision: "flip"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest({
		collision: "flip",
		at: "right+2 bottom+3"
	}, {
		top: 13,
		left: 12
	}, "with offset" );
});

test( "collision: flip, collision", function() {
	expect( 2 );

	collisionTest2({
		collision: "flip"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest2({
		collision: "flip",
		at: "left+2 top+3"
	}, {
		top: 7,
		left: 8
	}, "with offset" );
});

test( "collision: flipfit, no collision", function() {
	expect( 2 );

	collisionTest({
		collision: "flipfit"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest({
		collision: "flipfit",
		at: "right+2 bottom+3"
	}, {
		top: 13,
		left: 12
	}, "with offset" );
});

test( "collision: flipfit, collision", function() {
	expect( 2 );

	collisionTest2({
		collision: "flipfit"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest2({
		collision: "flipfit",
		at: "left+2 top+3"
	}, {
		top: 7,
		left: 8
	}, "with offset" );
});

test( "collision: none, no collision", function() {
	expect( 2 );

	collisionTest({
		collision: "none"
	}, {
		top: 10,
		left: 10
	}, "no offset" );

	collisionTest({
		collision: "none",
		at: "right+2 bottom+3"
	}, {
		top: 13,
		left: 12
	}, "with offset" );
});

test( "collision: none, collision", function() {
	expect( 2 );

	collisionTest2({
		collision: "none"
	}, {
		top: -6,
		left: -6
	}, "no offset" );

	collisionTest2({
		collision: "none",
		at: "left+2 top+3"
	}, {
		top: -3,
		left: -4
	}, "with offset" );
});

test( "collision: fit, with margin", function() {
	expect( 2 );

	$( "#elx" ).css({
		marginTop: 6,
		marginLeft: 4
	});

	collisionTest({
		collision: "fit"
	}, {
		top: 10,
		left: 10
	}, "right bottom" );

	collisionTest2({
		collision: "fit"
	}, {
		top: 6,
		left: 4
	}, "left top" );
});

test( "collision: flip, with margin", function() {
	expect( 3 );

	$( "#elx" ).css({
		marginTop: 6,
		marginLeft: 4
	});

	collisionTest({
		collision: "flip"
	}, {
		top: 10,
		left: 10
	}, "left top" );

	collisionTest2({
		collision: "flip"
	}, {
		top: 10,
		left: 10
	}, "right bottom" );

	collisionTest2({
		collision: "flip",
		my: "left top"
	}, {
		top: 0,
		left: 4
	}, "right bottom" );
});

test( "within", function() {
	expect( 6 );

	collisionTest({
		within: "#within",
		collision: "fit"
	}, {
		top: 4,
		left: 2
	}, "fit - right bottom" );

	collisionTest2({
		within: "#within",
		collision: "fit"
	}, {
		top: 2,
		left: 0
	}, "fit - left top" );

	collisionTest({
		within: "#within",
		collision: "flip"
	}, {
		top: 10,
		left: -6
	}, "flip - right bottom" );

	collisionTest2({
		within: "#within",
		collision: "flip"
	}, {
		top: 10,
		left: -6
	}, "flip - left top" );

	collisionTest({
		within: "#within",
		collision: "flipfit"
	}, {
		top: 4,
		left: 0
	}, "flipfit - right bottom" );

	collisionTest2({
		within: "#within",
		collision: "flipfit"
	}, {
		top: 4,
		left: 0
	}, "flipfit - left top" );
});

test( "with scrollbars", function() {
	expect( 4 );

	$( "#scrollx" ).css({
		width: 100,
		height: 100,
		left: 0,
		top: 0
	});

	collisionTest({
		of: "#scrollx",
		collision: "fit",
		within: "#scrollx"
	}, {
		top: 90,
		left: 90
	}, "visible" );

	$( "#scrollx" ).css({
		overflow: "scroll"
	});

	var scrollbarInfo = $.position.getScrollInfo( $.position.getWithinInfo( $( "#scrollx" ) ) );

	collisionTest({
		of: "#scrollx",
		collision: "fit",
		within: "#scrollx"
	}, {
		top: 90 - scrollbarInfo.height,
		left: 90 - scrollbarInfo.width
	}, "scroll" );

	$( "#scrollx" ).css({
		overflow: "auto"
	});

	collisionTest({
		of: "#scrollx",
		collision: "fit",
		within: "#scrollx"
	}, {
		top: 90,
		left: 90
	}, "auto, no scroll" );

	$( "#scrollx" ).css({
		overflow: "auto"
	}).append( $("<div>").height(300).width(300) );

	collisionTest({
		of: "#scrollx",
		collision: "fit",
		within: "#scrollx"
	}, {
		top: 90 - scrollbarInfo.height,
		left: 90 - scrollbarInfo.width
	}, "auto, with scroll" );
});

test( "fractions", function() {
	expect( 1 );

	$( "#fractions-element" ).position({
		my: "left top",
		at: "left top",
		of: "#fractions-parent",
		collision: "none"
	});
	deepEqual( $( "#fractions-element" ).offset(), $( "#fractions-parent" ).offset(), "left top, left top" );
});

test( "bug #5280: consistent results (avoid fractional values)", function() {
	expect( 1 );

	var wrapper = $( "#bug-5280" ),
		elem = wrapper.children(),
		offset1 = elem.position({
			my: "center",
			at: "center",
			of: wrapper,
			collision: "none"
		}).offset(),
		offset2 = elem.position({
			my: "center",
			at: "center",
			of: wrapper,
			collision: "none"
		}).offset();
	deepEqual( offset1, offset2 );
});

}( jQuery ) );
