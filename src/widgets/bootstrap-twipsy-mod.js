/* ==========================================================
 * bootstrap-twipsy.js v1.4.0
 * http://twitter.github.com/bootstrap/javascript.html#twipsy
 * Adapted from the original jQuery.tipsy by Jason Frame
 * Adjusted for Brackets
 * ==========================================================
 * Copyright 2011 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function( $ ) {

  "use strict"

  /***** [changed for Brackets] *****/
  // Undefined until the focus state changed once
  var _windowHasFocus;

  $(window)
    .focus(function _onWindowGainedFocus() {
      _windowHasFocus = true;
    })
    .blur(function _onWindowLostFocus() {
      _windowHasFocus = false;
    });
  /***** [/changed for Brackets] *****/

 /* CSS TRANSITION SUPPORT (https://gist.github.com/373874)
  * ======================================================= */

  var transitionEnd

  $(document).ready(function () {

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd'
            ,  'msTransition'     : 'MSTransitionEnd'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

    // set CSS transition event type
    if ( $.support.transition ) {
      transitionEnd = $.support.transition.end
    }

  })


 /* TWIPSY PUBLIC CLASS DEFINITION
  * ============================== */

  var Twipsy = function ( element, options ) {
    this.$element = $(element)
    this.options = options
    this.enabled = true
    /***** [changed for Brackets] *****/
    this.autoHideTimeout = null;
    /***** [/changed for Brackets] *****/
    this.fixTitle()
  }

  Twipsy.prototype = {

    show: function() {
      /***** [changed for Brackets: moved some variables to updatePosition()] *****/
      var $tip
        , that = this;
      /***** [/changed for Brackets] *****/

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animate) {
          $tip.addClass('fade')
        }

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .prependTo(document.body)

/***** [changed for Brackets] *****/
        this.updatePosition();

        $(window).off("resize", this.resizeHandler);
        this.resizeHandler = function(e) {
          that.updatePosition();
        };
        $(window).on("resize", this.resizeHandler);

        if (this.options.autoHideDelay) {
          var startAutoHide = function () {
            window.clearTimeout(that.autoHideTimeout);
            that.autoHideTimeout = window.setTimeout(function () {
              that.hide();
            }, that.options.autoHideDelay);
          }
          if (_windowHasFocus) {
            startAutoHide();
          } else {
            $(window).one("focus", startAutoHide);
          }
        }

        $tip.addClass('in');
      }
    }

  , updatePosition: function () {
      var pos
        , actualWidth
        , actualHeight
        , paddingLeft
        , paddingRight
        , surplusRight
        , shiftArrow
        , placement
        , $tip
        , $arrow
        , tp
        , that = this

      $tip = this.tip()

      pos = $.extend({}, this.$element.offset(), {
        width: this.$element[0].offsetWidth
      , height: this.$element[0].offsetHeight
      })

      paddingLeft  = parseInt(this.$element.css("padding-left"),  10);
      paddingRight = parseInt(this.$element.css("padding-right"), 10);

      pos.left += paddingLeft;
      pos.width -= (paddingLeft + paddingRight);

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      placement = maybeCall(this.options.placement, this, [ $tip[0], this.$element[0] ])
      // Add the placement class so the arrow's margin can be determined
      $tip.addClass(placement)

      switch (placement) {
        case 'below':
          tp = {top: pos.top + pos.height + this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2}
          break
        case 'above':
          tp = {top: pos.top - actualHeight - this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2}
          break
        case 'left':
          /***** [changed for Brackets] *****/
          tp = {top: pos.top + pos.height + 20 - actualHeight, left: pos.left - actualWidth - this.options.offset}
          break
        case 'right':
          /***** [changed for Brackets] *****/
          tp = {top: pos.top + pos.height + 20 - actualHeight, left: pos.left + pos.width + this.options.offset}
          break
      }

      shiftArrow = 0;

      surplusRight = (tp.left + actualWidth - $(document.body).width());
      if (surplusRight > 0) {
        shiftArrow = surplusRight;
        tp.left -= surplusRight;
      } else if (tp.left < 0) {
        shiftArrow = tp.left;
        tp.left = 0;
      }

      if (surplusRight > 0) {
        $arrow = $tip.find(".tooltip-arrow");
        if (! this.defaultMargin) {
          this.defaultMargin = parseInt($arrow.css("margin-left"), 10);
        }
        $arrow.css("margin-left", this.defaultMargin + shiftArrow);
      }

      $tip.css(tp);
    }
