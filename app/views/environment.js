'use strict';

/**
 * Provide the EnvironmentView class.
 *
 * @module views
 * @submodule views.environment
 */

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates;

  /**
   * Display an environment.
   *
   * @class EnvironmentView
   */
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View,
                                      [views.JujuBaseView],
      {
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
              db = this.get('db'),
              self = this;

          // If we need the initial HTML template, take care of that.
          if (!this._rendered) {
            EnvironmentView.superclass.render.apply(this, arguments);
            container.setHTML(Templates.overview());
            this._rendered = true;
          }

          if (!topo) {
            topo = new views.Topology();
            topo.setAttrs({
              size: [640, 480],
              env: this.get('env'),
              db: this.get('db'),
              landscape: this.get('landscape'),
              getModelURL: this.get('getModelURL'),
              container: container,
              endpointsController: this.get('endpointsController'),
              nsRouter: this.get('nsRouter')});
            // Bind all the behaviors we need as modules.
            topo.addModule(views.ServiceModule);
            topo.addModule(views.PanZoomModule);
            topo.addModule(views.ViewportModule);
            topo.addModule(views.RelationModule);
            topo.addModule(views.LandscapeModule);

            topo.addTarget(this);
            this.topo = topo;
          }

          topo.recordSubscription(
              'ServiceModule',
              db.services.after('remove', Y.bind(this.updateIndicator, this)));

          topo.recordSubscription(
              'ServiceModule',
              db.services.after('add', Y.bind(this.updateIndicator, this)));

          topo.render();
          topo.once('rendered', Y.bind(this.updateIndicator, this));
          return this;
        },

        /**
         * Support for canvas help function (when canvas is empty).
         *
         * @method updateIndicator
         */
        updateIndicator: function(evt) {
          var helpText = this.get('container').one('#environment-help'),
              db = this.get('db'),
              services = db.services;
          if (helpText) {
            if (services.size() === 0) {
              helpText.show(true);
            } else {
              helpText.hide(true);
            }
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
        }
      }, {
        ATTRS: {
          /**
            Applications router utility methods

            @attribute nsRouter
          */
          nsRouter: {}
        }
      });

  views.environment = EnvironmentView;

}, '0.1.0', {
  requires: ['juju-templates',
             'juju-view-utils',
             'juju-models',
             'juju-topology',
             'base-build',
             'handlebars-base',
             'node',
             'view']
});
