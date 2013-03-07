'use strict';

/**
 * Provides the Charm Slider widget.
 *
 * @namespace juju.widgets.browser
 * @module widgets
 *
 */
YUI.add('browser-charm-slider', function(Y) {
  var sub = Y.Lang.sub;
  var ns = Y.namespace('juju.widgets.browser');
  
  /**
   * The CharmSlider provides a rotating display of one member of a generic set
   * of items, with controls to go directly to a given item.
   *
   * @class CharmSlider
   * @extends Y.ScrollView
   *
   */
  ns.CharmSlider = new Y.Base.create('browser-charm-slider', Y.ScrollView, [], {
  
    /**
     * Template for the CharmSlider
     *
     * @property charmSliderTemplate
     * @public
     * @type string
     *
     */
    charmSliderTemplate: '<ul width="{width}px" />',
  
    /**
     * Template for a given item in the slider
     *
     * @property itemTemplate
     * @public
     * @type string
     *
     */
   itemTemplate: '<li width="{width}px" data-index="{index}" />',
  
    /**
     * Template used for the navigation controls.
     *  
     * @property prevNavTemplate
     * @public
     * @type string
     */
    navTemplate: '<ul class="navigation"></div>',

    /**
     * Template used for items in the navigation.
     *
     * @property navItemTemplate
     * @publc
     * @type string
     */
    navItemTemplate: '<li data-index="{index}">O</li>',
  
    /**
     * Initializer
     *
     * @method initializer
     * @param {Object}  The config object
     *
     */
    
    initializer: function(cfg) {
      this.plug(Y.Plugin.ScrollViewPaginator, {
        selector: 'li'
      });
     
    },
  
    /**
     * Creates the structure and DOM nodes for the slider.
     *
     * @method _generateDOM
     * @private
     * @returns {Node} The slider's DOM nodes.
     *
     */
      
    _generateDOM: function() {
      var that = this,
          slider = Y.Node.create(
            sub(this.charmSliderTemplate, {width: this.get('width')}));
        
      Y.Array.map(this.get('items'), function(item, index) {
        var tmpNode = Y.Node.create(
              sub(that.itemTemplate, {width: that.get('width'), index: index}));
        tmpNode.setContent(item);
        slider.append(tmpNode);
      }) 
      return slider;
    },

    /**
     * Generates and appends the navigation controls for the slider
     * 
     * @method _generateSliderControls
     * @private
     */
    _generateSliderControls: function() {
      Y.log('_generateSliderControls', 'info', this.name);
      var that = this,
          nav = Y.Node.create(this.navTemplate);
      Y.Array.each(this.get('items'), function(item, index) {
        nav.append(Y.Node.create(sub(
            that.navItemTemplate, {index: index})));
      });
      this.get('boundingBox').append(nav);
    },
  
    /**
      * Advances the slider to the next item, or a designated index
      * 
      * @method _advanceSlide
      * @param {string} Index to move to; if not supplied, advances to next
      * slide  
      * @private
      */
    _advanceSlide: function(index) {
      Y.log('_advanceSlide', 'info', this.name);
      Y.log(index, 'info', this.name);
      var pages = this.pages;
      if (Y.Lang.isValue(index)) {
        this._stopTimer();
        index = parseInt(index);
        pages.scrollToIndex(index);
        this._startTimer();
      } else {
        index = pages.get('index');
        (index < pages.get('total')-1) ? pages.next() : pages.scrollToIndex(0);
      }
  
    },
  
    /**
      * Checks to see if autoadvance is set then sets up the timeouts
      * 
      * @method _startTimer
      * @private
      */
    _startTimer: function() {
      Y.log('_startTimer', 'info', this.name);
  
      if (this.get('autoAdvance') === true) {
        var timer = Y.later(this.get('advanceDelay'), this, function() {
          if (this.get('pauseOnHover') !== true) {
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
      Y.log('_stopTimer', 'info', this.name);
      var timer = this.get('timer');
      if (timer) {
        timer.cancel(); 
      } 
    },
  
    /**
      * Mouseenter/mouseleave event handler
      * 
      * @method _pauseAutoAdvance
      * @private
      * @param e {object} mouseout or mouseover event object
      */
    _pauseAutoAdvance: function(e) {
      Y.log('pauseAutoAdvance', 'info', this.name);
      (e.type === "mouseenter") ? this.set('pauseOnHover', true) : this.set('pauseOnHover', false);
    },
  
    /**
      * Binds the navigate event listeners
      * 
      * @method bindUI
      * @private
      */
    bindUI: function() {
      Y.log('bindUI', 'info', this.name);
  
      //Call the parent bindUI method
      Y.juju.widgets.browser.CharmSlider.superclass.bindUI.apply(this);
  
      var that = this,
        events = this.get('_events'),
        boundingBox = this.get('boundingBox'),
        nav = boundingBox.one('.navigation');
      events.push(this.after('render', this._startTimer, this));
      events.push(boundingBox.on('mouseenter', this._pauseAutoAdvance, this));
      events.push(boundingBox.on('mouseleave', this._pauseAutoAdvance, this));
      events.push(nav.delegate('click', function() { 
        var index = this.getAttribute('data-index');
        that._advanceSlide(index);
      }, 'li'));
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
    },
  
    /**
      * Detaches events attached during instantiation
      *  
      * @method destructor
      * @private
      */
    destructor: function() {
      Y.log('destructor', 'info', this.name);
      this.get('_events').each(function(event) {
        event.detach();
      });
    }
  
  }, {
    ATTRS: {
  
      /**
       * @attribute width
       * @default 500
       * @type int
       *
       */
      width: {
        value: 500 
      },

      /**
       * @attribute autoAdvance
       * @default true
       * @type boolean
       *
       */
      autoAdvance: {
        value: true
      },
  
      /**
       * @attribute advanceDelay
       * @default 3000
       * @type int
       *
       */
      advanceDelay: {
        value: 3000
      },
  
      /**
       * @attribute pauseOnHover
       * @default false
       * @type boolean
       *
       */
      pauseOnHover: {
        value: false
      },
  
      /**
       * @attribute items
       * @default []
       * @type array
       *
       */
      items: {
        value: [],
        validator: function(val) {
          return (val.length <= this.get('max')); 
        }
      },

      /**
       * @attribute _events
       * @default []
       * @type array
       *
       */
      _events: {
        value: []
      },

      /**
       * @attribute max
       * @default 5
       * @type int
       *
       */
      max: {
        value: 5 
      },

      /**
       * @attribute timer
       * @default null
       * @type Object
       *
       */
      timer: {
        value: null 
      }
    }
  });
                                    
}, '0.1.0', {                             
  requires: [                                   
  "array-extras",
  "scrollview",
  "scrollview-paginator",
  "base-build",
  "event-mouseenter"
  ]
}); 
