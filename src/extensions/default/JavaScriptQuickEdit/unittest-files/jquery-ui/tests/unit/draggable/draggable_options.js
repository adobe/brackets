/*
 * draggable_options.js
 */
(function($) {

function testScroll(position) {
	$("#main").css('position', position);
	drag(el, 50, 50);
	moved(50, 50, position+' parent');
}

function setScroll(what) {
	if(what) {
		$(document).scrollTop(100); $(document).scrollLeft(100);
	} else {
		$("#main")[0].scrollTop = 100; $("#main")[0].scrollLeft = 100;
	}
}

function border(el, side) {
	return parseInt(el.css('border-' + side + '-width'), 10);
}
function margin(el, side) {
	return parseInt(el.css('margin-' + side), 10);
}

module("draggable: options");

test("{ addClasses: true }, default", function() {
	el = $("<div></div>").draggable({ addClasses: true });
	ok(el.is(".ui-draggable"), "'ui-draggable' class added");

	el.draggable("destroy");
});

test("{ addClasses: false }", function() {
	el = $("<div></div>").draggable({ addClasses: false });
	ok(!el.is(".ui-draggable"), "'ui-draggable' class not added");

	el.draggable("destroy");
});

test("{ appendTo: 'parent' }, default", function() {
	el = $("#draggable2").draggable({ appendTo: 'parent' });
	drag(el, 50, 50);
	moved(50, 50);

	el = $("#draggable1").draggable({ appendTo: 'parent' });
	drag(el, 50, 50);
	moved(50, 50);

});

test("{ appendTo: Element }", function() {
	el = $("#draggable2").draggable({ appendTo: $("#draggable2").parent()[0] });
	drag(el, 50, 50);
	moved(50, 50);

	el = $("#draggable1").draggable({ appendTo: $("#draggable2").parent()[0] });
	drag(el, 50, 50);
	moved(50, 50);
});

test("{ appendTo: Selector }", function() {
	el = $("#draggable2").draggable({ appendTo: "#main" });
	drag(el, 50, 50);
	moved(50, 50);

	el = $("#draggable1").draggable({ appendTo: "#main" });
	drag(el, 50, 50);
	moved(50, 50);
});

test("{ axis: false }, default", function() {
	el = $("#draggable2").draggable({ axis: false });
	drag(el, 50, 50);
	moved(50, 50);
});

test("{ axis: 'x' }", function() {
	el = $("#draggable2").draggable({ axis: "x" });
	drag(el, 50, 50);
	moved(50, 0);
});

test("{ axis: 'y' }", function() {
	el = $("#draggable2").draggable({ axis: "y" });
	drag(el, 50, 50);
	moved(0, 50);
});

test("{ axis: ? }, unexpected", function() {
	var unexpected = {
		"true": true,
		"{}": {},
		"[]": [],
		"null": null,
		"undefined": undefined,
		"function() {}": function() {}
	};
	$.each(unexpected, function(key, val) {
		el = $("#draggable2").draggable({ axis: val });
		drag(el, 50, 50);
		moved(50, 50, "axis: " + key);
		el.draggable("destroy");
	});
});

test("{ cancel: 'input,textarea,button,select,option' }, default", function() {
	$('<div id="draggable-option-cancel-default"><input type="text"></div>').appendTo('#main');

	el = $("#draggable-option-cancel-default").draggable({ cancel: "input,textarea,button,select,option" });
	drag("#draggable-option-cancel-default", 50, 50);
	moved(50, 50);

	el = $("#draggable-option-cancel-default").draggable({ cancel: "input,textarea,button,select,option" });
	drag("#draggable-option-cancel-default input", 50, 50);
	moved(0, 0);

	el.draggable("destroy");
});

test("{ cancel: 'span' }", function() {
	el = $("#draggable2").draggable();
	drag("#draggable2 span", 50, 50);
	moved(50, 50);

	el.draggable("destroy");

	el = $("#draggable2").draggable({ cancel: 'span' });
	drag("#draggable2 span", 50, 50);
	moved(0, 0);
});

test("{ cancel: ? }, unexpected", function() {
	var unexpected = {
		"true": true,
		"false": false,
		"{}": {},
		"[]": [],
		"null": null,
		"undefined": undefined,
		"function() {return '';}": function() {return '';},
		"function() {return true;}": function() {return true;},
		"function() {return false;}": function() {return false;}
	};
	$.each(unexpected, function(key, val) {
		el = $("#draggable2").draggable({ cancel: val });
		drag(el, 50, 50);
		var expected = [50, 50];
		moved(expected[0], expected[1], "cancel: " + key);
		el.draggable("destroy");
	});
});

test("{ containment: false }, default", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ containment: Element }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ containment: 'parent' }, relative", function() {
	el = $("#draggable1").draggable({ containment: 'parent' });
	var p = el.parent(),
		po = p.offset(),
		expected = {
			left: po.left + border(p, 'left') + margin(el, 'left'),
			top: po.top + border(p, 'top') + margin(el, 'top')
		};
	drag(el, -100, -100);
	deepEqual(offsetAfter, expected, 'compare offset to parent');
});

