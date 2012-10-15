TestHelpers.commonWidgetTests( "autocomplete", {
	defaults: {
		appendTo: "body",
		autoFocus: false,
		delay: 300,
		disabled: false,
		messages: {
			noResults: "No search results.",
			results: $.ui.autocomplete.prototype.options.messages.results
		},
		minLength: 1,
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		source: null,

		// callbacks
		change: null,
		close: null,
		create: null,
		focus: null,
		open: null,
		response: null,
		search: null,
		select: null
	}
});