/***** [/changed for Brackets] *****/

  , setContent: function () {
      var $tip = this.tip()
      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](this.getTitle())
      $tip[0].className = 'tooltip'
    }

  , hide: function() {
      var that = this
        , $tip = this.tip()

      $tip.removeClass('in')

      function removeElement () {
        $tip.remove()
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip.bind(transitionEnd, removeElement) :
        removeElement()

      /***** [changed for Brackets] *****/
      window.clearTimeout(this.autoHideTimeout);
      $(window).off("resize", this.resizeHandler)
      /***** [/changed for Brackets] *****/
    }

  , fixTitle: function() {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getTitle: function() {
      var title
        , $e = this.$element
        , o = this.options

        this.fixTitle()

        if (typeof o.title == 'string') {
          title = $e.attr(o.title == 'title' ? 'data-original-title' : o.title)
        } else if (typeof o.title == 'function') {
          title = o.title.call($e[0])
        }

        title = ('' + title).replace(/(^\s*|\s*$)/, "")

        return title || o.fallback
    }

  , tip: function() {
      return this.$tip = this.$tip || $('<div class="tooltip" />').html(this.options.template)
    }

  , validate: function() {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function() {
      this.enabled = true
    }

  , disable: function() {
      this.enabled = false
    }

  , toggleEnabled: function() {
      this.enabled = !this.enabled
    }

  , toggle: function () {
      this[this.tip().hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* TWIPSY PRIVATE METHODS
  * ====================== */

   function maybeCall ( thing, ctx, args ) {
     return typeof thing == 'function' ? thing.apply(ctx, args) : thing
   }

 /* TWIPSY PLUGIN DEFINITION
  * ======================== */

  $.fn.twipsy = function (options) {
    $.fn.twipsy.initWith.call(this, options, Twipsy, 'twipsy')
    return this
  }

  $.fn.twipsy.initWith = function (options, Constructor, name) {
    var twipsy
      , binder
      , eventIn
      , eventOut

    if (options === true) {
      return this.data(name)
    } else if (typeof options == 'string') {
      twipsy = this.data(name)
      if (twipsy) {
        twipsy[options]()
      }
      return this
    }

    options = $.extend({}, $.fn[name].defaults, options)

    function get(ele) {
      var twipsy = $.data(ele, name)

      if (!twipsy) {
        twipsy = new Constructor(ele, $.fn.twipsy.elementOptions(ele, options))
        $.data(ele, name, twipsy)
      }

      return twipsy
    }

    function enter() {
      var twipsy = get(this)
      twipsy.hoverState = 'in'

      if (options.delayIn == 0) {
        twipsy.show()
      } else {
        twipsy.fixTitle()
        setTimeout(function() {
          if (twipsy.hoverState == 'in') {
            twipsy.show()
          }
        }, options.delayIn)
      }
    }

    function leave() {
      var twipsy = get(this)
      twipsy.hoverState = 'out'
      if (options.delayOut == 0) {
        twipsy.hide()
      } else {
        setTimeout(function() {
          if (twipsy.hoverState == 'out') {
            twipsy.hide()
          }
        }, options.delayOut)
      }
    }

    if (!options.live) {
      this.each(function() {
        get(this)
      })
    }

    if (options.trigger != 'manual') {
      binder   = options.live ? 'live' : 'bind'
      eventIn  = options.trigger == 'hover' ? 'mouseenter' : 'focus'
      eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur'
      this[binder](eventIn, enter)[binder](eventOut, leave)
    }

    return this
  }

  $.fn.twipsy.Twipsy = Twipsy

  $.fn.twipsy.defaults = {
    animate: true
  , delayIn: 0
  , delayOut: 0
  , fallback: ''
  , placement: 'above'
  , html: false
  , live: false
  , offset: 0
  , title: 'title'
  , trigger: 'hover'
  , template: '<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>'
  }

  $.fn.twipsy.rejectAttrOptions = [ 'title' ]

  $.fn.twipsy.elementOptions = function(ele, options) {
    var data = $(ele).data()
      , rejects = $.fn.twipsy.rejectAttrOptions
      , i = rejects.length

    while (i--) {
      delete data[rejects[i]]
    }

    return $.extend({}, options, data)
  }

}( window.jQuery || window.ender );
