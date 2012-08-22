/*
 * draggable_core.js
 */

var el, offsetBefore, offsetAfter, dragged;

function drag(handle, dx, dy) {
	var element = el.data("draggable").element;
	offsetBefore = el.offset();
	$(handle).simulate("drag", {
		dx: dx || 0,
		dy: dy || 0
	});
	dragged = { dx: dx, dy: dy };
	offsetAfter = el.offset();
}

function moved(dx, dy, msg) {
	msg = msg ? msg + "." : "";
	var actual = { left: offsetAfter.left, top: offsetAfter.top },
		expected = { left: offsetBefore.left + dx, top: offsetBefore.top + dy };
	deepEqual(actual, expected, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ' + msg);
}

function restoreScroll(what) {
	if(what) {
		$(document).scrollTop(0); $(document).scrollLeft(0);
	} else {
		$("#main")[0].scrollTop = 0; $("#main")[0].scrollLeft = 0;
	}
}

(function($) {

module("draggable");

test("element types", function() {
	var typeNames = ('p,h1,h2,h3,h4,h5,h6,blockquote,ol,ul,dl,div,form' +
		',table,fieldset,address,ins,del,em,strong,q,cite,dfn,abbr' +
		',acronym,code,samp,kbd,var,img,object,hr' +
		',input,button,label,select,iframe').split(',');

	$.each(typeNames, function(i) {
		var typeName = typeNames[i];
		el = $(document.createElement(typeName)).appendTo('body');
		(typeName === 'table' && el.append("<tr><td>content</td></tr>"));
		el.draggable({ cancel: '' });
		drag(el, 50, 50);
		moved(50, 50, "&lt;" + typeName + "&gt;");
		el.draggable("destroy");
		el.remove();
	});
});

test("No options, relative", function() {
	el = $("#draggable1").draggable();
	drag(el, 50, 50);
	moved(50, 50);
});

test("No options, absolute", function() {
	el = $("#draggable2").draggable();
	drag(el, 50, 50);
	moved(50, 50);
});

})(jQuery);
