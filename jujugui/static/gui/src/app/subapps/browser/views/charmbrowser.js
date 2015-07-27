/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/*
  Sidebar charm browser view.

  @module juju.browser
  @submodule views
*/
YUI.add('juju-charmbrowser', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      utils = views.utils,
      templates = views.Templates,
      widgets = Y.namespace('juju.widgets');

  ns.CharmBrowser = Y.Base.create('charmbrowser', Y.View, [
    views.utils.apiFailingView,
    Y.Event.EventTracker,
    widgets.browser.IndicatorManager,
    views.SearchWidgetMgmtExtension,
    views.AddedServicesButtonExtension
  ], {

    events: {
      '.token': {
        click: '_handleCharmSelection'
      }
    },

    curatedQtys: {
      recommended: 3,
      other: 7,
      popular: 10
    },

    template: templates.charmbrowser,
    popularTemplate: templates.popular,
    searchResultTemplate: templates.search,

    /*
      Sets the default properties.

      @method initializer
    */
    initializer: function() {
      this.tokenContainers = [];
      this.activeRequestId = null;
      this.searchWidget = null;
      this._bindEvents();
    },

    /**
      Binds the custom events.

      @method _bindEvents
    */
    _bindEvents: function() {
      this.addEvent(
          this.on('activeIDChange', function(e) {
            var id = e.newVal;
            this.updateActive(
                this.get('container').one('.token[data-charmid="' + id + '"]'));
          }));
      var services = this.get('db').services;
      this.addEvent(
          services.after('add', function(e) {
            // Provided by 'added-services-button.js'.
            this._renderAddedServicesButton(services.size(), true);
          }, this));
      this.addEvent(
          services.after('remove', function(e) {
            // Provided by 'added-services-button.js'.
            this._renderAddedServicesButton(services.size(), true);
          }, this));
    },

    /**
        When selecting a charm from the list make sure we re-route the app to
        the details view with that charm selected.

        @method _handleCharmSelection
        @param {Event} ev the click event handler for the charm selected.
     */
    _handleCharmSelection: function(ev) {
      ev.halt();
      var charm = ev.currentTarget;
      var charmID = charm.getData('charmid');

      // Update the UI for the active one.
      this.updateActive(ev.currentTarget);
      this.fire('changeState', {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: charmID }
        }});
    },

    /**
      Generates a message to the user based on a bad api call.
      @method apiFailure
      @param {String} type The type of request that failed.
      @param {Object} data The json decoded response text.
      @param {Object} request The original io_request object for debugging.
    */
    apiFailure: function(type, data, request) {
      this._apiFailure(data, request, 'Failed to load ' + type + ' content.');
    },

    /**
      Renders the charm list into the container.

      @method _renderCharmTokens
      @param {Object} results The curated charm list.
      @param {Array} tokenTypes A list of token types
    */
    _renderCharmTokens: function(results, tokenTypes, template) {
      var content = Y.Node.create(this[template]()),
          TokenContainer = widgets.browser.TokenContainer,
          tokenContainers = [],
          tokenContainer = {},
          container = this.get('container'),
          charmList = container.one('.charm-list');
      // Append the content of the template to the charmlist ahead of time
      // so that we can render the token containers to the DOM as they're
      // generated.
      charmList.append(content);

      tokenTypes.forEach(function(tokenType) {
        tokenContainer = new TokenContainer({
          name: tokenType,
          cutoff: this.curatedQtys[tokenType],
          children: results[tokenType].map(function(charm) {
            return charm.getAttrs();
          }),
          side: 'small',
          isDraggable: true
        });
        // Render the token container to the DOM as it is generated in order
        // to reduce visible lag as the browser works on generating each
        // token.
        tokenContainer.render(charmList.one('.' + tokenType));
        tokenContainers.push(tokenContainer);
      }, this);

      this.tokenContainers = tokenContainers;
      this.hideIndicator(charmList);
      // Set the active charm if available.
      var active = this.get('activeID');
      if (active) {
        this.updateActive(
            charmList.one('.token[data-charmid="' + active + '"]'));
      }
      this._makeStickyHeaders();
    },

    /**
      Makes the headers in the charm lists sticky

      @method makeStickyHeaders
    */
    _makeStickyHeaders: function() {
      var charmContainer = this.get('container').one('.charm-list');
      var headings = charmContainer.all('.section-title');
      var headingHeight = 53; // The height of the heading block in pixels

      headings.each(function(heading) {
        // In order to get Firefox to display the headers with the proper width
        // we need to set the headings width to the width of its parent.
        // Firefox in OSX with a trackpad does not include any scrollbar
        // dimensions so the scroll indicator appears under the headings.
        heading.setStyle('width',
            heading.get('parentNode').getComputedStyle('width'));
      });

      var stickyHeaders = charmContainer.all('.stickable');
      // To avoid a flash in Chrome on Ubuntu we need to add the sticky
      // class to the first element before the user scrolls.
      stickyHeaders.item(0).addClass('sticky');

      this._stickyEvent = charmContainer.on('scroll', function(e) {
        // The number of pixels that the charmContainer is scrolled upward.
        var scrollTop = this.get('scrollTop');
        stickyHeaders.each(function(heading, index) {
          // Need to get offset for the in place header, not the fixed one.
          // The number of pixels that the heading--in its normal, non-sticky
          // placement--is offset from the charmContainer, irrespective of
          // scrolling.
          var offsetTop = heading.get('parentNode').get('offsetTop');

          // Reset the header to its original position
          heading.one('.section-title').setStyle('marginTop', 0);
          heading.removeClass('current');

          // Apply the calculations to determine where the
          // header should be positioned relative to the scroll and container
          if (scrollTop > offsetTop) {
            heading.addClass('sticky');
            // The currently visible sticky heading is the
            // last with the class 'sticky'.
            charmContainer.all('.sticky:last-child').addClass('current');
          } else if (heading.hasClass('sticky')) {
            // If it is not scrolled up then remove the sticky classes
            // We need to leave the first one with the sticky class because
            // without it Chrome on Ubuntu will flash when it jumps from
            // position relaive to position fixed.
            if (index > 0) {
              heading.removeClass('sticky');
            }
          } else if (scrollTop > offsetTop - headingHeight) {
            // If a new heading is coming in, push the previous one up
            var newOffset = -(headingHeight - (offsetTop - scrollTop));
            // Get the currently visible sticky heading.
            // Because the browser sometimes scrolls the container to the top
            // when switching between search views the above code
            // which adds the sticky class to the first header is required to
            // avoid throwing an error here.
            charmContainer.one('.sticky:last-child .section-title')
                          .setStyle('marginTop', newOffset + 'px');
          }
        });
      });
    },

    /**
      Requests the search results from the charm store.

      @method _loadSearchResults
      @param {Object} filters The set of filters to pass to the charmstore api
        request instead of using the ones which were passed into the view. This
        is only used to load the 'curated' result list. Any search filters
        should still be done by setting the attribute on the charmbrowser view.
      @param {Boolean} popular A flag to determine if the UI to render should be
        for the popular results or the normal search results.
    */
    _loadSearchResults: function(filters, popular) {
      filters = filters || this.get('filters');
      var cacheKey = Y.QueryString.stringify(filters),
          searchCache = this.get('cache').get(cacheKey),
          headers = ['recommended', 'other'],
          template = 'searchResultTemplate',
          successHandler = '_loadSearchSuccessHandler';
      if (popular) {
        headers = ['popular'];
        template = 'popularTemplate';
        successHandler = '_loadPopularSuccessHanlder';
      }
      if (searchCache) {
        this._renderCharmTokens(searchCache, headers, template);
      } else {
        this.activeRequestId = this.get('charmstore').search(
            filters,
            this[successHandler].bind(this),
            this.apiFailure.bind(this, 'search'));
      }
    },

    /**
      The success handler for the store's search call from _loadSearchResults
      for the popular list of charms.

      @method _loadPopularSuccessHanlder
      @param {Object} data The data from the store search results call.
    */
    _loadPopularSuccessHanlder: function(data) {
      // Shuffle the results to keep them appearing fresh
      data = utils.shuffleArray(data);
      var entityData = {
        popular: data
      };
      this.get('cache').set(
          Y.QueryString.stringify(this.get('filters')), entityData);
      this._renderCharmTokens(entityData, ['popular'], 'popularTemplate');
    },

    /**
      The success handler for the store's search call from _loadSearchResults.

      @method _loadSearchSuccessHandler
      @param {Object} data The data from the store search results call.
    */
    _loadSearchSuccessHandler: function(data) {
      var recommended = [],
          other = [];
      var series = this.get('envSeries')() || 'trusty';
      data.map(function(entity) {
        // If this is a charm, make sure it's approved and is of the
        // correct series to be recommended.
        var approved = entity.get('is_approved');
        if (entity.entityType === 'bundle') {
          /* jshint -W030 */
          /* Expected an assignment or function call */
          (approved) ? recommended.push(entity) : other.push(entity);
        } else {
          if (approved && (entity.get('series') === series)) {
            recommended.push(entity);
          } else {
            other.push(entity);
          }
        }
      }, this);
      var cache = this.get('cache');
      var entityData = {
        recommended: recommended,
        // The token type is called 'other' instead of 'new' because 'new'
        // clashes with class names of other elements.
        other: other
      };
      cache.set(Y.QueryString.stringify(this.get('filters')), entityData);
      this._renderCharmTokens(
          // If you change these change them in _loadSearchResults too.
          entityData, ['recommended', 'other'], 'searchResultTemplate');
    },

    /**
      Removes the token and detaches DOM bound events. This allows the render
      method to be immutable. Also called by the destructor.

      @method _cleanUp
    */
    _cleanUp: function() {
      var tokenContainers = this.tokenContainers;
      if (tokenContainers.length > 0) {
        tokenContainers.forEach(function(container) {
          container.destroy();
        });
      }
      if (this._stickyEvent) {
        this._stickyEvent.detach();
      }
      var charmList = this.get('container').one('.charm-list');
      if (charmList) {
        this.hideIndicator(charmList);
      }

      if (this.searchWidget) {
        this.searchWidget.destroy();
      }
    },

    /**
      Renders either the curated charm list or the search results list.

      This method should always be idempotent.

      @method render
      @param {Object} metadata The charmbrowser state metadata.
      @param {Boolean} searchChanged Whether or not the search value changed.
    */
    render: function(metadata, searchChanged) {
      // To keep render idempotent we check to see if any changes have been
      // made since the last time it's been rendered.
      if (!this._shouldRender(metadata, searchChanged)) {
        return;
      }
      var container = this.get('container'),
          renderType = this.get('renderType');
      this._cleanUp(); // Clear out any existing tokens.
      container.setHTML(this.template());
      container.appendTo(this.get('parentContainer'));
      // Provided by 'search-widget-mgmt-extension'.
      this._renderSearchWidget();
      // Provided by 'added-services-button.js'.
      this._renderAddedServicesButton(this.get('db').services.size(), true);

      this.showIndicator(container.one('.charm-list'));

      // If there is no id data then deselect any potentially active tokens.
      if (!metadata || !metadata.id) {
        this.updateActive();
      }

      if (renderType === 'curated') {
        this.set('withHome', false);
        this._loadSearchResults({
          limit: 20,
          owner: '',
          sort: '-downloads',
          // If the user visits the application with a hash in the url there is
          // a race condition and the envSeries is not yet populated so we
          // need to default it.
          series: this.get('envSeries')() || 'trusty'
        }, true);
      } else if (renderType === 'search') {
        this.set('withHome', true);
        this._loadSearchResults();
      }
    },

    /**
      Every time the charmbrowser state changes its render method is called.
      This determines whether it should actually render or not

      @method _shouldRender
      @param {Object} metadata The charmbrowser state metadata.
      @param {Boolean} searchChanged Whether or not the search value changed.
      @return {Boolean} Whether the charmbrowser view should render or not.
    */
    _shouldRender: function(metadata, searchChanged) {
      var renderType = this.get('renderType'),
          shouldRender = false,
          requestedType = 'curated';

      if (metadata && metadata.search) {
        requestedType = 'search';
        if (searchChanged) {
          shouldRender = true;
        }
      }

      if (renderType !== requestedType) {
        this.set('renderType', requestedType);
        shouldRender = true;
      }

      return shouldRender;
    },

    /**
      Update the node in the charm list marked as 'active'.

      @method updateActive
      @param {Node} clickTarget the token clicked on to activate.
    */
    updateActive: function(clickTarget) {
      Y.all('.yui3-token.active').removeClass('active');
      if (clickTarget) {
        clickTarget.ancestor('.yui3-token').addClass('active');
      }
    },

    /*
      Destroys the rendered tokens.

      @method destructor
    */
    destructor: function() {
      this._cleanUp();
      this.get('container').remove(true);
    }
  },
  {
    ATTRS: {
      /**
        The type of view to render

        @attribute renderType
        @type {String}
      */
      renderType: {},
      /**
        Whether we should show the 'Home' button with the search widget or not.

        @attribute withHome
        @type {Boolean}
      */
      withHome: {}
    }
  });

}, '', {
  requires: [
    'added-services-button',
    'browser-token-container',
    'browser-overlay-indicator',
    'event-tracker',
    'juju-models',
    'juju-view-utils',
    'querystring',
    'search-widget-mgmt-extension',
    'view'
  ]
});
