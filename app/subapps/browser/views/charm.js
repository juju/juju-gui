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
      '#code select': {
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
       Creates the Bazaar url for the charm/bundle.

       @method _getSourceLink
       @protected
       @param {String} lp_url The short Launchpad URL.
       @return {String} Bazaar URL for browsing code.
     */
    _getSourceLink: function(lp_url) {
      // Get the full URL to the Launchpad branch.
      var url = ns.EntityBaseView.prototype._getSourceLink(lp_url);
      // Append the file-browsing part.
      return url + '/files';
    },

    /**
       Creates the url for a given revision of the charm.

       @method _getRevnoLink
       @protected
       @param {String} sourceLink The charm's source_link.
       @param {String} revno The charm commit's revision number.
     */
    _getRevnoLink: function(sourceLink, revno) {
      return sourceLink.replace('files', 'revision/') + revno;
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
      var charm = this.get('entity');
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: {
              id: null }}});
      } else {
        this.fire('viewNavigate', {change: {charmID: null}});
      }
      var ghostAttributes;
      ghostAttributes = {
        icon: this.get('store').iconpath(charm.get('storeId'))
      };
      this.get('deployService').call(null, charm, ghostAttributes);
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

      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: { id: charmID }
          }});
      } else {
        this.fire('viewNavigate', {change: change});
      }

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
     * Render the view of a single charm details page.
     *
     * @method _renderCharmView
     * @param {Charm} charm the charm model instance to view.
     */
    _renderCharmView: function(charm) {
      this.set('entity', charm);

      var templateData = charm.getAttrs(),
          container = this.get('container');
      var siteDomain = 'jujucharms.com',
          charmPath = this.get('entity').get('storeId'),
          link = 'https://' + siteDomain + '/' + charmPath;
      templateData.isLocal = templateData.scheme === 'local';
      templateData.forInspector = this.get('forInspector');
      if (templateData.files) {
        // Exclude svg files from the source view.
        var regex = /\.svg$/;
        templateData.files = templateData.files.filter(function(name) {
          return !regex.test(name);
        });
      }
      if (!templateData.forInspector) {
        templateData.sourceLink = this._getSourceLink(
            this.get('entity').get('code_source').location);
        templateData.prettyCommits = this._formatCommitsForHtml(
            templateData.recentCommits, templateData.sourceLink);
      }
      templateData.interfaceIntro = this._getInterfaceIntroFlag(
          templateData.requires, templateData.provides);
      templateData.link = escape(link);
      templateData.twitterText = escape(
          'Check out this great charm on ' + siteDomain + ': ' + link);
      templateData.emailSubject = escape(
          'Check out this great charm on ' + siteDomain + '!');
      templateData.emailText = escape(
          'Check out this great charm on ' + siteDomain + ': ' + link);

      if (Y.Object.isEmpty(templateData.requires)) {
        templateData.requires = false;
      }
      if (Y.Object.isEmpty(templateData.provides)) {
        templateData.provides = false;
      }

      var template = this.template(templateData);

      // Set the content then update the container so that it reloads
      // events.
      var renderTo = this.get('renderTo');
      renderTo.setHTML(container.setHTML(template));

      this._setupTabview();
      this._dispatchTabEvents(this.tabview);
      this._showActiveTab();
      this._setCollapsableHeader();
    },

    /**
       Render out the view to the DOM.

       The View might be given either a entityId, which means go fetch the
       charm data, or a charm model instance, in which case the view has the
       data it needs to render.

       @method render

     */
    render: function() {
      this.showIndicator(this.get('renderTo'));

      if (this.get('entity')) {
        this._renderCharmView(this.get('entity'));
        this.hideIndicator(this.get('renderTo'));
      } else {
        this.get('store').charm(this.get('entityId'), {
          'success': function(data) {
            var charm = new models.Charm(data.charm);
            if (data.metadata) {
              charm.set('metadata', data.metadata);
            }
            this.set('charm', charm);
            this._renderCharmView(charm);
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
