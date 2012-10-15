/*
 * button_tickets.js
 */
(function( $ ) {

module( "button: tickets" );

test( "#5946 - buttonset should ignore buttons that are not :visible", function() {
	$( "#radio01" ).next().andSelf().hide();
	var set = $( "#radio0" ).buttonset({ items: "input[type=radio]:visible" });
	ok( set.find( "label:eq(0)" ).is( ":not(.ui-button):not(.ui-corner-left)" ) );
	ok( set.find( "label:eq(1)" ).is( ".ui-button.ui-corner-left" ) );
});

test( "#6262 - buttonset not applying ui-corner to invisible elements", function() {
	$( "#radio0" ).hide();
	var set = $( "#radio0" ).buttonset();
	ok( set.find( "label:eq(0)" ).is( ".ui-button.ui-corner-left" ) );
	ok( set.find( "label:eq(1)" ).is( ".ui-button" ) );
	ok( set.find( "label:eq(2)" ).is( ".ui-button.ui-corner-right" ) );
});

test( "#6711 Checkbox/Radiobutton do not Show Focused State when using Keyboard Navigation", function() {
	var check = $( "#check" ).button(),
		label = $( "label[for='check']" );
	ok( !label.is( ".ui-state-focus" ) );
	check.focus();
	ok( label.is( ".ui-state-focus" ) );
});

test( "#7092 - button creation that requires a matching label does not find label in all cases", function() {
	var group = $( "<span><label for='t7092a'></label><input type='checkbox' id='t7092a'></span>" );
	group.find( "input[type=checkbox]" ).button();
	ok( group.find( "label" ).is( ".ui-button" ) );

	group = $( "<input type='checkbox' id='t7092b'><label for='t7092b'></label>" );
	group.filter( "input[type=checkbox]" ).button();
	ok( group.filter( "label" ).is( ".ui-button" ) );

	group = $( "<span><input type='checkbox' id='t7092c'></span><label for='t7092c'></label>" );
	group.find( "input[type=checkbox]" ).button();
	ok( group.filter( "label" ).is( ".ui-button" ) );

	group = $( "<span><input type='checkbox' id='t7092d'></span><span><label for='t7092d'></label></span>" );
	group.find( "input[type=checkbox]" ).button();
	ok( group.find( "label" ).is( ".ui-button" ) );

	group = $( "<input type='checkbox' id='t7092e'><span><label for='t7092e'></label></span>" );
	group.filter( "input[type=checkbox]" ).button();
	ok( group.find( "label" ).is( ".ui-button" ) );
});

test( "#7534 - Button label selector works for ids with \":\"", function() {
	var group = $( "<span><input type='checkbox' id='check:7534'><label for='check:7534'>Label</label></span>" );
	group.find( "input" ).button();
	ok( group.find( "label" ).is( ".ui-button" ), "Found an id with a :" );
});

})( jQuery );
