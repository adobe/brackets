module.exports = function( grunt ) {

grunt.registerTask( "testswarm", function( commit, configFile ) {
	var test,
		testswarm = require( "testswarm" ),
		config = grunt.file.readJSON( configFile ).jqueryui,
		testBase = "http://swarm.jquery.org/git/jquery-ui/" + commit + "/tests/unit/",
		testUrls = [],
		tests = {
			"Accordion": "accordion/accordion.html",
			"Accordion_deprecated": "accordion/accordion_deprecated.html",
			"Autocomplete": "autocomplete/autocomplete.html",
			"Button": "button/button.html",
			"Core": "core/core.html",
			//"datepicker/datepicker.html",
			//"dialog/dialog.html",
			//"draggable/draggable.html",
			//"droppable/droppable.html",
			"Effects": "effects/effects.html",
			"Menu": "menu/menu.html",
			"Position": "position/position.html",
			"Position_deprecated": "position/position_deprecated.html",
			"Progressbar": "progressbar/progressbar.html",
			//"resizable/resizable.html",
			//"selectable/selectable.html",
			//"slider/slider.html",
			//"sortable/sortable.html",
			"Spinner": "spinner/spinner.html",
			"Tabs": "tabs/tabs.html",
			"Tabs_deprecated": "tabs/tabs_deprecated.html",
			"Tooltip": "tooltip/tooltip.html",
			"Widget": "widget/widget.html"
		};
	for ( test in tests ) {
		testUrls.push( testBase + tests[ test ] + "?nojshint=true" );
	}
	testswarm({
		url: "http://swarm.jquery.org/",
		pollInterval: 10000,
		timeout: 1000 * 60 * 30,
		done: this.async()
	}, {
		authUsername: "jqueryui",
		authToken: config.authToken,
		jobName: 'jQuery UI commit #<a href="https://github.com/jquery/jquery-ui/commit/' + commit + '">' + commit.substr( 0, 10 ) + '</a>',
		runMax: config.runMax,
		"runNames[]": Object.keys(tests),
		"runUrls[]": testUrls,
		"browserSets[]": ["popular"]
	});
});

};