test("{ containment: 'parent' }, absolute", function() {
	el = $("#draggable2").draggable({ containment: 'parent' });
	var p = el.parent(),
		po = p.offset(),
		expected = {
			left: po.left + border(p, 'left') + margin(el, 'left'),
			top: po.top + border(p, 'top') + margin(el, 'top')
		};
	drag(el, -100, -100);
	deepEqual(offsetAfter, expected, 'compare offset to parent');
});

test("{ containment: 'document' }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ containment: 'window' }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ containment: Selector }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ containment: [x1, y1, x2, y2] }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ cursor: 'auto' }, default", function() {
	function getCursor() { return $("#draggable2").css("cursor"); }

	expect(2);

	var expected = "auto", actual, before, after;

	el = $("#draggable2").draggable({
		cursor: expected,
		start: function(event, ui) {
			actual = getCursor();
		}
	});

	before = getCursor();
	drag("#draggable2", -1, -1);
	after = getCursor();

	equal(actual, expected, "start callback: cursor '" + expected + "'");
	equal(after, before, "after drag: cursor restored");

});

test("{ cursor: 'move' }", function() {

	function getCursor() { return $("body").css("cursor"); }

	expect(2);

	var expected = "move", actual, before, after;

	el = $("#draggable2").draggable({
		cursor: expected,
		start: function(event, ui) {
			actual = getCursor();
		}
	});

	before = getCursor();
	drag("#draggable2", -1, -1);
	after = getCursor();

	equal(actual, expected, "start callback: cursor '" + expected + "'");
	equal(after, before, "after drag: cursor restored");

});

test("{ cursorAt: false}, default", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ cursorAt: { left: -5, top: -5 } }", function() {
	expect(4);

	var deltaX = -3, deltaY = -3,
		offsetX = 5, offsetY = 5,
		cursorAtX = -5, cursorAtY = -5;

	$.each(['relative', 'absolute'], function(i, position) {
		var el = $('#draggable' + (i + 1)).draggable({
				cursorAt: { left: cursorAtX, top: cursorAtY },
				drag: function(event, ui) {
					equal(ui.offset.left, expected.left, position + ' left');
					equal(ui.offset.top, expected.top, position + ' top');
				}
			}),
			before = el.offset(),
			pos = {
				clientX: before.left + offsetX,
				clientY: before.top + offsetY
			},
			expected = {
				left: before.left + offsetX - cursorAtX + deltaX,
				top: before.top + offsetY - cursorAtY + deltaY
			};

		el.simulate("mousedown", pos);
		pos.clientX += deltaX;
		pos.clientY += deltaY;
		$(document).simulate("mousemove", pos);
		el.simulate("mouseup", pos);
	});
});

test("{ cursorAt: { right: 10, bottom: 20 } }", function() {
	expect(4);

	var deltaX = -3, deltaY = -3,
		offsetX = 5, offsetY = 5,
		cursorAtX = 10, cursorAtY = 20;

	$.each(['relative', 'absolute'], function(i, position) {
		var el = $('#draggable' + (i + 1)).draggable({
				cursorAt: { right: cursorAtX, bottom: cursorAtY },
				drag: function(event, ui) {
					equal(ui.offset.left, expected.left, position + ' left');
					equal(ui.offset.top, expected.top, position + ' top');
				}
			}),
			before = el.offset(),
			pos = {
				clientX: before.left + offsetX,
				clientY: before.top + offsetY
			},
			expected = {
				left: before.left + offsetX - el.width() + cursorAtX + deltaX,
				top: before.top + offsetY - el.height() + cursorAtY + deltaY
			};

		el.simulate("mousedown", pos);
		pos.clientX += deltaX;
		pos.clientY += deltaY;
		$(document).simulate("mousemove", pos);
		el.simulate("mouseup", pos);
	});
});

