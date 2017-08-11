// Simulate event version 1.4.0
define(function(require, exports, module) {
    var extend = require('./xtend/mutable')

    /**
    * Set some default options.
    *
    * @type {Object}
    */
    var eventOptions = {
        UIEvent: function () {
            return {
                view: document.defaultView
            }
        },
        FocusEvent: function () {
            return eventOptions.UIEvent.apply(this, arguments)
        },
        MouseEvent: function (type) {
            return {
                button: 0,
                bubbles: (type !== 'mouseenter' && type !== 'mouseleave'),
                cancelable: (type !== 'mouseenter' && type !== 'mouseleave'),
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                clientX: 1,
                clientY: 1,
                screenX: 0,
                screenY: 0,
                view: document.defaultView,
                relatedTarget: document.documentElement
            }
        },
        WheelEvent: function (type) {
            return eventOptions.MouseEvent.apply(this, arguments)
        },
        KeyboardEvent: function () {
            return {
                view: document.defaultView,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                keyCode: 0
            }
        }
    }

    /**
    * Map event names to constructor names.
    *
    * @type {Object}
    */
    var eventTypes = {
        beforeprint: 'Event',
        afterprint: 'Event',
        beforeunload: 'Event',
        abort: 'Event',
        error: 'Event',
        change: 'Event',
        submit: 'Event',
        reset: 'Event',
        cached: 'Event',
        canplay: 'Event',
        canplaythrough: 'Event',
        chargingchange: 'Event',
        chargingtimechange: 'Event',
        checking: 'Event',
        close: 'Event',
        downloading: 'Event',
        durationchange: 'Event',
        emptied: 'Event',
        ended: 'Event',
        fullscreenchange: 'Event',
        fullscreenerror: 'Event',
        invalid: 'Event',
        levelchange: 'Event',
        loadeddata: 'Event',
        loadedmetadata: 'Event',
        noupdate: 'Event',
        obsolete: 'Event',
        offline: 'Event',
        online: 'Event',
        open: 'Event',
        orientationchange: 'Event',
        pause: 'Event',
        pointerlockchange: 'Event',
        pointerlockerror: 'Event',
        copy: 'Event',
        cut: 'Event',
        paste: 'Event',
        play: 'Event',
        playing: 'Event',
        ratechange: 'Event',
        readystatechange: 'Event',
        seeked: 'Event',
        seeking: 'Event',
        stalled: 'Event',
        success: 'Event',
        suspend: 'Event',
        timeupdate: 'Event',
        updateready: 'Event',
        visibilitychange: 'Event',
        volumechange: 'Event',
        waiting: 'Event',
        load: 'UIEvent',
        unload: 'UIEvent',
        resize: 'UIEvent',
        scroll: 'UIEvent',
        select: 'UIEvent',
        drag: 'MouseEvent',
        dragenter: 'MouseEvent',
        dragleave: 'MouseEvent',
        dragover: 'MouseEvent',
        dragstart: 'MouseEvent',
        dragend: 'MouseEvent',
        drop: 'MouseEvent',
        touchcancel: 'UIEvent',
        touchend: 'UIEvent',
        touchenter: 'UIEvent',
        touchleave: 'UIEvent',
        touchmove: 'UIEvent',
        touchstart: 'UIEvent',
        blur: 'UIEvent',
        focus: 'UIEvent',
        focusin: 'UIEvent',
        focusout: 'UIEvent',
        input: 'UIEvent',
        show: 'MouseEvent',
        click: 'MouseEvent',
        dblclick: 'MouseEvent',
        mouseenter: 'MouseEvent',
        mouseleave: 'MouseEvent',
        mousedown: 'MouseEvent',
        mouseup: 'MouseEvent',
        mouseover: 'MouseEvent',
        mousemove: 'MouseEvent',
        mouseout: 'MouseEvent',
        contextmenu: 'MouseEvent',
        wheel: 'WheelEvent',
        message: 'MessageEvent',
        storage: 'StorageEvent',
        timeout: 'StorageEvent',
        keydown: 'KeyboardEvent',
        keypress: 'KeyboardEvent',
        keyup: 'KeyboardEvent',
        progress: 'ProgressEvent',
        loadend: 'ProgressEvent',
        loadstart: 'ProgressEvent',
        popstate: 'PopStateEvent',
        hashchange: 'HashChangeEvent',
        transitionend: 'TransitionEvent',
        compositionend: 'CompositionEvent',
        compositionstart: 'CompositionEvent',
        compositionupdate: 'CompositionEvent',
        pagehide: 'PageTransitionEvent',
        pageshow: 'PageTransitionEvent'
    }

    /**
    * Map the event type constructor to the initialization method.
    *
    * @type {Object}
    */
    var eventInit = {
        Event: 'initEvent',
        UIEvent: 'initUIEvent',
        FocusEvent: 'initUIEvent',
        MouseEvent: 'initMouseEvent',
        WheelEvent: 'initMouseEvent',
        MessageEvent: 'initMessageEvent',
        StorageEvent: 'initStorageEvent',
        KeyboardEvent: 'initKeyboardEvent',
        ProgressEvent: 'initEvent',
        PopStateEvent: 'initEvent',
        TransitionEvent: 'initEvent',
        HashChangeEvent: 'initHashChangeEvent',
        CompositionEvent: 'initCompositionEvent',
        DeviceMotionEvent: 'initDeviceMotionEvent',
        PageTransitionEvent: 'initEvent',
        DeviceOrientationEvent: 'initDeviceOrientationEvent'
    }

    /**
    * Map the options object to initialization parameters.
    *
    * @type {Object}
    */
    var eventParameters = {
        initEvent: [],
        initUIEvent: [
            'view',
            'detail'
        ],
        initKeyboardEvent: [
            'view',
            'char',
            'key',
            'location',
            'modifiersList',
            'repeat',
            'locale'
        ],
        initKeyEvent: [
            'view',
            'ctrlKey',
            'altKey',
            'shiftKey',
            'metaKey',
            'keyCode',
            'charCode'
        ],
        initMouseEvent: [
            'view',
            'detail',
            'screenX',
            'screenY',
            'clientX',
            'clientY',
            'ctrlKey',
            'altKey',
            'shiftKey',
            'metaKey',
            'button',
            'relatedTarget'
        ],
        initHashChangeEvent: [
            'oldURL',
            'newURL'
        ],
        initCompositionEvent: [
            'view',
            'data',
            'locale'
        ],
        initDeviceMotionEvent: [
            'acceleration',
            'accelerationIncludingGravity',
            'rotationRate',
            'interval'
        ],
        initDeviceOrientationEvent: [
            'alpha',
            'beta',
            'gamma',
            'absolute'
        ],
        initMessageEvent: [
            'data',
            'origin',
            'lastEventId',
            'source'
        ],
        initStorageEvent: [
            'key',
            'oldValue',
            'newValue',
            'url',
            'storageArea'
        ]
    }

    /**
    * Map the event types to constructors.
    *
    * @type {Object}
    */
    var eventConstructors = {
        UIEvent: window.UIEvent,
        FocusEvent: window.FocusEvent,
        MouseEvent: window.MouseEvent,
        WheelEvent: window.MouseEvent,
        KeyboardEvent: window.KeyboardEvent
    }

    /**
    * Get attributes which must be overriden manually.
    *
    * @param {String} eventType
    * @param {Object} options.
    */
    function getOverrides (eventType, options) {
        if (eventType === 'KeyboardEvent' && options) {
            return {
                keyCode: options.keyCode || 0,
                key: options.key || 0,
                which: options.which || options.keyCode || 0
            }
        }
    }

    /**
    * Generate an event.
    *
    * @param  {String}  type
    * @param  {Object}  options
    * @return {Event}
    */
    exports.generate = function (type, options) {
        // Immediately throw an error when the event name does not translate.
        if (!eventTypes.hasOwnProperty(type)) {
            throw new SyntaxError('Unsupported event type')
        }

        var eventType = eventTypes[type]
        var event
        var key

        // Handle parameters which must be manually overridden using
        // `Object.defineProperty`.
        var overrides = getOverrides(eventType, options)

        // Extend a new object with the default and passed in options.
        // Existing events already have all of their defaults set.
        if (!(options instanceof window.Event)) {
            // Check for extra defaults to pass in.
            if (eventType in eventOptions) {
                options = extend({
                    bubbles: true,
                    cancelable: true
                }, eventOptions[eventType](type, options), options)
            } else {
                options = extend({
                    bubbles: true,
                    cancelable: true
                }, options)
            }
        }

        // Attempt the Event Constructors DOM API.
        var Constructor = eventConstructors[eventType] || window.Event

        try {
            event = new Constructor(type, options)

            // Add the override properties.
            for (key in overrides) {
                Object.defineProperty(event, key, {
                    value: overrides[key]
                })
            }

            return event
        } catch (e) {
            // Continue.
        }

        // In IE11, the Keyboard event does not allow setting the
        // keyCode property, even with Object.defineProperty,
        // so we have to use UIEvent.
        var ua = window.navigator.userAgent.toLowerCase()
        var msie = Math.max(ua.indexOf('msie'), ua.indexOf('trident'))

        if (msie >= 0 && eventType === 'KeyboardEvent') {
            eventType = 'UIEvent'
        }

        var initEvent = eventInit[eventType]

        // In < IE9, the `createEvent` function is not available and we have to
        // resort to using `fireEvent`.
        if (!document.createEvent) {
            event = extend(document.createEventObject(), options)

            // Add the override properties.
            for (key in overrides) {
                Object.defineProperty(event, key, {
                    value: overrides[key]
                })
            }

            return event
        }

        event = extend(document.createEvent(eventType), options)

        // Handle differences between `initKeyboardEvent` and `initKeyEvent`.
        if (initEvent === 'initKeyboardEvent') {
            if (event[initEvent] === void 0) {
                initEvent = 'initKeyEvent'
            } else if (!('modifiersList' in options)) {
                var mods = []
                if (options.metaKey) mods.push('Meta')
                if (options.altKey) mods.push('Alt')
                if (options.shiftKey) mods.push('Shift')
                if (options.ctrlKey) mods.push('Control')
                options['modifiersList'] = mods.join(' ')
            }
        }

        // Map argument names to the option values.
        var args = eventParameters[initEvent].map(function (parameter) {
            return options[parameter]
        })

        // Initialize the event using the built-in method.
        event[initEvent].apply(
            event, [type, options.bubbles, options.cancelable].concat(args)
        )

        // Add the override properties.
        for (key in overrides) {
            Object.defineProperty(event, key, {
                value: overrides[key]
            })
        }

        return event
    }

    /**
    * Simulate an event which is dispatched on the given element.
    *
    * @param  {Element} element
    * @param  {String}  type
    * @param  {Object}  options
    * @return {Boolean}
    */
    exports.simulate = function (element, type, options) {
        var event = exports.generate(type, options)

        // In < IE9, the `createEvent` function is not available and we have to
        // resort to using `fireEvent`.
        if (!document.createEvent) {
            return element.fireEvent('on' + type, event)
        }
        return element.dispatchEvent(event)
    }
});
