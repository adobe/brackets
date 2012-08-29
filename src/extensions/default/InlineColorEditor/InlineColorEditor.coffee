define (require, exports, module) ->
	'use strict';
	
	# Load Brackets modules
	InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget

	ColorEditor = require('ColorEditor')
	
	# Load tempalte
	inlineEditorTemplate = require("text!InlineColorEditorTemplate.html")

	class InlineColorEditor extends InlineWidget

		parentClass: InlineWidget::

		constructor: (@initialColor, @pos) ->
			InlineWidget.call(this)
			@currentColorString = @initialColor
	
		load: (@hostEditor, @linePos) ->
			@parentClass.load.call(this, @hostEditor)
			@$wrapperDiv = $(inlineEditorTemplate)
			@.$htmlContent.append @$wrapperDiv
			@colorEditor = new ColorEditor(@$wrapperDiv, @initialColor, @_colorUpdateHandler)

		close: () ->
			this.hostEditor.removeInlineWidget this
			if (this.onClose)
				this.onClose(this)
	
		onAdded: () ->
			window.setTimeout(@_sizeEditorToContent.bind(@))

		_sizeEditorToContent: () ->
			@hostEditor.setInlineWidgetHeight(@, @$wrapperDiv.outerHeight(), true)

		_colorUpdateHandler: (colorLabel) =>
			lineString = @hostEditor._codeMirror.getLine(@hostEditor.getSelection(false).start.line)
			start = lineString.indexOf(@currentColorString)
			end = start+@currentColorString.length
			@currentColorString = colorLabel
			if(colorLabel != @initialColor)
				# @hostEditor.document.replaceRange(colorLabel, {line: @linePos, ch:start}, {line: @linePos, ch:end})
				@hostEditor._codeMirror.setSelection({line: @linePos, ch: start}, {line: @linePos, ch: start+colorLabel.length})

	module.exports = InlineColorEditor
