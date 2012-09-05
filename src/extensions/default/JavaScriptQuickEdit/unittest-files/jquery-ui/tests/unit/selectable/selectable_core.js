/*
 * selectable_core.js
 */

var el;

var drag = function(dx, dy) {
	var off = el.offset(), pos = { clientX: off.left, clientY: off.top };
	el.simulate("mousedown", pos);
	$(document).simulate("mousemove", pos);
	pos.clientX += dx;
	pos.clientY += dy;
	$(document).simulate("mousemove", pos);
	$(document).simulate("mouseup", pos);
};

