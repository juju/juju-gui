'use strict';


/**
 * Provides the Charm Slider widget.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser.CharmSlider
 *
 */
YUI.add('browser-charm-slider', function(Y) {
  var sub = Y.Lang.sub,
      ns = Y.namespace('juju.widgets.browser');

  /**
   * The CharmSlider provides a rotating display of one member of a generic set
   * of items, with controls to go directly to a given item.
   *
   * @class CharmSlider
   * @extends {Y.ScrollView}
   *
   */
  ns.CharmSlider = new Y.Base.create('browser-charm-slider', Y.ScrollView, [], {

    /**
     * Template for the CharmSlider
     *
     * @property charmSliderTemplate
     * @type {String}
     *
     */
    charmSliderTemplate: '<ul width="{width}px" />',

    /**
     * Template for a given item in the slider
     *
     * @property itemTemplate
     * @type {String}
     *
     */
    itemTemplate: '<li width="{width}px" data-index="{index}" />',

    /**
     * Template used for the navigation controls.
     *
     * @property prevNavTemplate
     * @type {String}
     */
    navTemplate: '<ul class="navigation"></div>',

    /**
     * Template used for items in the navigation.
     *
     * @property navItemTemplate
     * @type {String}
     */
    navItemTemplate: '<li data-index="{index}">O</li>',

    /**
      * Advances the slider to the next item, or a designated index.
      *
      * @method _advanceSlide
      * @param {string} Index to move to; if not supplied, advances to next
      * slide.
      * @private
      */
    _advanceSlide: function(index) {
      var pages = this.pages;
      if (index) {
        this._stopTimer();
        pages.scrollToIndex(index);
        this._startTimer();
      } else {
        index = pages.get('index');
        if (index < pages.get('total') - 1) {
          pages.next();
        } else {
          pages.scrollToIndex(0);
        }
      }
    },

    /**
     * Creates the structure and DOM nodes for the slider.
     *
     * @method _generateDOM
     * @private
     * @return {Node} The slider's DOM nodes.
     *
     */
    _generateDOM: function() {
      var width = this.get('width'),
          slider = Y.Node.create(
              sub(this.charmSliderTemplate, {width: width}));

      Y.Array.map(this.get('items'), function(item, index) {
        var tmpNode = Y.Node.create(
            sub(this.itemTemplate, {width: width, index: index}));
        tmpNode.setHTML(item);
        slider.append(tmpNode);
      }, this);
      return slider;
    },

    /**
     * Generates and appends the navigation controls for the slider
     *
     * @method _generateSliderControls
     * @private
     */
    _generateSliderControls: function() {
      var nav = Y.Node.create(this.navTemplate);
      Y.Array.each(this.get('items'), function(item, index) {
        nav.append(Y.Node.create(sub(
            this.navItemTemplate, {index: index})));
      }, this);
      this.get('boundingBox').append(nav);
    },

    /**
      * Mouseenter/mouseleave event handler
      *
      * @method _pauseAutoAdvance
      * @private
      * @param {object} mouseout or mouseover event object.
      */
    _pauseAutoAdvance: function(e) {
      if (e.type === 'mouseenter') {
        this.set('paused', true);
      } else {
        this.set('paused', false);
      }
    },

    /**
      * Checks to see if autoadvance is set then sets up the timeouts
      *
      * @method _startTimer
      * @private
      */
    _startTimer: function() {

      if (this.get('autoAdvance') === true) {
        var timer = Y.later(this.get('advanceDelay'), this, function() {
          if (this.get('paused') !== true) {
            this._advanceSlide();
          }
        }, null, true);
        this.set('timer', timer);
      }
    },

    /**
      * Stops the timer for autoadvance
      *
      * @method _stopTimer
      * @private
      */
    _stopTimer: function() {
      var timer = this.get('timer');
      if (timer) {
        timer.cancel();
      }
    },

    /**
      * Binds the navigate event listeners
      *
      * @method bindUI
      * @private
      */
    bindUI: function() {

      //Call the parent bindUI method
      ns.CharmSlider.superclass.bindUI.apply(this);

      var events = this.get('_events'),
          boundingBox = this.get('boundingBox'),
          nav = boundingBox.one('.navigation');
      events.push(this.after('render', this._startTimer, this));
      events.push(boundingBox.on('mouseenter', this._pauseAutoAdvance, this));
      events.push(boundingBox.on('mouseleave', this._pauseAutoAdvance, this));
      events.push(nav.delegate('click', function(e) {
        var index = e.currentTarget.getAttribute('data-index');
        index = parseInt(index, 10);
        this._advanceSlide(index);
      }, 'li', this));
    },

    /**
      * Detaches events attached during instantiation
      *
      * @method destructor
      * @private
      */
    destructor: function() {
      console.log('Clearing slider events');
      // Stop any in-progress timer
      this.get('timer').cancel();
      Y.Array.each(this.get('_events'), function(event) {
        event.detach();
      });
    },

    /**
     * Initializer
     *
     * @method initializer
     * @param {Object} The config object.
     *
     */
    initializer: function(cfg) {
      this.plug(Y.Plugin.ScrollViewPaginator, {
        selector: 'li'
      });

    },

    /**
      * Render the nodes and HTML for the slider.
      *
      * @method renderUI
      * @private
      */
    renderUI: function() {
      this.get('contentBox').setHTML(this._generateDOM());
      this._generateSliderControls();
    }
  }, {
    ATTRS: {

      /**
       * @attribute width
       * @default 200
       * @type {Int}
       *
       */
      width: {
        value: 500
      },

      /**
       * @attribute autoAdvance
       * @default true
       * @type {Boolean}
       *
       */
      autoAdvance: {
        value: true
      },

      /**
       * @attribute advanceDelay
       * @default 3000
       * @type {Int}
       *
       */
      advanceDelay: {
        value: 3000
      },

      /**
       * @attribute paused
       * @default false
       * @type {Boolean}
       *
       */
      paused: {
        value: false
      },

      /**
       * @attribute items
       * @default []
       * @type {Array}
       *
       */
      items: {
        value: [],
        /**
         * Verify items aren't larger than max value.
         *
         * @method validator
         * @param {Array} The items being validated.
         */
        validator: function(val) {
          return (val.length <= this.get('max'));
        }
      },

      /**
       * @attribute _events
       * @default []
       * @type {Array}
       *
       */
      _events: {
        value: []
      },

      /**
       * @attribute max
       * @default 5
       * @type {Int}
       *
       */
      max: {
        value: 5
      },

      /**
       * @attribute timer
       * @default null
       * @type {Object}
       *
       */
      timer: {
        value: null
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base',
    'event-mouseenter',
    'scrollview',
    'scrollview-paginator'
  ]
});
