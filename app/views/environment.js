'use strict';
/**
 * Provides the main app class.
 *
 * @module environment
 */

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates;

  /**
   * Display an environment.
   *
   * @class environment
   * @namespace views
   */
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View,
                                      [views.JujuBaseView],
      {
        initializer: function() {
          console.log('View: Initialized: Env');
          this.publish('navigateTo', {
            broadcast: true,
            preventable: false});
        },

        render: function() {
          var container = this.get('container'),
              topo = this.topo;

          //If we need the initial HTML template
          // take care of that.
          if (!this.rendered) {
            EnvironmentView.superclass.render.apply(this, arguments);
            container.setHTML(Templates.overview());
            this.rendered = true;
          }

          if (!topo) {
            topo = new views.Topology();
            topo.setAttrs({
              size: [640, 480],
              env: this.get('env'),
              db: this.get('db'),
              getServiceEndpoints: this.get('getServiceEndpoints'),
              container: container});
            // Bind all the behaviors we need as modules.
            topo.addModule(views.MegaModule);
            topo.addModule(views.PanZoomModule);
            topo.addModule(views.ViewportModule);

            topo.addTarget(this);
            this.topo = topo;
          }

          topo.render();
          return this;
        },

        postRender: function() {
          this.topo.attachContainer();
          this.topo.fire('rendered');
          // Bind d3 events (manually).
          this.topo.bindAllD3Events();
        }
      }, {
        ATTRS: {}
      });

  views.environment = EnvironmentView;
}, '0.1.0', {
  requires: ['juju-templates',
             'juju-view-utils',
             'juju-models',
             'juju-topology',
             'svg-layouts',
             'base-build',
             'handlebars-base',
             'node',
             'view']
});
