TestHelpers.menu = {
	log: function( message, clear ) {
		if ( clear ) {
			$( "#log" ).empty();
		}
		if ( message === undefined ) {
			message = $( "#log" ).data( "lastItem" );
		}
		$( "#log" ).prepend( $.trim( message ) + "," );
	},

	click: function( menu, item ) {
		$( "#log" ).data( "lastItem", item );
		menu.children( ":eq(" + item + ")" ).find( "a:first" ).trigger( "click" );
	}
};