test("{ cursorAt: [10, 20] }", function() {
	expect(4);

	var deltaX = -3, deltaY = -3,
		offsetX = 5, offsetY = 5,
		cursorAtX = 10, cursorAtY = 20;

	$.each(['relative', 'absolute'], function(i, position) {
		var el = $('#draggable' + (i + 1)).draggable({
				cursorAt: { left: cursorAtX, top: cursorAtY },
				drag: function(event, ui) {
					equal(ui.offset.left, expected.left, position + ' left');
					equal(ui.offset.top, expected.top, position + ' top');
				}
			}),
			before = el.offset(),
			pos = {
				clientX: before.left + offsetX,
				clientY: before.top + offsetY
			},
			expected = {
				left: before.left + offsetX - cursorAtX + deltaX,
				top: before.top + offsetY - cursorAtY + deltaY
			};

		el.simulate("mousedown", pos);
		pos.clientX += deltaX;
		pos.clientY += deltaY;
		$(document).simulate("mousemove", pos);
		el.simulate("mouseup", pos);
	});
});

test("{ cursorAt: '20, 40' }", function() {
	expect(4);

	var deltaX = -3, deltaY = -3,
		offsetX = 5, offsetY = 5,
		cursorAtX = 20, cursorAtY = 40;

	$.each(['relative', 'absolute'], function(i, position) {
		var el = $('#draggable' + (i + 1)).draggable({
				cursorAt: { left: cursorAtX, top: cursorAtY },
				drag: function(event, ui) {
					equal(ui.offset.left, expected.left, position + ' left');
					equal(ui.offset.top, expected.top, position + ' top');
				}
			}),
			before = el.offset(),
			pos = {
				clientX: before.left + offsetX,
				clientY: before.top + offsetY
			},
			expected = {
				left: before.left + offsetX - cursorAtX + deltaX,
				top: before.top + offsetY - cursorAtY + deltaY
			};

		el.simulate("mousedown", pos);
		pos.clientX += deltaX;
		pos.clientY += deltaY;
		$(document).simulate("mousemove", pos);
		el.simulate("mouseup", pos);
	});
});

test("{ distance: 10 }", function() {

	el = $("#draggable2").draggable({ distance: 10 });
	drag(el, -9, -9);
	moved(0, 0, 'distance not met');

	drag(el, -10, -10);
	moved(-10, -10, 'distance met');

	drag(el, 9, 9);
	moved(0, 0, 'distance not met');

});

test("{ grid: [50, 50] }, relative", function() {
	el = $("#draggable1").draggable({ grid: [50, 50] });
	drag(el, 24, 24);
	moved(0, 0);
	drag(el, 26, 25);
	moved(50, 50);
});

test("{ grid: [50, 50] }, absolute", function() {
	el = $("#draggable2").draggable({ grid: [50, 50] });
	drag(el, 24, 24);
	moved(0, 0);
	drag(el, 26, 25);
	moved(50, 50);
});

test("{ handle: 'span' }", function() {
	el = $("#draggable2").draggable({ handle: 'span' });

	drag("#draggable2 span", 50, 50);
	moved(50, 50, "drag span");

	drag("#draggable2", 50, 50);
	moved(0, 0, "drag element");
});

test("{ helper: 'clone' }, relative", function() {
	el = $("#draggable1").draggable({ helper: "clone" });
	drag(el, 50, 50);
	moved(0, 0);
});

test("{ helper: 'clone' }, absolute", function() {
	el = $("#draggable2").draggable({ helper: "clone" });
	drag(el, 50, 50);
	moved(0, 0);
});

test("{ helper: 'original' }, relative, with scroll offset on parent", function() {

	el = $("#draggable1").draggable({ helper: "original" });

	setScroll();
	testScroll('relative');

	setScroll();
	testScroll('static');

	setScroll();
	testScroll('absolute');

	restoreScroll();

});

test("{ helper: 'original' }, relative, with scroll offset on root", function() {

	el = $("#draggable1").draggable({ helper: "original" });

	setScroll('root');
	testScroll('relative');

	setScroll('root');
	testScroll('static');

	setScroll('root');
	testScroll('absolute');

	restoreScroll('root');

});

test("{ helper: 'original' }, relative, with scroll offset on root and parent", function() {

	el = $("#draggable1").draggable({ helper: "original" });

	setScroll();
	setScroll('root');
	testScroll('relative');

	setScroll();
	setScroll('root');
	testScroll('static');

	setScroll();
	setScroll('root');
	testScroll('absolute');

	restoreScroll();
	restoreScroll('root');

});

