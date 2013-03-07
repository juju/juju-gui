'use strict';


/**
 * Provide the Charm Slider widget.
 *
 * @module widgets
 * @submodule juju.widgets.browser.charm-slider
 */
YUI.add('browser-charm-slider', function(Y) {
  var sub = Y.Lang.sub;
  var ns = Y.namespace('juju.widgets.browser');
  
  /**
    @class CharmSlider
    @extends ScrollView
    @constructor
  */
  ns.CharmSlider = new Y.Base.create('browser-charm-slider', Y.ScrollView, [], {
  
    /**
      Image slider container template
  
      @property imageSliderTemplate
      @public
      @type string
     */
    charmSliderTemplate: '<ul width="{width}px" />',
  
    /**
      Image item template
  
      @property imageTemplate
      @public
      @type string
     */
    itemTemplate: '<li width="{width}px" data-index="{index}" />',
  
    /**
      Template used for the navigation controls.
  
      @property prevNavTemplate
      @public
      @type string
    */
    navTemplate: '<ul class="navigate"></div>',

    /** DOCTSTRINGS HERE **/
    navItemTemplate: '<li data-index="{index}">O</li>',
  
    /**
      Pagination plugin
  
      @method initializer
      @param cfg {object} Module configuration object
      @private
    */
    initializer: function(cfg) {
      this.plug(Y.Plugin.ScrollViewPaginator, {
        selector: 'li'
      });
     
    },
  
    /* SOME DOCS GO HERE */
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
      Generates and appends the navigation controls for the slider
  
      @method _generateSliderControls
      @protected
    */
    _generateSliderControls: function() {
      Y.log('_generateSliderControls', 'info', this.name);
      var that = this,
          navClass = this.getClassName() + '-navigation',
          nav = Y.Node.create(this.navTemplate);
      Y.Array.each(this.get('items'), function(item, index) {
        nav.append(Y.Node.create(sub(
            that.navItemTemplate, {index: index})));
      });
      this.get('boundingBox').append(nav);
    },
  
    /**
      Advances the photo and description to the next appropriate value
  
      @method _advanceSlide
      @protected
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
      Checks to see if autoadvance is set then sets up the timeouts
  
      @method _startTimer
      @private
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

    /** DOCSTRING **/
    _stopTimer: function() {
      Y.log('_stopTimer', 'info', this.name);
      var timer = this.get('timer');
      if (timer) {
        timer.cancel(); 
      } 
    },
  
    /**
      Mouseenter/mouseleave event handler
  
      @method _pauseAutoAdvance
      @private
      @param e {object} mouseout or mouseover event object
    */
    _pauseAutoAdvance: function(e) {
      Y.log('pauseAutoAdvance', 'info', this.name);
      (e.type === "mouseenter") ? this.set('pauseOnHover', true) : this.set('pauseOnHover', false);
    },
  
    /**
      Binds the navigate event listeners
  
      @method bindUI
      @private
    */
    bindUI: function() {
      Y.log('bindUI', 'info', this.name);
  
      //Call the parent bindUI method
      Y.juju.widgets.browser.CharmSlider.superclass.bindUI.apply(this);
  
      var that = this,
        events = this.get('_events'),
        boundingBox = this.get('boundingBox'),
        nav = boundingBox.one('.navigate');
      events.push(this.after('render', this._startTimer, this));
      events.push(boundingBox.on('mouseenter', this._pauseAutoAdvance, this));
      events.push(boundingBox.on('mouseleave', this._pauseAutoAdvance, this));
      events.push(nav.delegate('click', function() { 
        var index = this.getAttribute('data-index');
        that._advanceSlide(index);
      }, 'li'));
    },

    renderUI: function() {
      this.get('contentBox').setHTML(this._generateDOM());
      this._generateSliderControls();
    },
  
    /**
      Detaches events attached during instantiation
  
      @method destructor
      @private
    */
    destructor: function() {
      Y.log('destructor', 'info', this.name);
      this.get('_events').each(function(event) {
        event.detach();
      });
    }
  
  }, {
    ATTRS: {
  
      /** THIS NEEDS DOCS **/
      width: {
        value: 500 
      },
      /**
        Weather the slider should automatically advance
  
        @attribute autoAdvance
        @public
        @type boolean
        @default true
      */
      autoAdvance: {
        value: true
      },
  
      /**
        Amount of time to wait between autoadvances
  
        @attribute advanceDelay
        @public
        @type integer
        @default 3000
      */
      advanceDelay: {
        value: 3000
      },
  
      /**
        If the slider should pause then the user hovers on it
  
        @attribute pauseOnHover
        @public
        @type boolean
        @default false
      */
      pauseOnHover: {
        value: false
      },
  
      /**
        Items data array
  
        @attribute items
        @public
        @type array
        @default []
      */
      items: {
        value: [],
        validator: function(val) {
          return (val.length <= this.get('max')); 
        }
      },

      /**
        Collection of event handlers to detach on destroy
  
        @attribute _events
        @private
        @default []
        @type array
      */
      _events: {
        value: []
      },

      max: {
        value: 5 
      },

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
