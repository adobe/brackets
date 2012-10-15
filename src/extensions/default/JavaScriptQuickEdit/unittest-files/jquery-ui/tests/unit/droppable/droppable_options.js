/*
 * droppable_options.js
 */
(function($) {

module("droppable: options");

test("{ accept '*' }, default ", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ accept: Selector }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ accept: function(draggable) }", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("activeClass", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("{ addClasses: true }, default", function() {
	el = $("<div></div>").droppable({ addClasses: true });
	ok(el.is(".ui-droppable"), "'ui-droppable' class added");
	el.droppable("destroy");
});

test("{ addClasses: false }", function() {
	el = $("<div></div>").droppable({ addClasses: false });
	ok(!el.is(".ui-droppable"), "'ui-droppable' class not added");
	el.droppable("destroy");
});

test("greedy", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("hoverClass", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("scope", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("tolerance, fit", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("tolerance, intersect", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("tolerance, pointer", function() {
	ok(false, 'missing test - untested code is broken code');
});

test("tolerance, touch", function() {
	ok(false, 'missing test - untested code is broken code');
});

})(jQuery);