test("{ helper: 'original' }, absolute, with scroll offset on parent", function() {

	el = $("#draggable1").css({ position: 'absolute', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll();
	testScroll('relative');

	setScroll();
	testScroll('static');

	setScroll();
	testScroll('absolute');

	restoreScroll();

});

test("{ helper: 'original' }, absolute, with scroll offset on root", function() {

	el = $("#draggable1").css({ position: 'absolute', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll('root');
	testScroll('relative');

	setScroll('root');
	testScroll('static');

	setScroll('root');
	testScroll('absolute');

	restoreScroll('root');

});

test("{ helper: 'original' }, absolute, with scroll offset on root and parent", function() {

	el = $("#draggable1").css({ position: 'absolute', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll();
	setScroll('root');
	testScroll('relative');

	setScroll();
	setScroll('root');
	testScroll('static');

	setScroll();
	setScroll('root');
	testScroll('absolute');

	restoreScroll();
	restoreScroll('root');

});

test("{ helper: 'original' }, fixed, with scroll offset on parent", function() {

	el = $("#draggable1").css({ position: 'fixed', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll();
	testScroll('relative');

	setScroll();
	testScroll('static');

	setScroll();
	testScroll('absolute');

	restoreScroll();

});

test("{ helper: 'original' }, fixed, with scroll offset on root", function() {

	el = $("#draggable1").css({ position: 'fixed', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll('root');
	testScroll('relative');

	setScroll('root');
	testScroll('static');

	setScroll('root');
	testScroll('absolute');

	restoreScroll('root');
});

test("{ helper: 'original' }, fixed, with scroll offset on root and parent", function() {

	el = $("#draggable1").css({ position: 'fixed', top: 0, left: 0 }).draggable({ helper: "original" });

	setScroll();
	setScroll('root');
	testScroll('relative');

	setScroll();
	setScroll('root');
	testScroll('static');

	setScroll();
	setScroll('root');
	testScroll('absolute');

	restoreScroll();
	restoreScroll('root');

});

test("{ helper: 'clone' }, absolute", function() {

	var helperOffset = null,
		origOffset = $("#draggable1").offset();

	el = $("#draggable1").draggable({ helper: "clone", drag: function(event, ui) {
		helperOffset = ui.helper.offset();
	} });

	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

});

test("{ helper: 'clone' }, absolute with scroll offset on parent", function() {

	setScroll();
	var helperOffset = null,
	origOffset = null;

	el = $("#draggable1").draggable({ helper: "clone", drag: function(event, ui) {
		helperOffset = ui.helper.offset();
	} });

	$("#main").css('position', 'relative');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'static');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'absolute');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	restoreScroll();

});

test("{ helper: 'clone' }, absolute with scroll offset on root", function() {

	setScroll('root');
	var helperOffset = null,
		origOffset = null;

	el = $("#draggable1").draggable({ helper: "clone", drag: function(event, ui) {
		helperOffset = ui.helper.offset();
	} });

	$("#main").css('position', 'relative');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'static');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'absolute');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	restoreScroll('root');

});

test("{ helper: 'clone' }, absolute with scroll offset on root and parent", function() {

	setScroll('root');
	setScroll();
	var helperOffset = null,
		origOffset = null;

	el = $("#draggable1").draggable({ helper: "clone", drag: function(event, ui) {
		helperOffset = ui.helper.offset();
	} });

	$("#main").css('position', 'relative');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'static');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	$("#main").css('position', 'absolute');
	origOffset = $("#draggable1").offset();
	drag(el, 1, 1);
	deepEqual({ top: helperOffset.top-1, left: helperOffset.left-1 }, origOffset, 'dragged[' + dragged.dx + ', ' + dragged.dy + '] ');

	restoreScroll('root');
	restoreScroll();

});

test("{ opacity: 0.5 }", function() {

	expect(1);

	var opacity = null;
	el = $("#draggable2").draggable({
		opacity: 0.5,
		start: function(event, ui) {
			opacity = $(this).css("opacity");
		}
	});

	drag("#draggable2", -1, -1);

	equal(opacity, 0.5, "start callback: opacity is");

});

test("{ zIndex: 10 }", function() {

	expect(1);

	var actual,
		expected = 10,
		zIndex = null;
	el = $("#draggable2").draggable({
		zIndex: expected,
		start: function(event, ui) {
			actual = $(this).css("zIndex");
		}
	});

	drag("#draggable2", -1, -1);

	equal(actual, expected, "start callback: zIndex is");

});

})(jQuery);
