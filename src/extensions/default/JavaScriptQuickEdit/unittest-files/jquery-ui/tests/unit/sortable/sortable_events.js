/*
 * sortable_events.js
 */
(function($) {

module("sortable: events");

test("start", function() {

	var hash;
	$("#sortable")
		.sortable({ start: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 10 });

	ok(hash, 'start event triggered');
	ok(hash.helper, 'UI hash includes: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');


});

test("sort", function() {

	var hash;
	$("#sortable")
		.sortable({ sort: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 10 });

	ok(hash, 'sort event triggered');
	ok(hash.helper, 'UI hash includes: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');

});

test("change", function() {

	var hash;
	$("#sortable")
		.sortable({ change: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 1, dy: 1 });

	ok(!hash, '1px drag, change event should not be triggered');

	$("#sortable")
		.sortable({ change: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 20 });

	ok(hash, 'change event triggered');
	ok(hash.helper, 'UI hash includes: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');

});

test("beforeStop", function() {

	var hash;
	$("#sortable")
		.sortable({ beforeStop: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 20 });

	ok(hash, 'beforeStop event triggered');
	ok(hash.helper, 'UI hash includes: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');

});

test("stop", function() {

	var hash;
	$("#sortable")
		.sortable({ stop: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 20 });

	ok(hash, 'stop event triggered');
	ok(!hash.helper, 'UI should not include: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');

});

test("update", function() {

	var hash;
	$("#sortable")
		.sortable({ update: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 1, dy: 1 });

	ok(!hash, '1px drag, update event should not be triggered');

	$("#sortable")
		.sortable({ update: function(e, ui) { hash = ui; } })
		.find('li:eq(0)').simulate("drag", { dx: 0, dy: 20 });

	ok(hash, 'update event triggered');
	ok(!hash.helper, 'UI hash should not include: helper');
	ok(hash.placeholder, 'UI hash includes: placeholder');
	ok(hash.position && (hash.position.top && hash.position.left), 'UI hash includes: position');
	ok(hash.offset && (hash.offset.top && hash.offset.left), 'UI hash includes: offset');
	ok(hash.item, 'UI hash includes: item');
	ok(!hash.sender, 'UI hash does not include: sender');

});

test("receive", function() {
	ok(false, "missing test - untested code is broken code.");
});

test("remove", function() {
	ok(false, "missing test - untested code is broken code.");
});

test("over", function() {
	ok(false, "missing test - untested code is broken code.");
});

test("out", function() {
	ok(false, "missing test - untested code is broken code.");
});

test("activate", function() {
	ok(false, "missing test - untested code is broken code.");
});

test("deactivate", function() {
	ok(false, "missing test - untested code is broken code.");
});

})(jQuery);
