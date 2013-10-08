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


YUI.add('subapp-browser-charmview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');

  /**
   * View for the Charm details UI.
   *
   * @class CharmView
   * @extends {Y.View}
   *
   */
  ns.BrowserCharmView = Y.Base.create('browser-view-charmview', Y.View, [
    widgets.browser.IndicatorManager,
    Y.Event.EventTracker,
    views.utils.apiFailingView,
    ns.EntityBaseView
  ], {

    template: views.Templates.browser_charm,
    qatemplate: views.Templates.browser_qa,

    /**
     * List the DOM based events to watch for in the container.
     * @attribute events
     *
     */
    events: {
      '.token': {
        click: '_handleCharmSelection'
      },
      '.charm .add': {
        click: '_addCharmEnvironment'
      },
      // Following handlers are provided by entity-base.js
      // Mixins do not mix properties so this has to be done manually
      '.changelog h3 .expandToggle': {
        click: '_toggleLog'
      },
      '#bws-code select': {
        change: '_loadHookContent'
      },
      '.charm .back': {
        click: '_handleBack'
      },
      '#sharing a': {
        click: '_openShareLink'
      }
    },

    /**
     * Begin the service creation process by showing the service configuration
     * form.
     *
     * @method _addCharmEnvironment
     * @param {Event} ev the event from the click handler.
     * @return {undefined} Nothing.
     * @private
     *
     */
    _addCharmEnvironment: function(ev) {
      ev.halt();
      var charm = this.get('entity'),
          attrs = charm.getAttrs();
      if (this.get('isFullscreen')) {
        this.fire('viewNavigate',
            {change: {viewmode: 'sidebar', charmID: null}});
      } else {
        this.fire('viewNavigate', {change: {charmID: null}});
      }
      var ghostAttributes;
      ghostAttributes = {
        icon: this.get('store').iconpath(charm.get('storeId'))
      };
      this.get('deploy').call(null, charm, ghostAttributes);
    },

    /**
      Navigate when selecting a charm token in the view.

      @method _handleCharmSelection
      @param {Event} ev the click event for the selected charm.

     */
    _handleCharmSelection: function(ev) {
      ev.halt();
      var charm = ev.currentTarget;
      var charmID = charm.getData('charmid');
      var change = {
        charmID: charmID,
        hash: undefined
      };

      this.fire('viewNavigate', {change: change});
    },

    /**
     * Determine which intro copy to display depending on the number
     * of interfaces.
     *
     *  The goal is to build a property string like: noRequiresNoProvides
     *
     * @method _getInterfaceIntroFlag
     * @param {Array} commits a list of commit objects.
     *
     */
    _getInterfaceIntroFlag: function(requires, provides) {
      var interfaceIntro = {},
          prefixes = ['no', 'one', 'many'],
          build = '';

      // Which prefix is used is based on the number of each item we check.
      var counts = {
        requires: requires ? Y.Object.keys(requires).length : 0,
        provides: provides ? Y.Object.keys(provides).length : 0
      };

      // Go through both requires and provides and build a string to be used
      // for generating our attribute such as 'noRequiresNoProvides'.
      Y.Array.each(['requires', 'provides'], function(check, idx) {
        var string = '';

        // Given the count, check which prefix we should be using.
        switch (counts[check]) {
          case 0:
            string += prefixes[0];
            break;
          case 1:
            string += prefixes[1];
            break;
          default:
            string += prefixes[2];
        }

        // Append the name of the field we're checking, but upper cased.
        string += check.charAt(0).toUpperCase() + check.slice(1);

        // And finally, if the index is > 0, we need to camel case the start
        // of the string as well.
        if (idx > 0) {
          build += string.charAt(0).toUpperCase() + string.slice(1);
        } else {
          build += string;
        }
      });
      interfaceIntro[build] = true;
      return interfaceIntro;
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
          node = this.get('container').one('#bws-code .filecontent');

      // Load the file, but make sure we prettify the code.
      if (filename) {
        this._loadFile(node, filename, true);
      }
    },

    /**
     * Load the related charms data and display the related charms into each
     * interface of the charm.
     *
     * @method _loadInterfacesTabCharms
     *
     */
    _loadInterfacesTabCharms: function() {
      // If we don't have our related-charms data then force it to load.
      var relatedCharms = this.get('entity').get('relatedCharms');

      if (!relatedCharms) {
        // If we don't have the related charm data, go get and call us back
        // when it's done loading so we can update the display.
        this._loadRelatedCharms(this._loadInterfacesTabCharms);
      } else {
        this._renderRelatedInterfaceCharms('requires', relatedCharms.requires);
        this._renderRelatedInterfaceCharms('provides', relatedCharms.provides);
        this.loadedRelatedInterfaceCharms = true;
      }
    },

    /**
      Clean up after ourselves.

      @method destructor

     */
    destructor: function() {
      if (this.tabview) {
        this.tabview.destroy();
      }

      if (this.relatedTokenContainer) {
        this.relatedTokenContainer.destroy();
      }

      if (this.charmTokens) {
        this.charmTokens.forEach(function(token) {
          token.destroy();
        });
      }
    },

    /**
      Generic YUI initializer. Make sure we track indicators for cleanup.

      @method initializer
      @param {Object} cfg configuration object.
      @return {undefined} Nothing.
     */
    initializer: function(cfg) {
      // Hold onto references of the indicators used so we can clean them all
      // up. Indicators are keyed on their yuiid so we don't dupe them.
      this.indicators = {};
      this.loadedReadme = false;
      this.loadedRelatedCharms = false;
      this.loadedRelatedInterfaceCharms = false;

      // Load up the provider template helpers we need to output pretty
      // template names.
      Y.juju.models.browser.registerHelpers();
    },

    /**
     * Render out a charmtoken for the related charms for each interface.
     *
     * @method _renderRelatedInterfaceCharms
     * @param {String} type Is this for provides or requires?
     * @param {Object} relatedCharms An object of the interfaces and related
     * charms for each.
     *
     */
    _renderRelatedInterfaceCharms: function(type, relatedCharms) {
      if (!this.loadedRelatedInterfaceCharms) {
        this.charmTokens = [];
        Y.Object.each(relatedCharms, function(list, iface) {
          // we only care about the top three charms in the list.
          var charms = list.slice(0, 3);
          charms.forEach(function(charm) {
            var uiID = [
              type,
              iface
            ].join('-');

            charm.size = 'tiny';
            var ct = new widgets.browser.Token(charm);
            var node = Y.one('[data-interface="' + uiID + '"]');
            ct.render(node);
            this.charmTokens.push(ct);
          }, this);
        }, this);
      }
    },

    /**
      Render the related charms sidebar. It generates a charm container with
      the tokens.

      @method _renderRelatedCharms
      @param {Object} charm the charm model we're rendering the related
      charms for.

     */
    _renderRelatedCharms: function() {
      if (!this.loadedRelatedCharms) {
        var relatedCharms = this.get('entity').get('relatedCharms');
        // If there are no overall related charms then just skip it all.
        if (relatedCharms.overall) {
          var relatedNode = this.get('container').one('.related-charms');
          this.relatedTokenContainer = new widgets.browser.TokenContainer(
              Y.merge({
                name: 'Related Charms',
                cutoff: 10,
                children: relatedCharms.overall
              }));
          this.relatedTokenContainer.render(relatedNode);
          this.hideIndicator(Y.one('.related-charms'));
        }
        this.loadedRelatedCharms = true;
      }
    },

    /**
     * Render the view of a single charm details page.
     *
     * @method _renderCharmView
     * @param {Charm} charm the charm model instance to view.
     * @param {Boolean} isFullscreen is this display for the fullscreen
     * experiecne?
     *
     */
    _renderCharmView: function(charm, isFullscreen) {
      this.set('entity', charm);

      var tplData = charm.getAttrs(),
          container = this.get('container');
      var siteDomain = 'jujucharms.com',
          charmPath = this.get('entity').get('storeId'),
          link = 'https://' + siteDomain + '/' + charmPath;
      tplData.isFullscreen = isFullscreen;
      tplData.isLocal = tplData.scheme === 'local';
      tplData.forInspector = this.get('forInspector');
      if (!tplData.forInspector) {
        tplData.sourceLink = this._getSourceLink();
        tplData.prettyCommits = this._formatCommitsForHtml(
            tplData.recent_commits, tplData.sourceLink);
      }
      tplData.interfaceIntro = this._getInterfaceIntroFlag(
          tplData.requires, tplData.provides);
      tplData.link = escape(link);
      tplData.twitterText = escape(
          'Check out this great charm on ' + siteDomain + ': ' + link);
      tplData.emailSubject = escape(
          'Check out this great charm on ' + siteDomain + '!');
      tplData.emailText = escape(
          'Check out this great charm on ' + siteDomain + ': ' + link);

      if (Y.Object.isEmpty(tplData.requires)) {
        tplData.requires = false;
      }
      if (Y.Object.isEmpty(tplData.provides)) {
        tplData.provides = false;
      }

      var tpl = this.template(tplData);

      // Set the content then update the container so that it reload
      // events.
      var renderTo = this.get('renderTo');
      renderTo.setHTML(container.setHTML(tpl));

      this._setupTabview();
      this._dispatchTabEvents(this.tabview);


      if (isFullscreen) {
        if (!this.get('entity').get('relatedCharms')) {
          this.showIndicator(Y.one('.related-charms'));
          this._loadRelatedCharms(this._renderRelatedCharms);
        } else {
          // We have related charm info, get to rendering them.
          this._renderRelatedCharms();
        }
      }

      if (this.get('activeTab')) {
        var tab = this.get('container').one(
            '.tabs a[href="' + this.get('activeTab') + '"]');
        if (tab) {
          tab.get('parentNode').simulate('click');
        }
      }

      // XXX: Ideally we shouldn't have to do this; resetting the container
      // with .empty or something before rendering the charm view should work.
      // But it doesn't so we scroll the nav bar into view, load the charm
      // view at the top of the content.
      if (!tplData.forInspector) {
        // Do NOT use scrollIntoView as IE will move the whole environment. We
        // just reset the scrollTop directly which jumps, but works cross
        // browser.
        renderTo._node.scrollTop = 0;
      }
    },

    /**
       Render out the view to the DOM.

       The View might be given either a entityId, which means go fetch the
       charm data, or a charm model instance, in which case the view has the
       data it needs to render.

       @method render

     */
    render: function() {
      var isFullscreen = this.get('isFullscreen');
      this.showIndicator(this.get('renderTo'));

      if (this.get('entity')) {
        this._renderCharmView(this.get('entity'), isFullscreen);
        this.hideIndicator(this.get('renderTo'));
      } else {
        this.get('store').charm(this.get('entityId'), {
          'success': function(data) {
            var charm = new models.Charm(data.charm);
            if (data.metadata) {
              charm.set('metadata', data.metadata);
            }
            this.set('charm', charm);
            this._renderCharmView(charm, isFullscreen);
            this.hideIndicator(this.get('renderTo'));
          },
          'failure': this.apiFailure
        }, this);
      }
    }
  }, {
    ATTRS: {} // See entity-base.js for attributes
  });

}, '0.1.0', {
  requires: [
    'subapp-browser-entitybaseview',
    'browser-token-container',
    'browser-overlay-indicator',
    'browser-tabview',
    'datatype-date',
    'datatype-date-format',
    'event-tracker',
    'event-simulate',
    'gallery-markdown',
    'juju-charm-store',
    'juju-browser-models',
    'juju-models',
    'juju-templates',
    'juju-views',
    'juju-view-utils',
    'node',
    'prettify',
    'view'
  ]
});
