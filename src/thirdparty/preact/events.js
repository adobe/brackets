define (function(require, exports, module){
    'use strict';

    module.exports = `onKeyDown onKeyPress onKeyUp onFocus onBlur onClick onContextMenu onDoubleClick onDrag onDragEnd onDragEnter onDragExit onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave onMouseMove onMouseOut onMouseOver onMouseUp onChange onInput onSubmit onTouchCancel onTouchEnd onTouchMove onTouchStart onLoad onError onAnimationStart onAnimationEnd onAnimationIteration onTransitionEnd`.split(' ').map(item => {
        const event =  item.replace('on', '');
        return event.charAt(0).toLowerCase() + event.substr(1);
    });
});
