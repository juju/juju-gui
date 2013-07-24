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

//XXX jcsackett Jul 24 2013 This whole file and associated bits can probably be
//axed once the new service inspector is no longer flagged.

/**
 * Provide the CharmView class.
 *
 * @module views
 * @submodule views.charm
 */

YUI.add('juju-view-charm-collection', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models');

  var CharmView = Y.Base.create('CharmView', Y.View, [], {
    initializer: function() {
      this.set('charm', null);
      console.log('Loading charm view', this.get('charm_data_url'));
      this.get('store').charm(this.get('storeId'), {
        'success': Y.bind(this.on_charm_data, this),
        'failure': function er(e) { console.error(e.error); }
      });
      // Bind visualization resizing on window resize.
      Y.on('windowresize', Y.bind(function() {
        this.fitToWindow();
      }, this));
    },

    /**
    Fit to window.  Must be called after the container
    has been added to the DOM.

    @method fitToWindow
    */

    fitToWindow: function() {
      var container = this.get('container'),
          viewContainer = container.one('.view-container');
      if (viewContainer) {
        Y.fire('beforePageSizeRecalculation');
        var navbar = Y.one('.navbar'),
            navbarHeight = navbar ? navbar.get('clientHeight') : 0,
            windowHeight = container.get('winHeight'),
            size = (Math.max(windowHeight, 600) - navbarHeight - 9);
        viewContainer.set('offsetHeight', size);
        Y.fire('afterPageSizeRecalculation');
      }
    },

    template: Templates.charm,

    render: function() {
      var charm = this.get('charm'),
          container = this.get('container');

      if (Y.Lang.isNull(container._node)) {
        // If the container node isn't in the dom yet then just return
        // This avoids a console error caused by out of order rendering
        return;
      }
      CharmView.superclass.render.apply(this, arguments);
      if (!charm) {
        container.setHTML('<div class="alert">Loading...</div>');
        return;
      }

      var options = charm.get('options'),
          settings;
      if (options) {
        settings = utils.extractServiceSettings(options);
      }

      container.setHTML(this.template({
        charm: charm.getAttrs(),
        settings: settings}));

      var self = this;
      setTimeout(function() {
        self.fitToWindow();
      }, 100);

      container.one('#charm-deploy').on(
          'click', Y.bind(this.on_charm_deploy, this));
      return this;
    },

    on_charm_data: function(data) {
      data.id = data.store_url;
      data.is_subordinate = data.subordinate;
      var charm = new Y.juju.models.Charm(data);
      this.set('charm', charm);
      this.render();
    },

    on_charm_deploy: function(evt) {
      var charmId = this.get('charm').get('id'),
          container = this.get('container'),
          env = this.get('env');

      // Gather the configuration values from the form.
      var serviceName = container.one('#service-name').get('value'),
          config = utils.getElementsValuesMapping(container,
              '#service-config .config-field');

      // The deploy call generates an event chain leading to a call to
      // `app.on_database_changed()`, which re-dispatches the current view.
      // For this reason we need to redirect to the root page right now.
      this.fire('navigateTo', {url: '/:gui:/'});
      env.deploy(
        charmId,
        serviceName,
        config,
        Y.bind(this._deployCallback, this)
      );
    },

    _deployCallback: function(ev) {
      if (ev.err) {
        this.get('db').notifications.add(
            new models.Notification({
              title: 'Error deploying charm',
              message: 'Service name: ' + ev.service_name +
                  '; Charm url: ' + ev.charm_url,
              level: 'error'
            })
        );
        return;
      }
      console.log(ev.charm_url + ' deployed');
    }
  });
  views.charm = CharmView;

}, '0.1.0', {
  requires: [
    'node',
    'handlebars',
    'datasource-io',
    'datasource-jsonschema',
    'io-base',
    'json-parse',
    'juju-charm-models',
    'view']
});
