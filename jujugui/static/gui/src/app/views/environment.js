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

  var JujuBaseView = Y.Base.create('JujuBaseView', Y.Base, [], {

    bindModelView: function(model) {
      model = model || this.get('model');
      // If this view has a model, bubble model events to the view.
      if (model) {
        model.addTarget(this);
      }

      // If the model gets swapped out, reset targets accordingly and rerender.
      this.after('modelChange', function(ev) {
        if (ev.prevVal) {
          ev.prevVal.removeTarget(this);
        }
        if (ev.newVal) {
          ev.newVal.addTarget(this);
        }
        this.render();
      });

      // Re-render this view when the model changes, and after it is loaded,
      // to support "loaded" flags.
      this.after(['*:change', '*:load'], this.render, this);
    }

  });

  /**
   * Display an environment.
   *
   * @class EnvironmentView
   */
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [
    JujuBaseView
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
      const container = this.getContainer();
      let topo = this.topo;
      const db = this.get('db');
      // If we need the initial HTML template, take care of that.
      if (!this._rendered) {
        EnvironmentView.superclass.render.apply(this, arguments);
        /* eslint-disable no-undef */
        ReactDOM.render(
          <juju.components.Environment />,
          container);
        /* eslint-enable */
        this._rendered = true;
      }

      topo = this.createTopology();
      topo.recordSubscription(
        'ServiceModule',
        db.services.after('reset', this.updateHelpIndicator.bind(this)));
      topo.recordSubscription(
        'ServiceModule',
        db.services.after('remove', this.updateHelpIndicator.bind(this)));
      topo.recordSubscription(
        'ServiceModule',
        db.services.after('add', this.updateHelpIndicator.bind(this)));

      topo.render();
      this.boundRenderedHandler = this.updateHelpIndicator.bind(this);
      document.addEventListener('topo.rendered', this.boundRenderedHandler);

      this.updateHelpIndicator();

      return this;
    },

    destroy: function() {
      if (this.boundRenderedHandler) {
        document.removeEventListener(
          'topo.rendered', this.boundRenderedHandler);
      }
    },

    /**
      Get the DOM node if the container has been provided by YUI, otherwise the
      container will be the DOM node already.

      @method getContainer
      @return {Object} A DOM node.
    */
    getContainer: function() {
      const container = this.get('container');
      return container.getDOMNode && container.getDOMNode() || container;
    },

    /**
      createTopology, called automatically.

      @method createTopology
     */
    createTopology: function() {
      const container = this.getContainer();
      let topo = this.topo;
      if (!topo) {
        topo = new window.views.Topology({
          includePlus: true,
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
        topo.addModule(window.views.ServiceModule, {useTransitions: true});
        topo.addModule(window.views.PanZoomModule);
        topo.addModule(window.views.ViewportModule);
        topo.addModule(window.views.RelationModule);
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
      const container = this.getContainer();
      var helpText = container.querySelector('.environment-help'),
          includedPlus = this.topo.vis.select('.included-plus'),
          db = this.get('db'),
          services = db.services;
      if (helpText) {
        if (services.size() === 0) {
          helpText.removeAttribute('style');
          helpText.classList.remove('shrink');
          includedPlus.classed('show', false);
        } else {
          helpText.classList.add('shrink');
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
      const container = this.getContainer();
      const helpImg = container.querySelector('.environment-help__image');
      const tooltip = container.querySelector('.environment-help__tooltip');
      const dropMessage = container.querySelector(
        '.environment-help__drop-message');
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
            container.querySelector('.environment-help').classList.remove(
              'shrink');
          }
          dropMessage.classList.add(helpActiveClass);
        } else {
          dropMessage.classList.remove(helpActiveClass);
        }
        tooltip.style.opacity = showOnboarding && !fade ? 1 : 0;
        helpImg.style.opacity = showOnboarding ? 1 : 0;
      }
    },
    /**
     * Render callback handler, triggered from app when the view renders.
     *
     * @method render.rendered
     */
    rendered: function() {
      document.dispatchEvent(new Event('topo.rendered'));
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
    'node',
    'view'
  ]
});
