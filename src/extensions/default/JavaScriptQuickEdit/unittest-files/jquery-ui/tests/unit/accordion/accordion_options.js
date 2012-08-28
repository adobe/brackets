(function( $ ) {

var equalHeight = TestHelpers.accordion.equalHeight,
	setupTeardown = TestHelpers.accordion.setupTeardown,
	state = TestHelpers.accordion.state;

module( "accordion: options", setupTeardown() );

test( "{ active: default }", function() {
	expect( 2 );
	var element = $( "#list1" ).accordion();
	equal( element.accordion( "option", "active" ), 0 );
	state( element, 1, 0, 0 );
});

test( "{ active: false }", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
		active: false,
		collapsible: true
	});
	state( element, 0, 0, 0 );
	equal( element.find( ".ui-accordion-header.ui-state-active" ).length, 0, "no headers selected" );
	equal( element.accordion( "option", "active" ), false );

	element.accordion( "option", "collapsible", false );
	state( element, 1, 0, 0 );
	equal( element.accordion( "option", "active" ), 0 );

	element.accordion( "destroy" );
	element.accordion({
		active: false
	});
	state( element, 1, 0, 0 );
	strictEqual( element.accordion( "option", "active" ), 0 );
});

test( "{ active: Number }", function() {
	expect( 8 );
	var element = $( "#list1" ).accordion({
		active: 2
	});
	equal( element.accordion( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.accordion( "option", "active", 0 );
	equal( element.accordion( "option", "active" ), 0 );
	state( element, 1, 0, 0 );

	element.find( ".ui-accordion-header" ).eq( 1 ).click();
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.accordion( "option", "active", 10 );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

if ( $.uiBackCompat === false ) {
	test( "{ active: -Number }", function() {
		expect( 8 );
		var element = $( "#list1" ).accordion({
			active: -1
		});
		equal( element.accordion( "option", "active" ), 2 );
		state( element, 0, 0, 1 );

		element.accordion( "option", "active", -2 );
		equal( element.accordion( "option", "active" ), 1 );
		state( element, 0, 1, 0 );

		element.accordion( "option", "active", -10 );
		equal( element.accordion( "option", "active" ), 1 );
		state( element, 0, 1, 0 );

		element.accordion( "option", "active", -3 );
		equal( element.accordion( "option", "active" ), 0 );
		state( element, 1, 0, 0 );
	});
}

test( "{ animate: false }", function() {
	expect( 3 );
	var element = $( "#list1" ).accordion({
			animate: false
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	$.fn.animate = function() {
		ok( false, ".animate() called" );
	};

	ok( panels.eq( 0 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 1 );
	ok( panels.eq( 0 ).is( ":hidden" ), "first panel hidden" );
	ok( panels.eq( 1 ).is( ":visible" ), "second panel visible" );
	$.fn.animate = animate;
});

asyncTest( "{ animate: Number }", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			animate: 100
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, 100, "correct duration" );
		equal( easing, undefined, "default easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 0 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 1 );
	panels.promise().done(function() {
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

asyncTest( "{ animate: String }", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			animate: "linear"
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, undefined, "default duration" );
		equal( easing, "linear", "correct easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 0 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 1 );
	panels.promise().done(function() {
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

asyncTest( "{ animate: {} }", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			animate: {}
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, undefined, "default duration" );
		equal( easing, undefined, "default easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 0 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 1 );
	panels.promise().done(function() {
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

asyncTest( "{ animate: { duration, easing } }", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			animate: { duration: 100, easing: "linear" }
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, 100, "correct duration" );
		equal( easing, "linear", "correct easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 0 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 1 );
	panels.promise().done(function() {
		ok( panels.eq( 0 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 1 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

asyncTest( "{ animate: { duration, easing } }, animate down", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			active: 1,
			animate: { duration: 100, easing: "linear" }
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, 100, "correct duration" );
		equal( easing, "linear", "correct easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 1 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 0 );
	panels.promise().done(function() {
		ok( panels.eq( 1 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 0 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

asyncTest( "{ animate: { duration, easing, down } }, animate down", function() {
	expect( 7 );
	var element = $( "#list1" ).accordion({
			active: 1,
			animate: {
				duration: 100,
				easing: "linear",
				down: {
					easing: "swing"
				}
			}
		}),
		panels = element.find( ".ui-accordion-content" ),
		animate = $.fn.animate;
	// called twice (both panels)
	$.fn.animate = function( props, duration, easing ) {
		equal( duration, 100, "correct duration" );
		equal( easing, "swing", "correct easing" );
		animate.apply( this, arguments );
	};

	ok( panels.eq( 1 ).is( ":visible" ), "first panel visible" );
	element.accordion( "option", "active", 0 );
	panels.promise().done(function() {
		ok( panels.eq( 1 ).is( ":hidden" ), "first panel hidden" );
		ok( panels.eq( 0 ).is( ":visible" ), "second panel visible" );
		$.fn.animate = animate;
		start();
	});
});

test( "{ collapsible: false }", function() {
	expect( 4 );
	var element = $( "#list1" ).accordion({
		active: 1
	});
	element.accordion( "option", "active", false );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-accordion-header" ).eq( 1 ).click();
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ collapsible: true }", function() {
	expect( 6 );
	var element = $( "#list1" ).accordion({
		active: 1,
		collapsible: true
	});

	element.accordion( "option", "active", false );
	equal( element.accordion( "option", "active" ), false );
	state( element, 0, 0, 0 );

	element.accordion( "option", "active", 1 );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-accordion-header" ).eq( 1 ).click();
	equal( element.accordion( "option", "active" ), false );
	state( element, 0, 0, 0 );
});

test( "{ event: null }", function() {
	expect( 5 );
	var element = $( "#list1" ).accordion({
		event: null
	});
	state( element, 1, 0, 0 );

	element.accordion( "option", "active", 1 );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	// ensure default click handler isn't bound
	element.find( ".ui-accordion-header" ).eq( 2 ).click();
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ event: custom }", function() {
	expect( 11 );
	var element = $( "#list1" ).accordion({
		event: "custom1 custom2"
	});
	state( element, 1, 0, 0 );

	element.find( ".ui-accordion-header" ).eq( 1 ).trigger( "custom1" );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	// ensure default click handler isn't bound
	element.find( ".ui-accordion-header" ).eq( 2 ).trigger( "click" );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );

	element.find( ".ui-accordion-header" ).eq( 2 ).trigger( "custom2" );
	equal( element.accordion( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.accordion( "option", "event", "custom3" );

	// ensure old event handlers are unbound
	element.find( ".ui-accordion-header" ).eq( 1 ).trigger( "custom1" );
	element.find( ".ui-accordion-header" ).eq( 1 ).trigger( "custom2" );
	equal( element.accordion( "option", "active" ), 2 );
	state( element, 0, 0, 1 );

	element.find( ".ui-accordion-header" ).eq( 1 ).trigger( "custom3" );
	equal( element.accordion( "option", "active" ), 1 );
	state( element, 0, 1, 0 );
});

test( "{ header: default }", function() {
	expect( 2 );
	// default: > li > :first-child,> :not(li):even
	// > :not(li):even
	state( $( "#list1" ).accordion(), 1, 0, 0);
	// > li > :first-child
	state( $( "#navigation" ).accordion(), 1, 0, 0);
});

test( "{ header: custom }", function() {
	expect( 6 );
	var element = $( "#navigationWrapper" ).accordion({
		header: "h2"
	});
	element.find( "h2" ).each(function() {
		ok( $( this ).hasClass( "ui-accordion-header" ) );
	});
	equal( element.find( ".ui-accordion-header" ).length, 3 );
	state( element, 1, 0, 0 );
	element.accordion( "option", "active", 2 );
	state( element, 0, 0, 1 );
});

test( "{ heightStyle: 'auto' }", function() {
	expect( 3 );
	var element = $( "#navigation" ).accordion({ heightStyle: "auto" });
	equalHeight( element, 105 );
});

test( "{ heightStyle: 'content' }", function() {
	expect( 3 );
	var element = $( "#navigation" ).accordion({ heightStyle: "content" }),
		sizes = element.find( ".ui-accordion-content" ).map(function() {
			return $( this ).height();
		}).get();
	equal( sizes[ 0 ], 75 );
	equal( sizes[ 1 ], 105 );
	equal( sizes[ 2 ], 45 );
});

test( "{ heightStyle: 'fill' }", function() {
	expect( 3 );
	$( "#navigationWrapper" ).height( 500 );
	var element = $( "#navigation" ).accordion({ heightStyle: "fill" });
	equalHeight( element, 455 );
});

test( "{ heightStyle: 'fill' } with sibling", function() {
	expect( 3 );
	$( "#navigationWrapper" ).height( 500 );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30
		})
		.prependTo( "#navigationWrapper" );
	var element = $( "#navigation" ).accordion({ heightStyle: "fill" });
	equalHeight( element , 355 );
});

test( "{ heightStyle: 'fill' } with multiple siblings", function() {
	expect( 3 );
	$( "#navigationWrapper" ).height( 500 );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30
		})
		.prependTo( "#navigationWrapper" );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 50,
			marginTop: 20,
			marginBottom: 30,
			position: "absolute"
		})
		.prependTo( "#navigationWrapper" );
	$( "<p>Lorem Ipsum</p>" )
		.css({
			height: 25,
			marginTop: 10,
			marginBottom: 15
		})
		.prependTo( "#navigationWrapper" );
	var element = $( "#navigation" ).accordion({ heightStyle: "fill" });
	equalHeight( element, 305 );
});

test( "{ icons: false }", function() {
	expect( 8 );
	var element = $( "#list1" );
	function icons( on ) {
		deepEqual( element.find( "span.ui-icon").length, on ? 3 : 0 );
		deepEqual( element.find( ".ui-accordion-header.ui-accordion-icons" ).length, on ? 3 : 0 );
	}
	element.accordion();
	icons( true );
	element.accordion( "destroy" ).accordion({
		icons: false
	});
	icons( false );
	element.accordion( "option", "icons", { header: "foo", activeHeader: "bar" } );
	icons( true );
	element.accordion( "option", "icons", false );
	icons( false );
});

test( "{ icons: hash }", function() {
	expect( 3 );
	var element = $( "#list1" ).accordion({
		icons: { activeHeader: "a1", header: "h1" }
	});
	ok( element.find( ".ui-accordion-header.ui-state-active span.ui-icon" ).hasClass( "a1" ) );
	element.accordion( "option", "icons", { activeHeader: "a2", header: "h2" } );
	ok( !element.find( ".ui-accordion-header.ui-state-active span.ui-icon" ).hasClass( "a1" ) );
	ok( element.find( ".ui-accordion-header.ui-state-active span.ui-icon" ).hasClass( "a2" ) );
});

}( jQuery ) );
