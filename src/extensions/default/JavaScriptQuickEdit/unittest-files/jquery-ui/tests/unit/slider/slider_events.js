/*
 * slider_events.js
 */
(function($) {

module( "slider: events" );

//Specs from http://wiki.jqueryui.com/Slider#specs
//"change callback: triggers when the slider has stopped moving and has a new
// value (even if same as previous value), via mouse(mouseup) or keyboard(keyup)
// or value method/option"
test( "mouse based interaction", function() {
	expect(4);

	var el = $( "<div></div>" )
		.appendTo( "body" )
		.slider({
			start: function(event, ui) {
				equal( event.originalEvent.type, "mousedown", "start triggered by mousedown" );
			},
			slide: function(event, ui) {
				equal( event.originalEvent.type, "mousemove", "slider triggered by mousemove" );
			},
			stop: function(event, ui) {
				equal( event.originalEvent.type, "mouseup", "stop triggered by mouseup" );
			},
			change: function(event, ui) {
				equal( event.originalEvent.type, "mouseup", "change triggered by mouseup" );
			}
		});

	el.find( ".ui-slider-handle" ).eq( 0 )
		.simulate( "drag", { dx: 10, dy: 10 } );

});
test( "keyboard based interaction", function() {
	expect(3);

	// Test keyup at end of handle slide (keyboard)
	var el = $( "<div></div>" )
		.appendTo( "body" )
		.slider({
			start: function(event, ui) {
				equal( event.originalEvent.type, "keydown", "start triggered by keydown" );
			},
			slide: function(event, ui) {
				ok( false, "Slider never triggered by keys" );
			},
			stop: function(event, ui) {
				equal( event.originalEvent.type, "keyup", "stop triggered by keyup" );
			},
			change: function(event, ui) {
				equal( event.originalEvent.type, "keyup", "change triggered by keyup" );
			}
		});

	el.find( ".ui-slider-handle" ).eq( 0 )
		.simulate( "keydown", { keyCode: $.ui.keyCode.LEFT } )
		.simulate( "keypress", { keyCode: $.ui.keyCode.LEFT } )
		.simulate( "keyup", { keyCode: $.ui.keyCode.LEFT } );

});
test( "programmatic event triggers", function() {
	expect(6);

	// Test value method
	var el = $( "<div></div>" )
		.slider({
			change: function(event, ui) {
				ok( true, "change triggered by value method" );
			}
		})
		.slider( "value", 0 );

	QUnit.reset();
	// Test values method
	el = $( "<div></div>" )
		.slider({
			values: [ 10, 20 ],
			change: function(event, ui) {
				ok( true, "change triggered by values method" );
			}
		})
		.slider( "values", [80, 90] );

	QUnit.reset();
	// Test value option
	el = $( "<div></div>" )
		.slider({
			change: function(event, ui) {
				ok( true, "change triggered by value option" );
			}
		})
		.slider( "option", "value", 0 );

	QUnit.reset();
	// Test values option
	el = $( "<div></div>" )
		.slider({
			values: [ 10, 20 ],
			change: function(event, ui) {
				ok( true, "change triggered by values option" );
			}
		})
		.slider( "option", "values", [80, 90] );

});

}( jQuery ) );
