define (require, exports, module) ->
	'use strict';
	
	# Load Brackets modules
	InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget

	ColorEditor = require('ColorEditor')

	# Load tempalte
	InlineEditorTemplate = require("text!InlineColorEditorTemplate.html")

	class InlineColorEditor extends InlineWidget

		parentClass: InlineWidget::
		$wrapperDiv: null

		constructor: (@color, @pos) ->
			@initialColorString = @color
			InlineWidget.call(@)

		setColor: (colorLabel) =>
			if(colorLabel != @initialColorString)
				end = { line: @pos.line, ch: @pos.ch + @color.length }
				@editor.document.replaceRange(colorLabel, @pos, end)
				@editor._codeMirror.setSelection(@pos, { line: @pos.line, ch: @pos.ch + colorLabel.length })
				@color = colorLabel

		load: (hostEditor) ->
			self = @
			@editor = hostEditor
			@parentClass.load.call(@, hostEditor)

			@$wrapperDiv = $(InlineEditorTemplate)
			@colorEditor = new ColorEditor(@$wrapperDiv, @color, @setColor)

			@$htmlContent.append(@$wrapperDiv);
			# @$wrapperDiv.on("mousedown", @onWrapperClick.bind(@));

	 	# Close the color picker when clicking on the wrapper outside the picker
		# onWrapperClick: (event) ->
		# 	if (event.target == @$wrapperDiv[0])
		# 		@close()
		# 	else
		# 		event.preventDefault()

		close: () ->
			if (@closed)
				return
			@closed = true
			@hostEditor.removeInlineWidget(@)
			if (@onClose)
				@onClose(@)
		
		onAdded: () ->
			window.setTimeout(@._sizeEditorToContent.bind(@));
		
		_sizeEditorToContent: () ->
			@hostEditor.setInlineWidgetHeight(@, @$wrapperDiv.outerHeight(), true)

	module.exports = InlineColorEditor
