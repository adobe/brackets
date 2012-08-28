/*
 * draggable_events.js
 */
(function($) {

module("draggable: events");

test("callbacks occurrence count", function() {

	expect(3);

	var start = 0, stop = 0, dragc = 0;
	el = $("#draggable2").draggable({
		start: function() { start++; },
		drag: function() { dragc++; },
		stop: function() { stop++; }
	});

	drag(el, 10, 10);

	equal(start, 1, "start callback should happen exactly once");
	equal(dragc, 3, "drag callback should happen exactly once per mousemove");
	equal(stop, 1, "stop callback should happen exactly once");

});

test("stopping the start callback", function() {

	expect(3);

	var start = 0, stop = 0, dragc = 0;
	el = $("#draggable2").draggable({
		start: function() { start++; return false; },
		drag: function() { dragc++; },
		stop: function() { stop++; }
	});

	drag(el, 10, 10);

	equal(start, 1, "start callback should happen exactly once");
	equal(dragc, 0, "drag callback should not happen at all");
	equal(stop, 0, "stop callback should not happen if there wasnt even a start");

});

test("stopping the drag callback", function() {

	expect(3);

	var start = 0, stop = 0, dragc = 0;
	el = $("#draggable2").draggable({
		start: function() { start++;},
		drag: function() { dragc++; return false;  },
		stop: function() { stop++; }
	});

	drag(el, 10, 10);

	equal(start, 1, "start callback should happen exactly once");
	equal(dragc, 1, "drag callback should happen exactly once");
	equal(stop, 1, "stop callback should happen, as we need to actively stop the drag");

});

test("stopping the stop callback", function() {

	expect(1);

	el = $("#draggable2").draggable({
		helper: 'clone',
		stop: function() { return false; }
	});

	drag(el, 10, 10);

	ok($("#draggable2").data('draggable').helper, "the clone should not be deleted if the stop callback is stopped");


});

})(jQuery);
