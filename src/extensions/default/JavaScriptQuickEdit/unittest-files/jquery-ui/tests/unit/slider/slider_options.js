/*
 * slider_options.js
 */
(function($) {

var el, options;

function handle() {
	return el.find(".ui-slider-handle");
}

module("slider: options");

test("max", function() {
	el = $('<div></div>');

	options = {
		max: 37,
		min: 6,
		orientation: 'horizontal',
		step: 1,
		value: 50
	};

	el.slider(options);
	ok(el.slider("option", "value") === options.value, "value option is not contained by max");
	ok(el.slider("value") === options.max, "value method is contained by max");
	el.slider('destroy');

});

test("min", function() {
	el = $('<div></div>');

	options = {
		max: 37,
		min: 6,
		orientation: 'vertical',
		step: 1,
		value: 2
	};

	el.slider(options);
	ok(el.slider("option", "value") === options.value, "value option is not contained by min");
	ok(el.slider("value") === options.min, "value method is contained by min");
	el.slider('destroy');

});

test("orientation", function() {
	el = $('<div></div>');

	options = {
		max: 2,
		min: -2,
		orientation: 'vertical',
		value: 1
	};

	var percentVal = (options.value - options.min) / (options.max - options.min) * 100;

	el.slider(options).slider("option", "orientation", "horizontal");
	ok(el.is('.ui-slider-horizontal'), "horizontal slider has class .ui-slider-horizontal");
	ok(!el.is('.ui-slider-vertical'), "horizontal slider does not have class .ui-slider-vertical");
	equal(handle().css('left'), percentVal + '%', "horizontal slider handle is positioned with left: %");

	el.slider('destroy');

	options = {
		max: 2,
		min: -2,
		orientation: 'horizontal',
		value: -1
	};

	percentVal = (options.value - options.min) / (options.max - options.min) * 100;

	el.slider(options).slider("option", "orientation", "vertical");
	ok(el.is('.ui-slider-vertical'), "vertical slider has class .ui-slider-vertical");
	ok(!el.is('.ui-slider-horizontal'), "vertical slider does not have class .ui-slider-horizontal");
	equal(handle().css('bottom'), percentVal + '%', "vertical slider handle is positioned with bottom: %");

	el.slider('destroy');

});

//test("range", function() {
//	ok(false, "missing test - untested code is broken code.");
//});

//spec: http://wiki.jqueryui.com/Slider#specs
// value option/method: the value option is not restricted by min/max/step.
// What is returned by the value method is restricted by min (>=), max (<=), and step (even multiple)
test("step", function() {
	var el = $('<div></div>').slider({
		min: 0,
		value: 0,
		step: 10,
		max: 100
	});
	equal( el.slider("value"), 0 );

	el.slider("value", 1);
	equal( el.slider("value"), 0 );

	el.slider("value", 9);
	equal( el.slider("value"), 10 );

	el.slider("value", 11);
	equal( el.slider("value"), 10 );

	el.slider("value", 19);
	equal( el.slider("value"), 20 );

el = $('<div></div>').slider({
		min: 0,
		value: 0,
		step: 20,
		max: 100
	});
	el.slider("value", 0);

	el.slider("option", "value", 1);
	equal( el.slider("value"), 0 );

	el.slider("option", "value", 9);
	equal( el.slider("value"), 0 );

	el.slider("option", "value", 11);
	equal( el.slider("value"), 20 );

	el.slider("option", "value", 19);
	equal( el.slider("value"), 20 );

	el.slider('destroy');
});

//test("value", function() {
//	ok(false, "missing test - untested code is broken code.");
//});

//test("values", function() {
//	ok(false, "missing test - untested code is broken code.");
//});

})(jQuery);
