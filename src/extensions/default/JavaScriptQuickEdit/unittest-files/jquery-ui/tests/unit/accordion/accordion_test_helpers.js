TestHelpers.accordion = {
	equalHeight: function( accordion, height ) {
		accordion.find( ".ui-accordion-content" ).each(function() {
			equal( $( this ).outerHeight(), height );
		});
	},

	setupTeardown: function() {
		var animate = $.ui.accordion.prototype.options.animate;
		return {
			setup: function() {
				$.ui.accordion.prototype.options.animate = false;
			},
			teardown: function() {
				$.ui.accordion.prototype.options.animate = animate;
			}
		};
	},

	state: function( accordion ) {
		var expected = $.makeArray( arguments ).slice( 1 ),
			actual = accordion.find( ".ui-accordion-content" ).map(function() {
			return $( this ).css( "display" ) === "none" ? 0 : 1;
		}).get();
		QUnit.push( QUnit.equiv(actual, expected), actual, expected );
	}
};
