/*
 * menu_options.js
 */
(function($) {

var log = TestHelpers.menu.log,
	click = TestHelpers.menu.click;

module("menu: options");

test( "{ disabled: true }", function() {
	expect( 2 );
	var menu = $( "#menu1" ).menu({
		disabled: true,
		select: function(event, ui) {
			log();
		}
	});
	ok(menu.is(".ui-state-disabled"),"Missing ui-state-disabled class");
	log("click",true);
	click(menu,"1");
	log("afterclick");
	equal( $("#log").html(), "afterclick,click,", "Click order not valid.");
});

test( "{ disabled: false }", function() {
	expect( 2 );
	var menu = $( "#menu1" ).menu({
		disabled: false,
		select: function(event, ui) {
			log();
		}
	});
	ok(menu.not(".ui-state-disabled"),"Has ui-state-disabled class");
	log("click",true);
	click(menu,"1");
	log("afterclick");
	equal( $("#log").html(), "afterclick,1,click,", "Click order not valid.");
});

test("{ role: 'menu' } ", function () {
	var menu = $('#menu1').menu();
	expect(2 + 5 * $("li", menu).length);
	equal( menu.attr( "role" ), "menu" );
	ok( $("li", menu).length > 0, "number of menu items");
	$("li", menu).each(function(item) {
		ok( $(this).hasClass("ui-menu-item"), "menu item ("+ item + ") class for item");
		equal( $(this).attr("role"), "presentation", "menu item ("+ item + ") role");
		equal( $("a", this).attr("role"), "menuitem", "menu item ("+ item + ") role");
		ok( $("a",this).hasClass("ui-corner-all"), "a element class for menu item ("+ item + ") ");
		equal( $("a",this).attr("tabindex"), "-1", "a element tabindex for menu item ("+ item + ") ");
	});
});

test("{ role: 'listbox' } ", function () {
	var menu = $('#menu1').menu({
		role: "listbox"
	});
	expect(2 + $("li", menu).length);
	equal( menu.attr( "role" ), "listbox" );
	ok( ($("li", menu).length > 0 ), "number of menu items");
	$("li", menu).each(function(item) {
		equal( $("a", this).attr("role"), "option", "menu item ("+ item + ") role");
	});
});

})(jQuery);
