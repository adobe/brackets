define (require, exports, module) ->
	'use strict';
	
	# Load Brackets modules
	InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget

	ColorEditor = require('ColorEditor')
	
	# Load tempalte
	inlineEditorTemplate = require("text!InlineColorEditorTemplate.html")

	class InlineColorEditor extends InlineWidget

		parentClass: InlineWidget::

		constructor: (@initialColor) ->
			InlineWidget.call(this)
	
		load: (@hostEditor) ->
			@parentClass.load.call(this, hostEditor)
			@$wrapperDiv = $(inlineEditorTemplate)
			@.$htmlContent.append @$wrapperDiv
			@colorEditor = new ColorEditor(@$wrapperDiv, @initialColor, @_colorUpdateHandler)

		close: () ->
			console.log 'closing'
			this.hostEditor.removeInlineWidget this
	
		onAdded: () ->
			window.setTimeout(@_sizeEditorToContent.bind(@))

		_sizeEditorToContent: () ->
			@hostEditor.setInlineWidgetHeight(@, @$wrapperDiv.outerHeight(), true)

		_colorUpdateHandler: (colorLabel) =>
			@hostEditor._codeMirror.replaceSelection(colorLabel)
			# replaceSelection
			# console.log colorLabel

	module.exports = InlineColorEditor
