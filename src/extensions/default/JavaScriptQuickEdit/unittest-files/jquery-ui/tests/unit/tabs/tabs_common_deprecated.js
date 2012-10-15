TestHelpers.commonWidgetTests( "tabs", {
	defaults: {
		active: null,
		ajaxOptions: null,
		cache: false,
		collapsible: false,
		cookie: null,
		disabled: false,
		event: "click",
		heightStyle: "content",
		hide: null,
		fx: null,
		idPrefix: "ui-tabs-",
		panelTemplate: "<div></div>",
		// show: null, // conflicts with old show callback
		spinner: "<em>Loading&#8230;</em>",
		tabTemplate: "<li><a href='#{href}'><span>#{label}</span></a></li>",

		// callbacks
		activate: null,
		add: null,
		beforeActivate: null,
		beforeLoad: null,
		create: null,
		disable: null,
		enable: null,
		load: null,
		remove: null,
		select: null,
		show: null
	}
});
