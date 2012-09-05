TestHelpers.tabs = {
	disabled: function( tabs, state ) {
		var expected, actual,
			internalState = tabs.tabs( "option", "disabled" );

		if ( internalState === false ) {
			internalState = [];
		}
		if ( internalState === true ) {
			internalState = $.map( new Array( tabs.find( ".ui-tabs-nav li" ).length ), function( _, index ) {
				return index;
			});
		}

		expected = $.map( new Array( tabs.find ( ".ui-tabs-nav li" ).length ), function( _, index ) {
			if ( typeof state === "boolean" ) {
				return state ? 1 : 0;
			} else {
				return $.inArray( index, state ) !== -1 ? 1 : 0;
			}
		});

		actual = tabs.find( ".ui-tabs-nav li" ).map(function( index ) {
			var tab = $( this ),
				tabIsDisabled = tab.hasClass( "ui-state-disabled" );

			if ( tabIsDisabled && $.inArray( index, internalState ) !== -1 ) {
				return 1;
			}
			if ( !tabIsDisabled && $.inArray( index, internalState ) === -1 ) {
				return 0;
			}
			// mixed state - invalid
			return -1;
		}).get();

		deepEqual( tabs.tabs( "option", "disabled" ), state );
		deepEqual( actual, expected );
	},

	equalHeight: function( tabs, height ) {
		tabs.find( ".ui-tabs-panel" ).each(function() {
			equal( $( this ).outerHeight(), height );
		});
	},

	state: function( tabs ) {
		var expected = $.makeArray( arguments ).slice( 1 ),
			actual = tabs.find( ".ui-tabs-nav li" ).map(function() {
				var tab = $( this ),
					panel = $( $.ui.tabs.prototype._sanitizeSelector(
						"#" + tab.attr( "aria-controls" ) ) ),
					tabIsActive = tab.hasClass( "ui-state-active" ),
					panelIsActive = panel.css( "display" ) !== "none";

				if ( tabIsActive && panelIsActive ) {
					return 1;
				}
				if ( !tabIsActive && !panelIsActive ) {
					return 0;
				}
				return -1; // mixed state - invalid
			}).get();
		deepEqual( actual, expected );
	}
};

