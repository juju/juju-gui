'use strict';

YUI.add('service-view-promise-support', function(Y) {


  /**
    Constructor function for serviceViewPromiseSupport extension
  */
  function serviceViewPromiseSupport() {}

  serviceViewPromiseSupport.prototype = {

    /**
      Sets up the service model callbacks and a listener to render once the
      promise returns.

      @method initializer
      @param {Object} cfg Object containing the view configuration data.
    */
    initializer: function(cfg) {
      this.after('modelChange', function() {
        this.render();
      }, this);

      if (Y.Promise.isPromise(cfg.service)) {
        cfg.service.then(
            Y.bind(this._serviceDataReceived, this),
            Y.bind(this._noServiceAvailable, this));
      }

    },
    /**
      Resolve callback for the model promise which sets the model
      data returned from a successful promise request.

      @method _serviceDataReceived
      @param {Object} model service model instance.
    */
    _serviceDataReceived: function(models) {
      // set the model with the data returned from the promise
      this.set('model', models.service);
    },

    /**
      Reject callback for the model promise which creates an error
      notification and then redirects the user to the evironment view

      @method _noServiceAvailable
    */
    _noServiceAvailable: function() {
      this.get('db').notifications.add(
          new Y.juju.models.Notification({
            title: 'Service is not available',
            message: 'The service you are trying to view does not exist',
            level: 'error'
          })
      );

      this.fire('navigateTo', {
        url: this.get('nsRouter').url({gui: '/'})
      });
    },

    /**
      Shared rendering method to render the loading service data view

      @method renderLoading
    */
    renderLoading: function() {
      var container = this.get('container');
      container.setHTML('<div class="alert">Loading service details...</div>');
      console.log('waiting on service data');
    },

    /**
      Shared rendering method to render the service data view

      @method renderData
    */
    renderData: function() {
      var container = this.get('container');
      var service = this.get('model');
      var db = this.get('db');
      var env = db.environment.get('annotations');
      container.setHTML(this.template(this.gatherRenderData()));
      this.fitToWindow();
      // to be able to use this same method for all service views
      if (container.one('.landscape-controls')) {
        Y.juju.views.utils.updateLandscapeBottomBar(this.get('landscape'),
            env, service, container);
      }
    },

    /**
      Shared render method to be used in service detail views

      @method render
      @return {Object} view instance.
    */
    render: function() {
      var container = this.get('container');
      var service = this.get('model');
      var db = this.get('db');
      var env = db.environment.get('annotations');
      if (!service || !service.get('loaded')) {
        this.renderLoading();
      } else {
        this.renderData();
      }
      return this;
    }
  };

  var ns = Y.namespace('juju.views.extensions');
  ns.serviceViewPromiseSupport = serviceViewPromiseSupport;

},
'',
{requires: [
    'promise'
]});
