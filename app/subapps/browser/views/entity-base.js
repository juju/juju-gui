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

YUI.add('subapp-browser-entitybaseview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      widgets = Y.namespace('juju.widgets');

  /**
    Provides the shared methods for the Charm and Bundle browser views.

    @class EntityBaseView
  */
  function EntityBaseView() {}

  EntityBaseView.prototype = {

    /**
     * Shared method to generate a message to the user based on a bad api
     * call.
     *
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     *
     */
    apiFailure: function(data, request) {
      this._apiFailure(data, request, 'Failed to load charm details.');
    },

    /**
     * Event handler for clicking on a hook filename to load that file.
     *
     * @method _loadHookContent
     * @param {Event} ev the click event created.
     *
     */
    _loadHookContent: function(ev) {
      var index = ev.currentTarget.get('selectedIndex');
      var filename = ev.currentTarget.get('options').item(
          index).getAttribute('value'),
          node = this.get('container').one('#code .filecontent');

      // Load the file, but make sure we prettify the code.
      if (filename) {
        this._loadFile(node, filename, true);
      }
    },

    /**
      Watch the tab control for change events and load the content
      if required using the labels as the keys.

      @method _dispatchTabEvents
      @param {TabView} tabview the tab control to monitor.
    */
    /**
      Flag to indicate that we have loaded the interfaces content

      @property _interfacesContentLoaded
    */
    /**
      Flag to indicate that we have loaded the readme content

      @property _readmeContentLoaded
    */
    _dispatchTabEvents: function(tabview) {
      this.addEvent(
          tabview.after('selectionChange', function(e) {
            switch (e.newVal.get('hash')) {
              case '#related-charms':
                if (!this._interfacesContentLoaded) {
                  this._loadInterfacesTabCharms();
                }
                this._interfacesContentLoaded = true;
                break;
              case '#readme':
                if (!this._readmeContentLoaded) {
                  this._loadReadmeTab();
                }
                this._readmeContentLoaded = true;
            }
          }, this));
    },

    /**
       Creates the Bazaar url for the charm/bundle.

       @method _getSourceLink
       @private
       @param {String} lp_url The short Launchpad URL.
       @return {String} Bazaar URL.
     */
    _getSourceLink: function(lp_url) {
      var url = lp_url.replace('lp:', 'http://bazaar.launchpad.net/');
      // Append the file-browsing part.
      return url + '/files';
    },

    /**
       Creates the url for a given revision of the entity.

       @method _getRevnoLink
       @private
       @param {String} sourceLink The entity's source_link.
       @param {String} revno The entity commit's revision number.
     */
    _getRevnoLink: function(sourceLink, revno) {
      return sourceLink + '/' + revno;
    },

    /**
     * Commits need to be formatted, dates made pretty for the output to the
     * template. We have to break up the first one from the rest since it's
     * displayed differently.
     *
     * @method _formatCommitsForHtml
     * @param {Array} commits a list of commit objects.
     *
     */
    _formatCommitsForHtml: function(commits, sourceLink) {
      var firstTmp;
      var prettyCommits = {
        remaining: []
      };

      // No commits then just return an empty list.
      if (!commits) {
        return [];
      }

      if (commits.length > 0) {
        firstTmp = commits.shift();
        prettyCommits.first = firstTmp;
        prettyCommits.first.prettyDate = Y.Date.format(
            prettyCommits.first.date);
        prettyCommits.first.revnoLink = this._getRevnoLink(
            sourceLink, prettyCommits.first.revno);
      }

      Y.Array.each(commits, function(commit) {
        commit.prettyDate = Y.Date.format(
            commit.date);
        commit.revnoLink = this._getRevnoLink(sourceLink, commit.revno);
        prettyCommits.remaining.push(commit);
      }, this);

      // Put our first item back on the commit list.
      if (firstTmp) {
        commits.unshift(firstTmp);
      }

      return prettyCommits;
    },

    /**
        Handle the back button being clicked on from the header of the
        details.

        @method _handleBack
        @param {Event} ev the click event handler.

     */
    _handleBack: function(ev) {
      ev.halt();
      this.fire('changeState', {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: null, hash: null }
        }});
    },

    /**
      Make the panel header collapse when you scroll

      @method _setCollapsableHeader

     */
    _setCollapsableHeader: function() {
      var container = this.get('container');
      if (container) {
        var scrollable = container.one('.tab-panels');
        // Need to apply the transition class after the page has rendered
        // to stop the animation firing on page load in Safari.
        scrollable.addClass('animate-scroll');
        scrollable.on('scroll', function(e) {
          if (this.get('scrollTop') > 50) {
            container.addClass('collapsed');
          } else {
            container.removeClass('collapsed');
          }
        });
      }
    },

    /**
     * Load Readme file content into the tab.
     *
     * @method _loadReadmeTab
     */
    _loadReadmeTab: function() {
      // Start loading the readme so it's ready to go.
      if (!this.loadedReadme) {
        var tplNode = this.get('container');
        var readme = this._locateReadme();

        if (readme) {
          this._loadFile(tplNode.one('#readme'), readme);
        } else {
          this._noReadme(tplNode.one('#readme'));
        }
        this.loadedReadme = true;
      }
    },

    /**
     * The readme file in a charm can be upper/lower/etc. This helps find a
     * readme from the list of files in a charm.
     *
     * @method _locateReadme
     * @private
     *
     */
    _locateReadme: function() {
      var files = this.get('entity').get('files'),
          match = 'readme';

      return Y.Array.find(files, function(file) {
        if (file.toLowerCase().slice(0, 6) === match) {
          return true;
        }
      });
    },

    /**
     * Fetch the contents from a file and drop it into the container
     * specified.
     *
     * @method _loadFile
     * @param {Node} container the node to set content to.
     * @param {String} filename the name of the file to fetch from the api.
     * @private
     *
     */
    _loadFile: function(container, filename, prettify) {
      // Enable the indicator on the container while we load.
      this.showIndicator(container);
      var entity = this.get('entity');
      // If this is a bundle it won't have a storeId
      var id = entity.get('storeId') || entity.get('id');
      this.get('charmstore').getFile(id, filename,
          function(data) {
            data = data.target.responseText;
            if (prettify) {
              // If we say we want JS-prettified, use the prettify module.
              Y.prettify.renderPrettyPrintedFile(
                  container, Y.Escape.html(data));
            } else if (filename.slice(-3) === '.md') {
              // else if it's a .md file, render the markdown to html.
              container.setHTML(Y.Markdown.toHTML(data));
            } else {
              // Else just stick the content in a pre so it's blocked.
              container.setHTML(Y.Node.create('<pre/>').setContent(data));
            }

            this.hideIndicator(container);
          }.bind(this),
          this.apiFailure.bind(this));
    },

    /**
     * When there is no readme setup some basic 'nothing found content'.
     *
     * @method _noReadme
     * @param {Node} container the node to drop this default content into.
     *
     */
    _noReadme: function(container) {
      container.setHTML('<h3>Charm has no README</h3>');
    },

    /**
       Handles the links in the sharing widget to ensure they open in a new
       window.

       @method _openShareLink
       @param {Y.EventFacade} e The click event.
     */
    _openShareLink: function(e) {
      e.halt();
      var shareLink = e.currentTarget.get('href');
      window.open(shareLink, 'share_window');
    },

    /**
     * Clicking on the open log should toggle the list of log entries.
     *
     * @method _toggleLog
     * @param {Event} ev the click event of the open log control.
     * @private
     *
     */
    _toggleLog: function(ev) {
      ev.halt();
      var container = this.get('container'),
          target = ev.currentTarget,
          state = target.getData('state'),
          more = target.one('.more'),
          less = target.one('.less');

      if (state === 'closed') {
        // open up the changelog.
        container.one('.changelog .remaining').removeClass('hidden');
        target.setData('state', 'open');
        more.addClass('hidden');
        less.removeClass('hidden');
      } else {
        // close up the changelog.
        container.one('.changelog .remaining').addClass('hidden');
        target.setData('state', 'closed');
        less.addClass('hidden');
        more.removeClass('hidden');
      }
    },

    /**
      Creates the tabview instance for the bundle view

      @method _setupTabView
    */
    _setupTabview: function() {
      /**
        Tabview instance used to display the bundle details.

        @property tabview
      */
      var container = this.get('container');
      this.tabview = new widgets.browser.TabView({
        container: container.one('.tabs')
      });
      this.tabview.render();
      // Need to reset the scroll position on every tab change.
      this.tabview.after('selectionChange', function(e) {
        var panel = container.one('.tab-panels');
        if (panel) {
          panel.set('scrollTop', 0);
        }
      }, this);
    },

    /**
      Shows the active tabview tab set via the browser subapp.

      @method _showActiveTab
    */
    _showActiveTab: function() {
      var activeTab = this.get('activeTab');
      if (activeTab) {
        var tab = this.get('container')
                      .one('.tabs a[href="' + activeTab + '"]');
        if (tab) {
          this.tabview.setTab(tab);
        }
      }
    }
  };

  EntityBaseView.ATTRS = {
    /**
      @attribute activeTab
      @default undefined
      @type {String}

     */
    activeTab: {},

    /**
       @attribute entityId
       @default undefined
       @type {Int}
    */
    entityId: {},

    /**
     * The charm we're viewing the details of.
     *
     * @attribute entity
     * @default undefined
     * @type {juju.models.Charm | juju.models.Bundle}
     *
     */
    entity: {},

    /**
    * @attribute forInspector
    * @default {Boolean} false
    * @type {Boolean}
    */
    forInspector: {
      value: false
    },

    /**
     * @attribute renderTo
     * @default {Node} .bws-view-data node.
     * @type {Node}
     *
     */
    renderTo: {
      /**
       * @method renderTo.valueFn
       * @return {Node} the renderTo node.
       *
       */
      valueFn: function() {
        return Y.one('.bws-view-data');
      }
    },

    /**
     * The "deploy" function prompts the user for service configuration and
     * deploys a service.
     *
     * The proper deploy function is provided from the browser subapp.
     *
     * @attribute deployService
     * @default undefined
     * @type {Function}
     *
     */
    deployService: {},

    /**
     * The "deploy" function prompts the user for service configuration and
     * deploys a service.
     *
     * The proper deploy function is provided from the browser subapp.
     *
     * @attribute deployBundle
     * @default undefined
     * @type {Function}
     *
     */
    deployBundle: {}

  };

  ns.EntityBaseView = EntityBaseView;

});
