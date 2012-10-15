/*
 * slider unit tests
 */
(function($) {
//
// Slider Test Helper Functions
//

var el, options;

function handle() {
	return el.find(".ui-slider-handle");
}

// Slider Tests
module("slider: core");

test("keydown HOME on handle sets value to min", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", 0);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.HOME });
	equal(el.slider("value"), options.min);

	el.slider('destroy');

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", 0);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.HOME });
	equal(el.slider("value"), options.min);

	el.slider('destroy');
});

test("keydown END on handle sets value to max", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", 0);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.END });
	equal(el.slider("value"), options.max);

	el.slider('destroy');

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", 0);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.END });
	equal(el.slider("value"), options.max);

	el.slider('destroy');
});

test("keydown PAGE_UP on handle increases value by 1/5 range, not greater than max", function() {
	$.each(['horizontal', 'vertical'], function(i, orientation) {
		el = $('<div></div>');
		options = {
			max: 100,
			min: 0,
			orientation: orientation,
			step: 1
		};
		el.slider(options);

		el.slider("value", 70);

		handle().simulate("keydown", { keyCode: $.ui.keyCode.PAGE_UP });
		equal(el.slider("value"), 90);

		handle().simulate("keydown", { keyCode: $.ui.keyCode.PAGE_UP });
		equal(el.slider("value"), 100);

		el.slider("destroy");
	});
});

test("keydown PAGE_DOWN on handle decreases value by 1/5 range, not less than min", function() {
	$.each(['horizontal', 'vertical'], function(i, orientation) {
		el = $('<div></div>');
		options = {
			max: 100,
			min: 0,
			orientation: orientation,
			step: 1
		};
		el.slider(options);

		el.slider("value", 30);

		handle().simulate("keydown", { keyCode: $.ui.keyCode.PAGE_DOWN });
		equal(el.slider("value"), 10);

		handle().simulate("keydown", { keyCode: $.ui.keyCode.PAGE_DOWN });
		equal(el.slider("value"), 0);

		el.slider("destroy");
	});
});

test("keydown UP on handle increases value by step, not greater than max", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.max - options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.UP });
	equal(el.slider("value"), options.max);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.UP });
	equal(el.slider("value"), options.max);

	el.slider("destroy");

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.max - options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.UP });
	equal(el.slider("value"), options.max);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.UP });
	equal(el.slider("value"), options.max);

	el.slider("destroy");
});

test("keydown RIGHT on handle increases value by step, not greater than max", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.max - options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.RIGHT });
	equal(el.slider("value"), options.max);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.RIGHT });
	equal(el.slider("value"), options.max);

	el.slider("destroy");

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.max - options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.RIGHT });
	equal(el.slider("value"), options.max);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.RIGHT });
	equal(el.slider("value"), options.max);

	el.slider("destroy");
});

test("keydown DOWN on handle decreases value by step, not less than min", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.min + options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.DOWN });
	equal(el.slider("value"), options.min);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.DOWN });
	equal(el.slider("value"), options.min);

	el.slider("destroy");

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.min + options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.DOWN });
	equal(el.slider("value"), options.min);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.DOWN });
	equal(el.slider("value"), options.min);

	el.slider("destroy");
});

test("keydown LEFT on handle decreases value by step, not less than min", function() {
	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'horizontal',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.min + options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.LEFT });
	equal(el.slider("value"), options.min);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.LEFT });
	equal(el.slider("value"), options.min);

	el.slider("destroy");

	el = $('<div></div>');
	options = {
		max: 5,
		min: -5,
		orientation: 'vertical',
		step: 1
	};
	el.slider(options);

	el.slider("value", options.min + options.step);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.LEFT });
	equal(el.slider("value"), options.min);

	handle().simulate("keydown", { keyCode: $.ui.keyCode.LEFT });
	equal(el.slider("value"), options.min);

	el.slider("destroy");
});

})(jQuery);
