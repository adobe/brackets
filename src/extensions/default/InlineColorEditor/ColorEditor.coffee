define ['helper/colors'], (colors) ->
	class ColorEditor

		hexRegEx: /[a-f0-9]{6}|#[a-f0-9]{3}/i
		rgbRegEx: /rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/i
		hslRegEx: /hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/

		hexTypeIndex: 0
		rgbTypeIndex: 1
		hslTypeIndex: 2


		constructor: (@element, color, @callback = null) ->
			@setOutputType(@hexTypeIndex)
			
			@satLumBlock = $(@element).children('.saturation-luminosity-block')[0]
			@hueSlider = $(@element).children('.hue-slider')[0]
			@opacitySlider = $(@element).children('.opacity-slider')[0]
			@colorIndicator = $(@element).children('.lower-controls').children('.color-indicator')[0]
			@originalColorIndicator = $(@colorIndicator).children('.original-color')[0]
			@buttonBar = $(@element).children('.lower-controls').children('.button-bar')[0]

			@originalColor = color
			$(@satLumBlock).mousedown @satLumMousedownHandler
			$(@hueSlider).mousedown @hueMousedownHandler
			$(@opacitySlider).mousedown @opacityMousedownHandler

			$(@buttonBar).children('li').click @buttonbarButtonClickHandler

			$(@originalColorIndicator).css({background: @originalColor})
			$(@originalColorIndicator).click =>
				@parseColor @originalColor
				
			@parseColor color

		parseColor: (color) ->
			if color.match(@hexRegEx)
				@setOutputType(@hexTypeIndex)
				if color.match(/^#?[a-f0-9]{3}$/i)
					color = color.replace('#','')
					colorAr = color.split('')
					color = colorAr[0]+colorAr[0]+colorAr[1]+colorAr[1]+colorAr[2]+colorAr[2]
				@color = Colors.ColorFromHex(color)
			else if color.match(@hslRegEx)
				@setOutputType(@hslTypeIndex)
				color = color.substring(color.indexOf('(')+1,color.indexOf(')'))
				color = color.replace(/( )/g,'')
				colorAr = color.split(',')
				adjustedColorAr = (@parsePercentage colorItem for colorItem in colorAr)
				@color = Colors.ColorFromHSV adjustedColorAr[0],adjustedColorAr[1],adjustedColorAr[2]
				if (adjustedColorAr.length > 3) then @color.SetAlpha(adjustedColorAr[3])
			else if color.match(@rgbRegEx)
				@setOutputType(@rgbTypeIndex)
				color = color.substring(color.indexOf('(')+1,color.indexOf(')'))
				color = color.replace(/( )/g,'')
				colorAr = color.split(',')
				adjustedColorAr = (@parsePercentage colorItem for colorItem in colorAr)
				@color = Colors.ColorFromRGB adjustedColorAr[0],adjustedColorAr[1],adjustedColorAr[2]
				if (adjustedColorAr.length > 3) then @color.SetAlpha(adjustedColorAr[3])
			else
				@setOutputType(@hexTypeIndex)
				@color = Colors.ColorFromHex('#FFFFFF')
				@originalColor = '#FFFFFF'
				console.log @originalColor
				$(@originalColorIndicator).css({background: '#FFFFFF'})
			@updateColor()
		parsePercentage: (valueString) ->
			output
			if valueString.indexOf('%') != -1
				valueString = valueString.replace('%','')
				output = parseFloat(valueString)/100
			else
				output = parseFloat(valueString)
			return output
		updateColor: () ->
			if @outputStringType is @hexTypeIndex
				@color.SetAlpha(1)
			$(@satLumBlock).css('background', 'hsl('+@color.Hue()+', 100%, 50%)')
			transparent = 'rgba('+@color.Red()+','+@color.Green()+','+@color.Blue()+',0)'
			$(@opacitySlider).children('.opacity-gradient').css({background: "-webkit-linear-gradient(top, "+@color.HexString()+", "+transparent+")"})
			$(@satLumBlock).children('.selector').css({left: String(@color.Saturation()*100)+'%', bottom: String(@color.Value()*100)+'%'})
			$(@hueSlider).children('.selector').css({bottom: String((@color.Hue()/360) * 100)+'%'})
			$(@opacitySlider).children('.selector').css({bottom: String(@color.Alpha() * 100)+'%'})
			$(@colorIndicator).children('.selected-color').css({background: 'rgba('+@color.Red()+','+@color.Green()+','+@color.Blue()+','+@color.Alpha()+')'})

			switch @outputStringType
				when @hexTypeIndex
					colorLabel = @color.HexString()
				when @rgbTypeIndex
					colorLabel = "#{@color.Red()}, #{@color.Green()}, #{@color.Blue()}"
					if @color.Alpha() < 1 and @color.Alpha() >= 0
						colorLabel = "rgba(#{colorLabel}, #{Math.round(@color.Alpha() * 100)/100})"
					else
						colorLabel = "rgb(#{colorLabel})"
				when @hslTypeIndex
					colorLabel = "hsla(#{Math.round(@color.Hue())}, #{Math.round(@color.Saturation()*100)}%, #{Math.round(@color.Value()*100)}%, #{Math.round(@color.Alpha() * 100)/100})"


			if (@callback)
				@callback(colorLabel)

		setOutputType: (newOutputType) ->
			@outputStringType = newOutputType
			$(@buttonBar).children().removeClass('selected')
			$($(@buttonBar).children()[newOutputType]).addClass('selected')

		satLumMousedownHandler: (e) =>
			@color.SetHSV( @color.Hue(), e.offsetX/150, 1 - (e.offsetY/150))
			@updateColor()
			$(document).bind 'mouseup', @satLumMouseupHandler
			$(document).bind 'mousemove', @satLumMousemoveHandler
		satLumMousemoveHandler: (e) =>
			x = e.originalEvent.clientX - $(@satLumBlock).offset().left
			y = e.originalEvent.clientY - $(@satLumBlock).offset().top
			width = $(@satLumBlock).width()
			height = $(@satLumBlock).height()
			x = if (x >= width) then width else if (x < 0) then 0 else x
			y = if (y >= height) then height else if (y < 0) then 0 else y
			@color.SetHSV( @color.Hue(), x/150, 1 - (y/150))
			@updateColor()
		satLumMouseupHandler: (e) =>
			$(document).unbind 'mouseup', @satLumMouseupHandler
			$(document).unbind 'mousemove', @satLumMousemoveHandler
		
		hueMousedownHandler: (e) =>
			@color.SetHSV( (1 - e.offsetY/150) * 360, @color.Saturation(), @color.Value() )
			@updateColor()
			$(document).bind 'mouseup', @hueMouseupHandler
			$(document).bind 'mousemove', @hueMousemoveHandler
		hueMousemoveHandler: (e) =>
			y = e.originalEvent.clientY - $(@hueSlider).offset().top
			height = $(@hueSlider).height()
			y = if (y >= height) then height else if (y < 0) then 0 else y
			@color.SetHSV( (1 - y/height) * 360, @color.Saturation(), @color.Value() )
			@updateColor()
		hueMouseupHandler: (e) =>
			$(document).unbind 'mouseup', @hueMouseupHandler
			$(document).unbind 'mousemove', @hueMousemoveHandler
		
		opacityMousedownHandler: (e) =>
			@color.SetHSVA( @color.Hue(), @color.Saturation(), @color.Value(), (1 - e.offsetY/150) )
			@updateColor()
			$(document).bind 'mouseup', @opacityMouseupHandler
			$(document).bind 'mousemove', @opacityMousemoveHandler
		opacityMousemoveHandler: (e) =>
			y = e.originalEvent.clientY - $(@opacitySlider).offset().top
			height = $(@opacitySlider).height()
			y = if (y >= height) then height else if (y < 0) then 0 else y
			@color.SetHSVA( @color.Hue(), @color.Saturation(), @color.Value(), (1 - y/height) )
			@updateColor()
		opacityMouseupHandler: (e) =>
			$(document).unbind 'mouseup', @opacityMouseupHandler
			$(document).unbind 'mousemove', @opacityMousemoveHandler


		buttonbarButtonClickHandler: (e) =>
			selectedItem = $(e.target).parent()
			selectedIndex = $(@buttonBar).children().index(selectedItem)
			@setOutputType(selectedIndex)
			@updateColor()



