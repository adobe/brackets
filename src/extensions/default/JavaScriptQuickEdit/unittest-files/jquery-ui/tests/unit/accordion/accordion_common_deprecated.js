TestHelpers.commonWidgetTests( "accordion", {
	defaults: {
		active: 0,
		animate: null,
		animated: "slide",
		autoHeight: true,
		clearStyle: false,
		collapsible: false,
		disabled: false,
		event: "click",
		fillSpace: false,
		header: "> li > :first-child,> :not(li):even",
		heightStyle: null,
		icons: {
			"activeHeader": null,
			"header": "ui-icon-triangle-1-e",
			"headerSelected": "ui-icon-triangle-1-s"
		},
		navigation: false,
		navigationFilter: function() {},

		// callbacks
		activate: null,
		beforeActivate: null,
		change: null,
		changestart: null,
		create: null
	}
});
