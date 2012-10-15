/*
 * sortable_tickets.js
 */
(function($) {

var el, offsetBefore, offsetAfter, dragged;

function drag(handle, dx, dy) {
	offsetBefore = $(handle).offset();
	$(handle).simulate("drag", {
		dx: dx || 0,
		dy: dy || 0
	});
	dragged = { dx: dx, dy: dy };
	offsetAfter = $(handle).offset();
}

function sort(handle, dx, dy, index, msg) {
	drag(handle, dx, dy);
	equal($(handle).parent().children().index(handle), index, msg);
}

module("sortable: tickets");

test("#3019: Stop fires too early", function() {

	var helper = null;
	el = $("#sortable").sortable({
		stop: function(event, ui) {
			helper = ui.helper;
		}
	});

	sort($("li", el)[0], 0, 40, 2, 'Dragging the sortable');
	equal(helper, null, "helper should be false");

});

test('#4752: link event firing on sortable with connect list', function () {
    var fired = {},
        hasFired = function (type) { return (type in fired) && (true === fired[type]); };

    $('#sortable').clone().attr('id', 'sortable2').insertAfter('#sortable');

    $('#main ul').sortable({
        connectWith: '#main ul',
        change: function (e, ui) {
            fired.change = true;
        },
        receive: function (e, ui) {
            fired.receive = true;
        },
        remove: function (e, ui) {
            fired.remove = true;
        }
    });

    $('#main ul li').live('click.ui-sortable-test', function () {
        fired.click = true;
    });

    $('#sortable li:eq(0)').simulate('click');
    ok(!hasFired('change'), 'Click only, change event should not have fired');
    ok(hasFired('click'), 'Click event should have fired');

    // Drag an item within the first list
    fired = {};
    $('#sortable li:eq(0)').simulate('drag', { dx: 0, dy: 40 });
    ok(hasFired('change'), '40px drag, change event should have fired');
    ok(!hasFired('receive'), 'Receive event should not have fired');
    ok(!hasFired('remove'), 'Remove event should not have fired');
    ok(!hasFired('click'), 'Click event should not have fired');

    // Drag an item from the first list to the second, connected list
    fired = {};
    $('#sortable li:eq(0)').simulate('drag', { dx: 0, dy: 150 });
    ok(hasFired('change'), '150px drag, change event should have fired');
    ok(hasFired('receive'), 'Receive event should have fired');
    ok(hasFired('remove'), 'Remove event should have fired');
    ok(!hasFired('click'), 'Click event should not have fired');
});

})(jQuery);
