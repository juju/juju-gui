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

/**
 * Provide the EnvironmentView class.
 *
 * @module views
 * @submodule views.environment
 */

YUI.add('juju-view-environment', function(Y) {

  let views = Y.namespace('juju.views');

  /**
   * Display an environment.
   *
   * @class EnvironmentView
   */
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [
    views.JujuBaseView, Y.Event.EventTracker
  ], {

    events: {
      '.environment-help .plus-service': {
        click: '_handlePlusClick'
      }
    },

    /**
     * @method EnvironmentView.initializer
     */
    initializer: function() {
      this.publish('navigateTo', {
        broadcast: true,
        preventable: false});
    },

    /**
     * Wrapper around topo.update. Rather than re-rendering a whole
     * topology, the view can require data updates when needed.
     * Ideally even this should not be needed, as we can observe
     * ModelList change events and debounce update calculations
     * internally.
     *
     * @method update
     * @chainable
     */
    update: function() {
      this.topo.update();
      return this;
    },

    /**
     * @method render
     * @chainable
     */
    render: function() {
      var container = this.get('container'),
          topo = this.topo,
          db = this.get('db');

      // If we need the initial HTML template, take care of that.
      if (!this._rendered) {
        EnvironmentView.superclass.render.apply(this, arguments);
        ReactDOM.render(
          <juju.components.Environment />,
          container.getDOMNode());
        this._rendered = true;
      }

      topo = this.createTopology();
      topo.recordSubscription(
          'ServiceModule',
          db.services.after('remove',
                            Y.bind(this.updateHelpIndicator, this)));

      topo.recordSubscription(
          'ServiceModule',
          db.services.after('add', Y.bind(this.updateHelpIndicator, this)));

      topo.render();
      topo.once('rendered', Y.bind(this.updateHelpIndicator, this));
      return this;
    },

    /**
      createTopology, called automatically.

      @method createTopology
     */
    createTopology: function() {
      var container = this.get('container'),
          topo = this.topo;
      if (!topo) {
        topo = new views.Topology({includePlus: true});
        topo.setAttrs({
          size: [640, 480],
          ecs: this.get('ecs'),
          env: this.get('env'),
          environmentView: this,
          db: this.get('db'),
          bundleImporter: this.get('bundleImporter'),
          container: container,
          endpointsController: this.get('endpointsController'),
          state: this.get('state'),
          staticURL: this.get('staticURL')
        });
        // Bind all the behaviors we need as modules.
        topo.addModule(views.ServiceModule, {useTransitions: true});
        topo.addModule(views.PanZoomModule);
        topo.addModule(views.ViewportModule);
        topo.addModule(views.RelationModule);

        topo.addTarget(this);
        this.topo = topo;
      }
      return topo;
    },

    /**
     * Support for canvas help function (when canvas is empty).
     *
     * @method updateHelpIndicator
     */
    updateHelpIndicator: function(evt) {
      var helpText = this.get('container').one('.environment-help'),
          includedPlus = this.topo.vis.select('.included-plus'),
          db = this.get('db'),
          services = db.services;
      if (helpText) {
        if (services.size() === 0) {
          helpText.show();
          helpText.removeClass('shrink');
          includedPlus.classed('show', false);
        } else {
          helpText.addClass('shrink');
          includedPlus.classed('show', true);
        }
      }
    },

    /**
      fades in or out the help indicator.

      @method fadeHelpIndicator
      @param {Boolean} fade Whether it should fade it in or out.
    */
    fadeHelpIndicator: function(fade) {
      const container = this.get('container');
      const helpImg = container.one('.environment-help__image');
      const tooltip = container.one('.environment-help__tooltip');
      const dropMessage = container.one('.environment-help__drop-message');
      const existingApps = this.get('db').services.size() > 0;
      // If there are existing apps then the onboarding should not be
      // displayed behind the drop notification.
      const showOnboarding = !existingApps;
      const helpActiveClass = 'environment-help__drop-message--active';
      if (helpImg) {
        if (fade) {
          if (existingApps) {
            // If there are apps then the onboarding will be hidden, so we
            // need to display it again temporarily to display the drop
            // notification. This class will be re-added when the drop finishes
            // and updateHelpIndicator is called above.
            container.one('.environment-help').removeClass('shrink');
          }
          dropMessage.addClass(helpActiveClass);
        } else {
          dropMessage.removeClass(helpActiveClass);
        }
        tooltip.setStyle('opacity', showOnboarding && !fade ? 1 : 0);
        helpImg.setStyle('opacity', showOnboarding ? 1 : 0);
      }
    },
    /**
     * Render callback handler, triggered from app when the view renders.
     *
     * @method render.rendered
     */
    rendered: function() {
      this.topo.fire('rendered');
      // Bind d3 events (manually).
      this.topo.bindAllD3Events();
    },

    /**
      Handles clicking on the plus button in the onboarding.

      @method _handlePlusClick
      @param {Object} e The click event
    */
    _handlePlusClick: function(e) {
      this.get('sendAnalytics')(
        'Onboarding',
        'Click',
        'Onboarding plus'
      );
      this.get('state').changeState({
        root: 'store'
      });
    }
  });

  views.environment = EnvironmentView;

}, '0.1.0', {
  requires: [
    'base-build',
    'event-tracker',
    'environment',
    'juju-topology',
    'node',
    'view'
  ]
});
