
module( "widget animation", (function() {
	var show = $.fn.show,
		fadeIn = $.fn.fadeIn,
		slideDown = $.fn.slideDown;
	return {
		setup: function() {
			$.widget( "ui.testWidget", {
				_create: function() {
					this.element.hide();
				},
				show: function( fn ) {
					this._show( this.element, this.options.show, fn );
				}
			});
			$.effects = { effect: { testEffect: $.noop } };
		},
		teardown: function() {
			delete $.ui.testWidget;
			delete $.effects.effect.testEffect;
			$.fn.show = show;
			$.fn.fadeIn = fadeIn;
			$.fn.slideDown = slideDown;
		}
	};
}()));

asyncTest( "show: null", function() {
	expect( 4 );

	var element = $( "#widget" ).testWidget(),
		hasRun = false;
	$.fn.show = function() {
		ok( true, "show called" );
		equal( arguments.length, 0, "no args passed to show" );
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: true", function() {
	expect( 4 );

	var element = $( "#widget" ).testWidget({
			show: true
		}),
		hasRun = false;
	$.fn.fadeIn = function( duration, easing, complete ) {
		return this.queue(function( next ) {
			strictEqual( duration, undefined, "duration" );
			strictEqual( easing, undefined, "easing" );
			complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: number", function() {
	expect( 4 );

	var element = $( "#widget" ).testWidget({
		show: 123
	}),
	hasRun = false;
	$.fn.fadeIn = function( duration, easing, complete ) {
		return this.queue(function( next ) {
			strictEqual( duration, 123, "duration" );
			strictEqual( easing, undefined, "easing" );
			complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: core animation", function() {
	expect( 4 );

	var element = $( "#widget" ).testWidget({
		show: "slideDown"
	}),
	hasRun = false;
	$.fn.slideDown = function( duration, easing, complete ) {
		return this.queue(function( next ) {
			strictEqual( duration, undefined, "duration" );
			strictEqual( easing, undefined, "easing" );
			complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: effect", function() {
	expect( 5 );

	var element = $( "#widget" ).testWidget({
		show: "testEffect"
	}),
	hasRun = false;
	$.fn.show = function( options ) {
		return this.queue(function( next ) {
			equal( options.effect, "testEffect", "effect" );
			ok( !("duration" in options), "duration" );
			ok( !("easing" in options), "easing" );
			options.complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: object(core animation)", function() {
	expect( 4 );

	var element = $( "#widget" ).testWidget({
		show: {
			effect: "slideDown",
			duration: 123,
			easing: "testEasing"
		}
	}),
	hasRun = false;
	$.fn.slideDown = function( duration, easing, complete ) {
		return this.queue(function( next ) {
			equal( duration, 123, "duration" );
			equal( easing, "testEasing", "easing" );
			complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});

asyncTest( "show: object(effect)", function() {
	expect( 3 );

	var element = $( "#widget" ).testWidget({
		show: {
			effect: "testEffect",
			duration: 123,
			easing: "testEasing"
		}
	}),
	hasRun = false;
	$.fn.show = function( options ) {
		return this.queue(function( next ) {
			deepEqual( options, {
				effect: "testEffect",
				duration: 123,
				easing: "testEasing",
				complete: options.complete
			});
			options.complete();
			next();
		});
	};

	element
		.delay( 50 )
		.queue(function( next ) {
			ok( !hasRun, "queue before show" );
			next();
		})
		.testWidget( "show", function() {
			hasRun = true;
		})
		.queue(function( next ) {
			ok( hasRun, "queue after show" );
			start();
			next();
		});
});
