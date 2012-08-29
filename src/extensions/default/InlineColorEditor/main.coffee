link = document.createElement('link')
link.type = "text/css"
link.rel = "stylesheet"
link.href = 'extensions/default/InlineColorEditor/css/main.css'
document.getElementsByTagName("head")[0].appendChild(link);



define (require, exports, module) ->
	"use strict"

	# Brackets modules
	EditorManager = brackets.getModule("editor/EditorManager")
	ProjectManager = brackets.getModule("project/ProjectManager")

	# Local modules
	InlineColorEditor = require("InlineColorEditor")


	hexRegEx = /#([a-f0-9]{6}|[a-f0-9]{3})/i
	hslRegEx = /hsla?\((\d|,|%| |.)*\)/i
	rgbRegEx = /rgba?\((\d|,|%| |.)*\)/i

	inlineColorEditorProvider = (hostEditor, pos) ->
		# Only provide color editor if the selection is within a single line
		sel = hostEditor.getSelection(false)
		if (sel.start.line != sel.end.line)
			return null
		
		colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/i

		# check if current line contains a color
		cursorPos = hostEditor._codeMirror.getCursor()
		cursorLine = hostEditor._codeMirror.getLine(hostEditor.getSelection(false).start.line)
		match = cursorLine.match(colorRegEx)
		if !match
			return null
		else
			start = match.index
			end = start + match[0].length
			if cursorPos.ch < start or cursorPos.ch > end
				return null

		# console.log start
		hostEditor._codeMirror.setSelection({line: cursorPos.line, ch: start}, {line: cursorPos.line, ch: end})
		result = new $.Deferred()

		inlineColorEditor = new InlineColorEditor(match[0])
		inlineColorEditor.load(hostEditor)
		
		result.resolve(inlineColorEditor)
		
		return result.promise()

	EditorManager.registerInlineEditProvider inlineColorEditorProvider