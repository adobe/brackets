/*
 * dialog_tickets.js
 */
(function($) {

module( "dialog: tickets" );

asyncTest( "#3123: Prevent tabbing out of modal dialogs", function() {
	expect( 3 );

	var el = $( "<div><input id='t3123-first'><input id='t3123-last'></div>" ).dialog({ modal: true }),
		inputs = el.find( "input" ),
		widget = el.dialog( "widget" );

	function checkTab() {
		ok( $.contains( widget, document.activeElement ), "Tab key event moved focus within the modal" );

		// check shift tab
		$( document.activeElement ).simulate( "keydown", { keyCode: $.ui.keyCode.TAB, shiftKey: true });
		setTimeout( checkShiftTab, 2 );
	}

	function checkShiftTab() {
		ok( $.contains( widget, document.activeElement ), "Shift-Tab key event moved focus within the modal" );

		el.remove();
		start();
	}

	inputs.eq( 1 ).focus();
	equal( document.activeElement, inputs[1], "Focus set on second input" );
	inputs.eq( 1 ).simulate( "keydown", { keyCode: $.ui.keyCode.TAB });

	setTimeout( checkTab, 2 );
});

test("#4826: setting resizable false toggles resizable on dialog", function() {
	expect(6);
	var i;

	el = $('<div></div>').dialog({ resizable: false });
	shouldnotresize("[default]");
	for (i=0; i<2; i++) {
		el.dialog('close').dialog('open');
		shouldnotresize('initialized with resizable false toggle ('+ (i+1) +')');
	}
	el.remove();

	el = $('<div></div>').dialog({ resizable: true });
	shouldresize("[default]");
	for (i=0; i<2; i++) {
		el.dialog('close').dialog('option', 'resizable', false).dialog('open');
		shouldnotresize('set option resizable false toggle ('+ (i+1) +')');
	}
	el.remove();

});

test("#5184: isOpen in dialogclose event is true", function() {
	expect( 3 );

	el = $( "<div></div>" ).dialog({
		close: function() {
			ok( !el.dialog("isOpen"), "dialog is not open during close" );
		}
	});
	ok( el.dialog("isOpen"), "dialog is open after init" );
	el.dialog( "close" );
	ok( !el.dialog("isOpen"), "dialog is not open after close" );
	el.remove();
});

test("#5531: dialog width should be at least minWidth on creation", function () {
    el = $('<div></div>').dialog({
            width: 200,
            minWidth: 300
        });

    equal(el.dialog('option', 'width'), 300, "width is minWidth");
    el.dialog('option', 'width', 200);
    equal(el.dialog('option', 'width'), 300, "width unchanged when set to < minWidth");
    el.dialog('option', 'width', 320);
    equal(el.dialog('option', 'width'), 320, "width changed if set to > minWidth");
    el.remove();

    el = $('<div></div>').dialog({
            minWidth: 300
        });
    ok(el.dialog('option', 'width') >=  300, "width is at least 300");
    el.remove();

});

test("#6137: dialog('open') causes form elements to reset on IE7", function() {
	expect(2);

	d1 = $('<form><input type="radio" name="radio" id="a" value="a" checked="checked"></input>' +
				'<input type="radio" name="radio" id="b" value="b">b</input></form>').appendTo( "body" ).dialog({autoOpen: false});

	d1.find('#b').prop( "checked", true );
	equal($('input:checked').val(), 'b', "checkbox b is checked");

	d1.dialog('open');
	equal($('input:checked').val(), 'b', "checkbox b is checked");

	d1.remove();
});

test("#6645: Missing element not found check in overlay", function(){
    expect(2);
    d1 = $('<div title="dialog 1">Dialog 1</div>').dialog({modal: true});
    d2 = $('<div title="dialog 2">Dialog 2</div>').dialog({modal: true, close: function(){ d2.remove(); }});
    equal($.ui.dialog.overlay.instances.length, 2, 'two overlays created');
    d2.dialog('close');
    equal($.ui.dialog.overlay.instances.length, 1, 'one overlay remains after closing the 2nd overlay');
    d1.add(d2).remove();
});

test("#6966: Escape key closes all dialogs, not the top one", function(){
	expect(24);
    // test with close function removing dialog triggered through the overlay
    d1 = $('<div title="dialog 1">Dialog 1</div>').dialog({modal: true, close: function(){ d1.remove(); }});
    d2 = $('<div title="dialog 2">Dialog 2</div>').dialog({modal: true, close: function(){ d2.remove(); }});

    ok(d1.data('dialog') && d1.dialog('isOpen'), 'first dialog is open');
    ok(d2.data('dialog') && d2.dialog('isOpen'), 'second dialog is open');
    
    $( document ).simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
    ok(d1.data('dialog') && d1.dialog('isOpen'), 'first dialog still open');
    ok(!d2.data('dialog'), 'second dialog is closed');

    $( document ).simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
    ok(!d1.data('dialog'), 'first dialog is closed');
    ok(!d2.data('dialog'), 'second dialog is closed');

    d2.remove();
    d1.remove();
    
	// test with close function removing dialog triggered through the dialog
    d1 = $('<div title="dialog 1">Dialog 1</div>').dialog({modal: true, close: function(){ d1.remove(); }});
    d2 = $('<div title="dialog 2">Dialog 2</div>').dialog({modal: true, close: function(){ d2.remove(); }});

    ok(d1.data('dialog') && d1.dialog('isOpen'), 'first dialog is open');
    ok(d2.data('dialog') && d2.dialog('isOpen'), 'second dialog is open');
    
    d2.simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
    ok(d1.data('dialog') && d1.dialog('isOpen'), 'first dialog still open');
    ok(!d2.data('dialog'), 'second dialog is closed');

    d1.simulate('keydown', {keyCode: $.ui.keyCode.ESCAPE});
    ok(!d1.data('dialog'), 'first dialog is closed');
    ok(!d2.data('dialog'), 'second dialog is closed');

    d2.remove();
    d1.remove();

    // test without close function removing dialog
    d1 = $('<div title="dialog 1">Dialog 1</div>').dialog({modal: true});
    d2 = $('<div title="dialog 2">Dialog 2</div>').dialog({modal: true});

    ok(d1.dialog("isOpen"), 'first dialog is open');
    ok(d2.dialog("isOpen"), 'second dialog is open');

    d2.simulate("keydown", {keyCode: $.ui.keyCode.ESCAPE});
    ok(d1.dialog("isOpen"), 'first dialog still open');
    ok(!d2.dialog("isOpen"), 'second dialog is closed');

    d1.simulate("keydown", {keyCode: $.ui.keyCode.ESCAPE});
    ok(!d1.dialog("isOpen"), 'first dialog is closed');
    ok(!d2.dialog("isOpen"), 'second dialog is closed');

    d2.remove();
    d1.remove();

    // test without close function removing dialog triggered through the overlay
    d1 = $('<div title="dialog 1">Dialog 1</div>').dialog({modal: true});
    d2 = $('<div title="dialog 2">Dialog 2</div>').dialog({modal: true});

    ok(d1.dialog("isOpen"), 'first dialog is open');
    ok(d2.dialog("isOpen"), 'second dialog is open');

    $( document ).simulate("keydown", {keyCode: $.ui.keyCode.ESCAPE});
    ok(d1.dialog("isOpen"), 'first dialog still open');
    ok(!d2.dialog("isOpen"), 'second dialog is closed');

    $( document ).simulate("keydown", {keyCode: $.ui.keyCode.ESCAPE});
    ok(!d1.dialog("isOpen"), 'first dialog is closed');
    ok(!d2.dialog("isOpen"), 'second dialog is closed');

    d2.remove();
    d1.remove();
});

test("#4980: Destroy should place element back in original DOM position", function(){
    container = $('<div id="container"><div id="modal">Content</div></div>');
	modal = container.find('#modal');
	modal.dialog();
	ok(!$.contains(container[0], modal[0]), 'dialog should move modal element to outside container element');
	modal.dialog('destroy');
	ok($.contains(container[0], modal[0]), 'dialog(destroy) should place element back in original DOM position');
});

})(jQuery);
