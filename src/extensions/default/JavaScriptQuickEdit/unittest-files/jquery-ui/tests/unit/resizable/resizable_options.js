/*
 * resizable_options.js
 */
(function($) {

module("resizable: options");

test("aspectRatio: 'preserve' (e)", function() {
	expect(4);

	var handle = '.ui-resizable-e', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, 80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, -130);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (w)", function() {
	expect(4);

	var handle = '.ui-resizable-w', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, -80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, 130);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (n)", function() {
	expect(4);

	var handle = '.ui-resizable-n', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, 0, -80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, 0, 80);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (s)", function() {
	expect(4);

	var handle = '.ui-resizable-s', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, 0, 80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, 0, -80);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (se)", function() {
	expect(4);

	var handle = '.ui-resizable-se', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, 80, 80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, -80, -80);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (sw)", function() {
	expect(4);

	var handle = '.ui-resizable-sw', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, -80, 80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, 80, -80);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("aspectRatio: 'preserve' (ne)", function() {
	expect(4);

	var handle = '.ui-resizable-ne', target = $('#resizable1').resizable({ aspectRatio: 'preserve', handles: 'all', minWidth: 70, minHeight: 50, maxWidth: 150, maxHeight: 130 });

	drag(handle, 80, -80);
	equal( target.width(), 130, "compare maxWidth");
	equal( target.height(), 130, "compare maxHeight");

	drag(handle, -80, 80);
	equal( target.width(), 70, "compare minWidth");
	equal( target.height(), 70, "compare minHeight");
});

test("grid", function() {
	expect(4);

	var handle = '.ui-resizable-se', target = $('#resizable1').resizable({ handles: 'all', grid: [0, 20] });

	drag(handle, 3, 9);
	equal( target.width(), 103, "compare width");
	equal( target.height(), 100, "compare height");

	drag(handle, 15, 11);
	equal( target.width(), 118, "compare width");
	equal( target.height(), 120, "compare height");
});

test("grid (wrapped)", function() {
	expect(4);

	var handle = '.ui-resizable-se', target = $('#resizable2').resizable({ handles: 'all', grid: [0, 20] });

	drag(handle, 3, 9);
	equal( target.width(), 103, "compare width");
	equal( target.height(), 100, "compare height");

	drag(handle, 15, 11);
	equal( target.width(), 118, "compare width");
	equal( target.height(), 120, "compare height");
});

test("ui-resizable-se { handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 }", function() {
	expect(4);

	var handle = '.ui-resizable-se', target = $('#resizable1').resizable({ handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 });

	drag(handle, -50, -50);
	equal( target.width(), 60, "compare minWidth" );
	equal( target.height(), 60, "compare minHeight" );

	drag(handle, 70, 70);
	equal( target.width(), 100, "compare maxWidth" );
	equal( target.height(), 100, "compare maxHeight" );
});

test("ui-resizable-sw { handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 }", function() {
	expect(4);

	var handle = '.ui-resizable-sw', target = $('#resizable1').resizable({ handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 });

	drag(handle, 50, -50);
	equal( target.width(), 60, "compare minWidth" );
	equal( target.height(), 60, "compare minHeight" );

	drag(handle, -70, 70);
	equal( target.width(), 100, "compare maxWidth" );
	equal( target.height(), 100, "compare maxHeight" );
});

test("ui-resizable-ne { handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 }", function() {
	expect(4);

	var handle = '.ui-resizable-ne', target = $('#resizable1').resizable({ handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 });

	drag(handle, -50, 50);
	equal( target.width(), 60, "compare minWidth" );
	equal( target.height(), 60, "compare minHeight" );

	drag(handle, 70, -70);
	equal( target.width(), 100, "compare maxWidth" );
	equal( target.height(), 100, "compare maxHeight" );
});

test("ui-resizable-nw { handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 }", function() {
	expect(4);

	var handle = '.ui-resizable-nw', target = $('#resizable1').resizable({ handles: 'all', minWidth: 60, minHeight: 60, maxWidth: 100, maxHeight: 100 });

	drag(handle, 70, 70);
	equal( target.width(), 60, "compare minWidth" );
	equal( target.height(), 60, "compare minHeight" );

	drag(handle, -70, -70);
	equal( target.width(), 100, "compare maxWidth" );
	equal( target.height(), 100, "compare maxHeight" );
});

test("zIndex, applied to all handles", function() {
	expect(8);

	var target = $('<div></div>').resizable({ handles: 'all', zIndex: 100 });
	target.children( '.ui-resizable-handle' ).each( function( index, handle ) {
		equal( $( handle ).css( 'zIndex' ), 100, 'compare zIndex' );
	});
});

})(jQuery);
