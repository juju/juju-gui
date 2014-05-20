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
      templates = views.Templates,
      widgets = Y.namespace('juju.widgets');

  ns.CharmBrowser = Y.Base.create('charmbrowser', Y.View, [
    views.utils.apiFailingView,
    Y.Event.EventTracker,
    widgets.browser.IndicatorManager
  ], {

    events: {
      '.token': {
        click: '_handleCharmSelection'
      }
    },

    curatedQtys: {
      featured: 3,
      popular: 2,
      'new': 2
    },

    template: '<div class="search-widget"></div><div class="charm-list"></div>',
    curatedTemplate: templates.editorial,
    searchResultTemplate: templates.search,

    /*
      Sets the default properties.

      @method initializer
    */
    initializer: function() {
      this.tokenContainers = [];
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

      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: { id: charmID }
          }});
      } else {
        this.fire('viewNavigate', {
          change: {
            charmID: charmID,
            hash: undefined
          }
        });
      }
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
      Loads the curated charm lists from charmworld.

      @method _loadCurated
    */
    _loadCurated: function() {
      var store = this.get('store');
      store.interesting({
        'success': function(data) {
          var result = data.result,
              transform = store.transformResults;
          var results = {
            featured: transform(result.featured),
            popular: transform(result.popular),
            'new': transform(result['new'])
          };
          this._renderCurated(results);
        },
        failure: this.apiFailure.bind(this, 'curated')
      }, this);
    },

    /**
      Renders the curated charm list into the container.

      @method _renderCurated
      @param {Object} results The curated charm list.
    */
    _renderCurated: function(results) {
      var content = Y.Node.create(this.curatedTemplate()),
          TokenContainer = widgets.browser.TokenContainer,
          tokenContainers = [],
          tokenContainer = {};

      var tokenTypes = ['featured', 'popular', 'new'];
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
        tokenContainer.render(content.one('.' + tokenType));
        tokenContainers.push(tokenContainer);
      }, this);

      this.tokenContainers = tokenContainers;
      var container = this.get('container'),
          charmList = container.one('.charm-list');
      this.hideIndicator(container.get('parentElement'));
      charmList.append(content);
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
      var charmContainer = this.get('container').get('parentElement');
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
            // when switching between search and editorial views the above code
            // which adds the sticky class to the first header is required to
            // avoid throwing an error here.
            charmContainer.one('.sticky:last-child .section-title')
                          .setStyle('marginTop', newOffset + 'px');
          }
        });
      });
    },

    /**
      Renders the search widget into the container.

      @method _renderSearch
    */
    _renderSearch: function() {},

    /**
      Renders the search results into the container.

      @method _renderSearchResults
    */
    _renderSearchResults: function() {},

    /**
      Renders either the curated charm list or the search results list.

      @method render
      @param {String} type The type of list to render
    */
    render: function(parentContainer, type) {
      var container = this.get('container');
      container.setHTML(this.template); // XXX
      container.appendTo(parentContainer);
      this._renderSearch();

      this.showIndicator(container.get('parentElement'));

      if (type === 'curated') {
        // XXX When caching is implemented it will likely go here.
        this._loadCurated();
      } else if (type === 'search') {
        this._renderSearchResults();
      }
    },

    /**
      Update the node in the editorial list marked as 'active'.

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
      var tokenContainers = this.tokenContainers;
      if (tokenContainers.length > 0) {
        tokenContainers.forEach(function(container) {
          container.destroy();
        });
      }
    }

  });

}, '', {
  requires: [
    'browser-token-container',
    'event-tracker',
    'juju-view-utils',
    'view',
    'juju-models'
  ]
});
