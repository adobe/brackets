/*
 * menu_core.js
 */


(function($) {

module("menu: core");

test("accessibility", function () {
	expect(5);
	var item,
		menu = $('#menu1').menu(),
		item0 = $("li:eq(0) a");

	ok( menu.hasClass("ui-menu ui-widget ui-widget-content ui-corner-all"), "menu class");
	equal( menu.attr("role"), "menu", "main role");
	ok( !menu.attr("aria-activedescendant"), "aria attribute not yet active");

	item = menu.find( "li:first" ).find( "a" ).attr( "id", "xid" ).end();
	menu.menu( "focus", $.Event(), item );
	equal( menu.attr("aria-activedescendant"), "xid", "aria attribute, id from dom");

	item = menu.find( "li:last" );
	menu.menu( "focus", $.Event(), item );
	ok( /^ui-id-\d+$/.test( menu.attr( "aria-activedescendant" ) ), "aria attribute, generated id");
});

})(jQuery);
