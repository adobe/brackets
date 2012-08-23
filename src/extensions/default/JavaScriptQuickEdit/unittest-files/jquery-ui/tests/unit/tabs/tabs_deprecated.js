(function( $ ) {

var state = TestHelpers.tabs.state;

module( "tabs (deprecated): core" );

test( "panel ids", function() {
	expect( 2 );

	var element = $( "#tabs2" ).tabs();

	element.one( "tabsbeforeload", function( event, ui ) {
		equal( ui.panel.attr( "id" ), "∫ßáö_Սե", "from title attribute" );
		event.preventDefault();
	});
	element.tabs( "option", "active", 4 );

	element.one( "tabsbeforeload", function( event, ui ) {
		ok( /^ui-tabs-\d+$/.test( ui.panel.attr( "id" ) ), "generated id" );
		event.preventDefault();
	});
	element.tabs( "option", "active", 2 );
});

module( "tabs (deprecated): options" );

asyncTest( "ajaxOptions", function() {
	expect( 1 );

	var element = $( "#tabs2" ).tabs({
		ajaxOptions: {
			converters: {
				"text html": function() {
					return "test";
				}
			}
		}
	});
	element.one( "tabsload", function( event, ui ) {
		equal( $( ui.panel ).html(), "test" );
		start();
	});
	element.tabs( "option", "active", 2 );
});

asyncTest( "cache", function() {
	expect( 5 );

	var element = $( "#tabs2" ).tabs({
		cache: true
	});
	element.one( "tabsshow", function( event, ui ) {
		state( element, 0, 0, 1, 0, 0 );
	});
	element.one( "tabsload", function( event, ui ) {
		ok( true, "tabsload" );

		setTimeout(function() {
			element.tabs( "option", "active", 0 );
			state( element, 1, 0, 0, 0, 0 );

			element.one( "tabsshow", function( event, ui ) {
				state( element, 0, 0, 1, 0, 0 );
			});
			element.one( "tabsload", function( event, ui ) {
				ok( false, "should be cached" );
			});
			element.tabs( "option", "active", 2 );
			start();
		}, 1 );
	});
	element.tabs( "option", "active", 2 );
	state( element, 0, 0, 1, 0, 0 );
});

test( "idPrefix", function() {
	expect( 1 );

	$( "#tabs2" )
		.one( "tabsbeforeload", function( event, ui ) {
			ok( /^testing-\d+$/.test( ui.panel.attr( "id" ) ), "generated id" );
			event.preventDefault();
		})
		.tabs({
			idPrefix: "testing-",
			active: 2
		});
});

test( "tabTemplate + panelTemplate", function() {
	// defaults are tested in the add method test
	expect( 11 );

	var tab, anchor,
		element = $( "#tabs2" ).tabs({
			tabTemplate: "<li class='customTab'><a href='http://example.com/#{href}'>#{label}</a></li>",
			panelTemplate: "<div class='customPanel'></div>"
		});
	element.one( "tabsadd", function( event, ui ) {
		var anchor = $( ui.tab );
		equal( ui.index, 5, "ui.index" );
		equal( anchor.text(), "New", "ui.tab" );
		equal( anchor.attr( "href" ), "http://example.com/#new", "tab href" );
		ok( anchor.parent().hasClass( "customTab" ), "tab custom class" );
		equal( ui.panel.id, "new", "ui.panel" );
		ok( $( ui.panel ).hasClass( "customPanel" ), "panel custom class" );
	});
	element.tabs( "add", "#new", "New" );
	tab = element.find( ".ui-tabs-nav li" ).last();
	anchor = tab.find( ".ui-tabs-anchor" );
	equal( tab.text(), "New", "label" );
	ok( tab.hasClass( "customTab" ), "tab custom class" );
	equal( anchor.attr( "href" ), "http://example.com/#new", "href" );
	equal( tab.attr( "aria-controls" ), "new", "aria-controls" );
	ok( element.find( "#new" ).hasClass( "customPanel" ), "panel custom class" );
});

test( "cookie", function() {
	expect( 6 );

	var element = $( "#tabs1" ),
		cookieName = "tabs_test",
		cookieObj = { name: cookieName };
	$.cookie( cookieName, null );
	function cookie() {
		return parseInt( $.cookie( cookieName ), 10 );
	}

	element.tabs({ cookie: cookieObj });
	equal( cookie(), 0, "initial cookie value" );

	element.tabs( "destroy" );
	element.tabs({ active: 1, cookie: cookieObj });
	equal( cookie(), 1, "initial cookie value, from active property" );

	element.tabs( "option", "active", 2 );
	equal( cookie(), 2, "cookie value updated after activating" );

	element.tabs( "destroy" );
	$.cookie( cookieName, 1 );
	element.tabs({ cookie: cookieObj });
	equal( cookie(), 1, "initial cookie value, from existing cookie" );

	element.tabs( "destroy" );
	element.tabs({ cookie: cookieObj, collapsible: true });
	element.tabs( "option", "active", false );
	equal( cookie(), -1, "cookie value for all tabs unselected" );

	element.tabs( "destroy" );
	ok( $.cookie( cookieName ) === null, "erase cookie after destroy" );
});

asyncTest( "spinner", function() {
	expect( 2 );

	var element = $( "#tabs2" ).tabs();

	element.one( "tabsbeforeload", function( event, ui ) {
		equal( element.find( ".ui-tabs-nav li:eq(2) em" ).length, 1, "beforeload" );
	});
	element.one( "tabsload", function( event, ui ) {
		// wait until after the load finishes before checking for the spinner to be removed
		setTimeout(function() {
			equal( element.find( ".ui-tabs-nav li:eq(2) em" ).length, 0, "load" );
			start();
		}, 1 );
	});
	element.tabs( "option", "active", 2 );
});

test( "selected", function() {
	expect( 19 );

	var element = $( "#tabs1" ).tabs();
	equal( element.tabs( "option", "selected" ), 0, "should be 0 by default" );
	state( element, 1, 0, 0 );
	element.tabs( "destroy" );

	location.hash = "#fragment-3";
	element = $( "#tabs1" ).tabs();
	equal( element.tabs( "option", "selected" ), 2, "should be 2 based on URL" );
	state( element, 0, 0, 1 );
	element.tabs( "destroy" );

	el = $('#tabs1').tabs({
		selected: -1,
		collapsible: true
	});
	state( element, 0, 0, 0 );
	equal( element.find( ".ui-tabs-nav .ui-state-active" ).length, 0, "no tabs selected" );
	strictEqual( element.tabs( "option", "selected" ), -1 );

	element.tabs( "option", "collapsible", false );
	state( element, 1, 0, 0 );
	equal( element.tabs( "option", "selected" ), 0 );
	element.tabs( "destroy" );

	element.tabs({
		selected: -1
	});
	state( element, 1, 0, 0 );
	strictEqual( element.tabs( "option", "selected" ), 0 );
	element.tabs( "destroy" );

	element.tabs({ selected: 2 });
	equal( element.tabs( "option", "selected" ), 2 );
	state( element, 0, 0, 1 );

	element.tabs( "option", "selected", 0 );
	equal( element.tabs( "option", "selected" ), 0 );
	state( element, 1, 0, 0 );

	element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 1 ).click();
	equal( element.tabs( "option", "selected" ), 1 );
	state( element, 0, 1, 0 );

	element.tabs( "option", "selected", 10 );
	equal( element.tabs( "option", "selected" ), 1 );
	state( element, 0, 1, 0 );

	location.hash = "#";
});

module( "tabs (deprecated): events" );

asyncTest( "load", function() {
	expect( 15 );

	var tab, anchor, panelId, panel,
		element = $( "#tabs2" );

	// init
	element.one( "tabsload", function( event, ui ) {
		tab = element.find( ".ui-tabs-nav li" ).eq( 2 );
		anchor = tab.find( ".ui-tabs-anchor" );
		panelId = tab.attr( "aria-controls" );
		panel = $( "#" + panelId );

		ok( !( "originalEvent" in event ), "originalEvent" );
		strictEqual( ui.tab, anchor[ 0 ], "tab" );
		strictEqual( ui.panel, panel[ 0 ], "panel" );
		equal( $( ui.panel ).find( "p" ).length, 1, "panel html" );
		state( element, 0, 0, 1, 0, 0 );
		tabsload1();
	});
	element.tabs({ active: 2 });

	function tabsload1() {
		// .option()
		element.one( "tabsload", function( event, ui ) {
			tab = element.find( ".ui-tabs-nav li" ).eq( 3 );
			anchor = tab.find( ".ui-tabs-anchor" );
			panelId = tab.attr( "aria-controls" );
			panel = $( "#" + panelId );

			ok( !( "originalEvent" in event ), "originalEvent" );
			strictEqual( ui.tab, anchor[ 0 ], "tab" );
			strictEqual( ui.panel, panel[ 0 ], "panel" );
			equal( $( ui.panel ).find( "p" ).length, 1, "panel html" );
			state( element, 0, 0, 0, 1, 0 );
			tabsload2();
		});
		element.tabs( "option", "active", 3 );
	}

	function tabsload2() {
		// click, change panel content
		element.one( "tabsload", function( event, ui ) {
			tab = element.find( ".ui-tabs-nav li" ).eq( 4 );
			anchor = tab.find( ".ui-tabs-anchor" );
			panelId = tab.attr( "aria-controls" );
			panel = $( "#" + panelId );

			equal( event.originalEvent.type, "click", "originalEvent" );
			strictEqual( ui.tab, anchor[ 0 ], "tab" );
			strictEqual( ui.panel, panel[ 0 ], "panel" );
			equal( $( ui.panel ).find( "p" ).length, 1, "panel html" );
			state( element, 0, 0, 0, 0, 1 );
			start();
		});
		element.find( ".ui-tabs-nav .ui-tabs-anchor" ).eq( 4 ).click();
	}
});

test( "enable", function() {
	expect( 3 );

	var element = $( "#tabs1" ).tabs({
		disabled: [ 0, 1 ],
		enable: function( event, ui ) {
			equal( ui.tab, element.find( ".ui-tabs-nav .ui-tabs-anchor" )[ 1 ], "ui.tab" );
			equal( ui.panel, element.find( ".ui-tabs-panel" )[ 1 ], "ui.panel" );
			equal( ui.index, 1, "ui.index" );
		}
	});
	element.tabs( "enable", 1 );
	// shouldn't trigger event
	element.tabs( "enable", 2 );
});

test( "disable", function() {
	expect( 3 );

	var element = $( "#tabs1" ).tabs({
		disable: function( event, ui ) {
			equal( ui.tab, element.find( ".ui-tabs-nav .ui-tabs-anchor" )[ 1 ], "ui.tab" );
			equal( ui.panel, element.find( ".ui-tabs-panel" )[ 1 ], "ui.panel" );
			equal( ui.index, 1, "ui.index" );
		}
	});
	element.tabs( "disable", 1 );
	// shouldn't trigger event
	element.tabs( "disable", 1 );
});


test( "show", function() {
	expect( 13 );

	var element = $( "#tabs1" ).tabs({
			active: false,
			collapsible: true
		}),
		anchors = element.find( ".ui-tabs-nav .ui-tabs-anchor" ),
		panels = element.find( ".ui-tabs-panel" );

	// from collapsed
	element.one( "tabsshow", function( event, ui ) {
		ok( !( "originalEvent" in event ), "originalEvent" );
		strictEqual( ui.tab, anchors[ 0 ], "ui.tab" );
		strictEqual( ui.panel, panels[ 0 ], "ui.panel" );
		equal( ui.index, 0, "ui.index" );
		state( element, 1, 0, 0 );
	});
	element.tabs( "option", "active", 0 );
	state( element, 1, 0, 0 );

	// switching tabs
	element.one( "tabsshow", function( event, ui ) {
		equal( event.originalEvent.type, "click", "originalEvent" );
		strictEqual( ui.tab, anchors[ 1 ], "ui.tab" );
		strictEqual( ui.panel, panels[ 1 ], "ui.panel" );
		equal( ui.index, 1, "ui.index" );
		state( element, 0, 1, 0 );
	});
	anchors.eq( 1 ).click();
	state( element, 0, 1, 0 );

	// collapsing
	element.one( "tabsshow", function( event, ui ) {
		ok( false, "collapsing" );
	});
	element.tabs( "option", "active", false );
	state( element, 0, 0, 0 );
});

test( "select", function() {
	expect( 13 );

	var element = $( "#tabs1" ).tabs({
			active: false,
			collapsible: true
		}),
		anchors = element.find( ".ui-tabs-nav .ui-tabs-anchor" ),
		panels = element.find( ".ui-tabs-panel" );

	// from collapsed
	element.one( "tabsselect", function( event, ui ) {
		ok( !( "originalEvent" in event ), "originalEvent" );
		strictEqual( ui.tab, anchors[ 0 ], "ui.tab" );
		strictEqual( ui.panel, panels[ 0 ], "ui.panel" );
		equal( ui.index, 0, "ui.index" );
		state( element, 0, 0, 0 );
	});
	element.tabs( "option", "active", 0 );
	state( element, 1, 0, 0 );

	// switching tabs
	element.one( "tabsselect", function( event, ui ) {
		equal( event.originalEvent.type, "click", "originalEvent" );
		strictEqual( ui.tab, anchors[ 1 ], "ui.tab" );
		strictEqual( ui.panel, panels[ 1 ], "ui.panel" );
		equal( ui.index, 1, "ui.index" );
		state( element, 1, 0, 0 );
	});
	anchors.eq( 1 ).click();
	state( element, 0, 1, 0 );

	// collapsing
	element.one( "tabsselect", function( event, ui ) {
		ok( false, "collapsing" );
	});
	element.tabs( "option", "active", false );
	state( element, 0, 0, 0 );
});

module( "tabs (deprecated): methods" );

test( "add", function() {
	expect( 28 );

	var tab, anchor,
		element = $( "#tabs1" ).tabs();

	function stripLeadingSlash( str ) {
		return str.substr( str.charAt( 0 ) === "/" ? 1 : 0 );
	}

	state( element, 1, 0, 0 );

	// add without index
	element.one( "tabsadd", function( event, ui ) {
		equal( ui.index, 3, "ui.index" );
		equal( $( ui.tab ).text(), "New", "ui.tab" );
		equal( ui.panel.id, "new", "ui.panel" );
	});
	element.tabs( "add", "#new", "New" );
	state( element, 1, 0, 0, 0 );
	tab = element.find( ".ui-tabs-nav li" ).last();
	anchor = tab.find( ".ui-tabs-anchor" );
	equal( tab.text(), "New", "label" );
	equal( stripLeadingSlash( anchor[0].pathname ), stripLeadingSlash( location.pathname ), "href pathname" );
	equal( anchor[0].hash, "#new", "href hash" );
	equal( tab.attr( "aria-controls" ), "new", "aria-controls" );
	ok( !tab.hasClass( "ui-state-hover" ), "not hovered" );
	anchor.simulate( "mouseover" );
	ok( tab.hasClass( "ui-state-hover" ), "hovered" );
	anchor.simulate( "click" );
	state( element, 0, 0, 0, 1 );

	// add remote tab with index
	element.one( "tabsadd", function( event, ui ) {
		equal( ui.index, 1, "ui.index" );
		equal( $( ui.tab ).text(), "New Remote", "ui.tab" );
		equal( ui.panel.id, $( ui.tab ).closest( "li" ).attr( "aria-controls" ), "ui.panel" );
	});
	element.tabs( "add", "data/test.html", "New Remote", 1 );
	state( element, 0, 0, 0, 0, 1 );
	tab = element.find( ".ui-tabs-nav li" ).eq( 1 );
	anchor = tab.find( ".ui-tabs-anchor" );
	equal( tab.text(), "New Remote", "label" );
	equal( stripLeadingSlash( stripLeadingSlash(
		anchor[0].pathname.replace( stripLeadingSlash( location.pathname ).split( "/" ).slice( 0, -1 ).join( "/" ), "" )
	) ), "data/test.html", "href" );
	ok( /^ui-tabs-\d+$/.test( tab.attr( "aria-controls" ) ), "aria controls" );
	ok( !tab.hasClass( "ui-state-hover" ), "not hovered" );
	anchor.simulate( "mouseover" );
	ok( tab.hasClass( "ui-state-hover" ), "hovered" );
	anchor.simulate( "click" );
	state( element, 0, 1, 0, 0, 0 );

	// add to empty tab set
	element = $( "<div><ul></ul></div>" ).tabs();
	equal( element.tabs( "option", "active" ), false, "active: false on init" );
	element.one( "tabsadd", function( event, ui ) {
		equal( ui.index, 0, "ui.index" );
		equal( $( ui.tab ).text(), "First", "ui.tab" );
		equal( ui.panel.id, "first", "ui.panel" );
	});
	element.tabs( "add", "#first", "First" );
	state( element, 1 );
	equal( element.tabs( "option", "active" ), 0, "active: 0 after add" );
});

test( "#5069 - ui.tabs.add creates two tab panels when using a full URL", function() {
	expect( 2 );

	var element = $( "#tabs2" ).tabs();
	equal( element.children( "div" ).length, element.find( ".ui-tabs-nav li" ).length );
	element.tabs( "add", "/new", "New" );
	equal( element.children( "div" ).length, element.find( ".ui-tabs-nav li" ).length );
});

test( "remove", function() {
	expect( 17 );

	var element = $( "#tabs1" ).tabs({ active: 1 });
	state( element, 0, 1, 0 );

	element.one( "tabsremove", function( event, ui ) {
		equal( ui.index, -1, "ui.index" );
		equal( $( ui.tab ).text(), "2", "ui.tab" );
		equal( ui.panel.id, "fragment-2", "ui.panel" );
	});
	element.tabs( "remove", 1 );
	state( element, 0, 1 );
	equal( element.tabs( "option", "active" ), 1 );
	equal( element.find( ".ui-tabs-nav li a[href$='fragment-2']" ).length, 0,
		"remove correct list item" );
	equal( element.find( "#fragment-2" ).length, 0, "remove correct panel" );

	element.one( "tabsremove", function( event, ui ) {
		equal( ui.index, -1, "ui.index" );
		equal( $( ui.tab ).text(), "3", "ui.tab" );
		equal( ui.panel.id, "fragment-3", "ui.panel" );
	});
	element.tabs( "remove", 1 );
	state( element, 1 );
	equal( element.tabs( "option", "active"), 0 );

	element.one( "tabsremove", function( event, ui ) {
		equal( ui.index, -1, "ui.index" );
		equal( $( ui.tab ).text(), "1", "ui.tab" );
		equal( ui.panel.id, "fragment-1", "ui.panel" );
	});
	element.tabs( "remove", 0 );
	equal( element.tabs( "option", "active" ), false );
});

test( "select", function() {
	expect( 23 );

	var element = $( "#tabs1" ).tabs();
	state( element, 1, 0, 0 );
	element.tabs( "select", 1 );
	state( element, 0, 1, 0 );
	equal( element.tabs( "option", "active" ), 1, "active" );
	equal( element.tabs( "option", "selected" ), 1, "selected" );
	element.tabs( "destroy" );

	element.tabs({ collapsible: true });
	state( element, 1, 0, 0 );
	element.tabs( "select", 0 );
	state( element, 0, 0, 0 );
	equal( element.tabs( "option", "active" ), false, "active" );
	equal( element.tabs( "option", "selected" ), -1, "selected" );
	element.tabs( "destroy" );

	element.tabs({ collapsible: true });
	element.tabs( "select", -1 );
	state( element, 0, 0, 0 );
	equal( element.tabs( "option", "active" ), false, "active" );
	equal( element.tabs( "option", "selected" ), -1, "selected" );
	element.tabs( "destroy" );

	element.tabs();
	state( element, 1, 0, 0 );
	equal( element.tabs( "option", "active" ), 0, "active" );
	equal( element.tabs( "option", "selected" ), 0, "selected" );
	element.tabs( "select", 0 );
	state( element, 1, 0, 0 );
	equal( element.tabs( "option", "active" ), 0, "active" );
	equal( element.tabs( "option", "selected" ), 0, "selected" );
	element.tabs( "select", -1 );
	state( element, 1, 0, 0 );
	equal( element.tabs( "option", "active" ), 0, "active" );
	equal( element.tabs( "option", "selected" ), 0, "selected" );

	element.tabs( "select", "#fragment-2" );
	state( element, 0, 1, 0 );
	equal( element.tabs( "option", "active" ), 1, "active" );
	equal( element.tabs( "option", "selected" ), 1, "selected" );
});

test( "length", function() {
	expect( 2 );

	equal( $( "#tabs1" ).tabs().tabs( "length" ), 3, "basic tabs" );
	equal( $( "#tabs2" ).tabs().tabs( "length" ), 5, "ajax tabs with missing panels" );
});

test( "url", function() {
	expect( 2 );

	var element = $( "#tabs2" ).tabs(),
		anchor = element.find( ".ui-tabs-anchor" ).eq( 3 );

	element.tabs( "url", 3, "data/test2.html" );
	equal( anchor.attr( "href" ), "data/test2.html", "href was updated" );
	element.one( "tabsbeforeload", function( event, ui ) {
		equal( ui.ajaxSettings.url, "data/test2.html", "ajaxSettings.url" );
		event.preventDefault();
	});
	element.tabs( "option", "active", 3 );
});

asyncTest( "abort", function() {
	expect( 1 );

	var element = $( "#tabs2" ).tabs();
	element.one( "tabsbeforeload", function( event, ui ) {
		ui.jqXHR.error(function( jqXHR, status ) {
			equal( status, "abort", "aborted" );
			start();
		});
	});
	// prevent IE from caching the request, so that it won't resolve before we call abort
	element.find( ".ui-tabs-nav li:eq(2) .ui-tabs-anchor" ).attr( "href", function( href ) {
		return href + "?" + (+ new Date());
	});
	element.tabs( "option", "active", 2 );
	element.tabs( "abort" );
});

}( jQuery ) );
