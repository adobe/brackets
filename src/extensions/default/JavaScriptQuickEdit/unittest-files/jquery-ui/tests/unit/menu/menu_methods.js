/*
 * menu_methods.js
 */
(function($) {

var log = TestHelpers.menu.log,
	click = TestHelpers.menu.click;

module("menu: methods");

test( "enable/disable", function() {
	expect( 3 );
	var menu = $( "#menu1" ).menu({
		select: function(event, ui) {
			log();
		}
	});
	menu.menu("disable");
	ok(menu.is(".ui-state-disabled"),"Missing ui-state-disabled class");
	log("click",true);
	click(menu,"1");
	log("afterclick");
	menu.menu("enable");
	ok(menu.not(".ui-state-disabled"),"Has ui-state-disabled class");
	log("click");
	click(menu,"1");
	log("afterclick");
	equal( $("#log").html(), "afterclick,1,click,afterclick,click,", "Click order not valid.");
});

test( "refresh", function() {
	expect( 5 );
	var menu = $( "#menu1" ).menu();
	equal(menu.find(".ui-menu-item").length,5,"Incorrect number of menu items");
	menu.append("<li><a href='#'>test item</a></li>").menu("refresh");
	equal(menu.find(".ui-menu-item").length,6,"Incorrect number of menu items");
	menu.find(".ui-menu-item:last").remove().end().menu("refresh");
	equal(menu.find(".ui-menu-item").length,5,"Incorrect number of menu items");
	menu.append("<li>---</li>").menu("refresh");
	equal(menu.find(".ui-menu-item").length,5,"Incorrect number of menu items");
	menu.children(":last").remove().end().menu("refresh");
	equal(menu.find(".ui-menu-item").length,5,"Incorrect number of menu items");
});

test("destroy", function() {
	domEqual("#menu1", function() {
		$("#menu1").menu().menu("destroy");
	});
	domEqual("#menu2", function() {
		$("#menu2").menu().menu("destroy");
	});
	domEqual("#menu5", function() {
		$("#menu5").menu().menu("destroy");
	});
	domEqual("#menu6", function() {
		$("#menu6").menu().menu("destroy");
	});
});


})(jQuery);
