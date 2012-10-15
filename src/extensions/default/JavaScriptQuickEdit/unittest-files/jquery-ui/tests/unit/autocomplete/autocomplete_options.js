(function( $ ) {

module( "autocomplete: options" );

var data = [ "c++", "java", "php", "coldfusion", "javascript", "asp", "ruby", "python", "c", "scala", "groovy", "haskell", "perl" ];

test( "appendTo", function() {
	expect( 5 );
	var element = $( "#autocomplete" ).autocomplete();
	equal( element.autocomplete( "widget" ).parent()[0], document.body, "defaults to body" );
	element.autocomplete( "destroy" );

	element.autocomplete({
		appendTo: ".ac-wrap"
	});
	equal( element.autocomplete( "widget" ).parent()[0], $( "#ac-wrap1" )[0], "first found element" );
	equal( $( "#ac-wrap2 .ui-autocomplete" ).length, 0, "only appends to one element" );
	element.autocomplete( "destroy" );

	element.autocomplete({
		appendTo: null
	});
	equal( element.autocomplete( "widget" ).parent()[0], document.body, "null" );
	element.autocomplete( "destroy" );

	element.autocomplete().autocomplete( "option", "appendTo", "#ac-wrap1" );
	equal( element.autocomplete( "widget" ).parent()[0], $( "#ac-wrap1" )[0], "modified after init" );
	element.autocomplete( "destroy" );
});

function autoFocusTest( afValue, focusedLength ) {
	var element = $( "#autocomplete" ).autocomplete({
		autoFocus: afValue,
		delay: 0,
		source: data,
		open: function( event, ui ) {
			equal( element.autocomplete( "widget" ).children( ".ui-menu-item:first" ).find( ".ui-state-focus" ).length,
				focusedLength, "first item is " + (afValue ? "" : "not") + " auto focused" );
			start();
		}
	});
	element.val( "ja" ).keydown();
	stop();
}

test( "autoFocus: false", function() {
	expect( 1 );
	autoFocusTest( false, 0 );
});

test( "autoFocus: true", function() {
	expect( 1 );
	autoFocusTest( true, 1 );
});

asyncTest( "delay", function() {
	expect( 2 );
	var element = $( "#autocomplete" ).autocomplete({
			source: data,
			delay: 50
		}),
		menu = element.autocomplete( "widget" );
	element.val( "ja" ).keydown();

	ok( menu.is( ":hidden" ), "menu is closed immediately after search" );

	setTimeout(function() {
		ok( menu.is( ":visible" ), "menu is open after delay" );
		start();
	}, 100 );
});

asyncTest( "disabled", function() {
	expect( 2 );
	var element = $( "#autocomplete" ).autocomplete({
			source: data,
			delay: 0,
			disabled: true
		}),
		menu = element.autocomplete( "widget" );
	element.val( "ja" ).keydown();

	ok( menu.is( ":hidden" ) );

	setTimeout(function() {
		ok( menu.is( ":hidden" ) );
		start();
	}, 50 );
});

test( "minLength", function() {
	expect( 2 );
	var element = $( "#autocomplete" ).autocomplete({
			source: data
		}),
		menu = element.autocomplete( "widget" );
	element.autocomplete( "search", "" );
	ok( menu.is( ":hidden" ), "blank not enough for minLength: 1" );

	element.autocomplete( "option", "minLength", 0 );
	element.autocomplete( "search", "" );
	ok( menu.is( ":visible" ), "blank enough for minLength: 0" );
});

asyncTest( "minLength, exceed then drop below", function() {
	expect( 4 );
	var element = $( "#autocomplete" ).autocomplete({
			minLength: 2,
			source: function( req, res ) {
				equal( req.term, "12", "correct search term" );
				setTimeout(function() {
					res([ "item" ]);
				}, 1 );
			}
		}),
		menu = element.autocomplete( "widget" );

	ok( menu.is( ":hidden" ), "menu is hidden before first search" );
	element.autocomplete( "search", "12" );

	ok( menu.is( ":hidden" ), "menu is hidden before second search" );
	element.autocomplete( "search", "1" );

	setTimeout(function() {
		ok( menu.is( ":hidden" ), "menu is hidden after searches" );
		start();
	}, 50 );
});

test( "minLength, exceed then drop below then exceed", function() {
	expect( 3 );
	var _res = [],
		element = $( "#autocomplete" ).autocomplete({
			minLength: 2,
			source: function( req, res ) {
				_res.push( res );
			}
		}),
		menu = element.autocomplete( "widget" );

	// trigger a valid search
	ok( menu.is( ":hidden" ), "menu is hidden before first search" );
	element.autocomplete( "search", "12" );

	// trigger a search below the minLength, to turn on cancelSearch flag
	ok( menu.is( ":hidden" ), "menu is hidden before second search" );
	element.autocomplete( "search", "1" );

	// trigger a valid search
	element.autocomplete( "search", "13" );
	// react as if the first search was cancelled (default ajax behavior)
	_res[ 0 ]([]);
	// react to second search
	_res[ 1 ]([ "13" ]);

	ok( menu.is( ":visible" ), "menu is visible after searches" );
});

test( "source, local string array", function() {
	expect( 1 );
	var element = $( "#autocomplete" ).autocomplete({
			source: data
		}),
		menu = element.autocomplete( "widget" );
	element.val( "ja" ).autocomplete( "search" );
	equal( menu.find( ".ui-menu-item" ).text(), "javajavascript" );
});

function sourceTest( source, async ) {
	var element = $( "#autocomplete" ).autocomplete({
			source: source
		}),
		menu = element.autocomplete( "widget" );
	function result() {
		equal( menu.find( ".ui-menu-item" ).text(), "javajavascript" );
		element.autocomplete( "destroy" );
		if ( async ) {
			start();
		}
	}
	if ( async ) {
		stop();
		$( document ).one( "ajaxStop", result );
	}
	element.val( "ja" ).autocomplete( "search" );
	if ( !async ) {
		result();
	}
}

test( "source, local object array, only label property", function() {
	expect( 1 );
	sourceTest([
		{ label: "java" },
		{ label: "php" },
		{ label: "coldfusion" },
		{ label: "javascript" }
	]);
});

test( "source, local object array, only value property", function() {
	expect( 1 );
	sourceTest([
		{ value: "java" },
		{ value: "php" },
		{ value: "coldfusion" },
		{ value: "javascript" }
	]);
});

test( "source, url string with remote json string array", function() {
	expect( 1 );
	sourceTest( "remote_string_array.txt", true );
});

test( "source, url string with remote json object array, only value properties", function() {
	expect( 1 );
	sourceTest( "remote_object_array_values.txt", true );
});

test( "source, url string with remote json object array, only label properties", function() {
	expect( 1 );
	sourceTest( "remote_object_array_labels.txt", true );
});

test( "source, custom", function() {
	expect( 2 );
	sourceTest(function( request, response ) {
		equal( request.term, "ja" );
		response( ["java", "javascript"] );
	});
});

test( "source, update after init", function() {
	expect( 2 );
	var element = $( "#autocomplete" ).autocomplete({
			source: [ "java", "javascript", "haskell" ]
		}),
		menu = element.autocomplete( "widget" );
	element.val( "ja" ).autocomplete( "search" );
	equal( menu.find( ".ui-menu-item" ).text(), "javajavascript" );
	element.autocomplete( "option", "source", [ "php", "asp" ] );
	element.val( "ph" ).autocomplete( "search" );
	equal( menu.find( ".ui-menu-item" ).text(), "php" );
});

}( jQuery ) );
