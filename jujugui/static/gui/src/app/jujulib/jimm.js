/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  var jujulib = exports.jujulib;

  /**
    JIMM API client.

    Provides access to the JIMM API.
  */

  var jimmAPIVersion = 'v2';

  /**
    Initializer.

    @function jimm
    @param url {String} The URL of the JIMM instance, including scheme, port
      and the trailing slash, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the JIMM
      instance.
    @returns {Object} A client object for making JIMM API calls.
  */
  function jimm(url, bakery) {
    // XXX j.c.sackett 2016-03-16 We should probably adopt the generate query
    // mechanism from charmstore but that's a larger rewrite. For now we're
    // making sure we can take the same initialization data for the JIMM URL as
    // we do for the charm store URL.
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + jimmAPIVersion;
    this.bakery = bakery;
  };


  /**
    Build a model from the response to model related JIMM API calls.

    @private _handleModel
    @params model {Object} The model object included in the JIMM response.
  */
  function _handleModel(model) {
    return {
      path: model.path,
      user: model.user,
      password: model.password,
      uuid: model.uuid,
      controllerPath: model['controller-path'],
      controllerUuid: model['controller-uuid'],
      caCert: model['ca-cert'],
      hostPorts: model['host-ports']
    };
  };


  /**
    Build a controller from the response to controller related JIMM API calls.

    @private _handleController
    @params controller {Object} The controller object included in the response.
  */
  function _handleController(controller) {
    return {
      path: controller.path,
      providerType: controller['provider-type'],
      schema: controller.schema,
      location: controller.location
    };
  };

  /**
    Decorate callbacks provided for "/location/*" based API calls.

    @private _handleLocation
    @params callback {Function} The user provided callback.
  */
  function _handleLocation(callback) {
    return function(error, response) {
      if (error !== null) {
        callback(error, null);
        return;
      }
      var values = [];
      if (response.Values && response.Values.length) {
        values = response.Values;
      }
      callback(null, values);
    };
  };


  jimm.prototype = {
    /**
      Lists the available models on the JIMM.

      @public listModels
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    listModels: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, response.models.map(_handleModel));
      };
      var url = this.url + '/model';
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Lists the available controllers on the JIMM.

      @public listControllers
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    listControllers: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, response.controllers.map(_handleController));
      };
      var url = this.url + '/controller';
      jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Retrieve info on a model.

      @public getModel
      @param ownerName {String} The user name of the given model's owner.
      @param name {String} The name of the model.
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    getModel: function (ownerName, name, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, _handleModel(response));
      };
      var url = [this.url, 'model', ownerName, name].join('/');
      jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Create a new model.

      @public newModel
      @param ownerName {String} The name of the given environment's owner.
      @param name {String} The name of the given environment.
      @param baseTemplate {String} The name of the config template to be used
          for creating the environment.
      @param location {Object} Key/value pairs describing the target
        controller, for instance "{'region': 'us-east-1', 'cloud': 'aws'}".
        This is used to narrow down the range of possible controllers to be
        used for the model.
      @param controller {String} The entityPath name of the controller to
          create the environment with. This is optional and may not be
          available to all users: when in doubt, use location above instead.
      @params callback {Function} A callback to handle errors or accept the
          data from the request. Must accept an error message or null as its
          first parameter and the response data as its second.
    */
    newModel: function (
        ownerName, name, baseTemplate, location, controller, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, _handleModel(response));
      };
      var body = {
        name: name,
        templates: [baseTemplate]
      };
      if (location) {
        body.location = location;
      }
      if (controller) {
        body.controller = controller;
      }
      var url = [this.url, 'model', ownerName].join('/');
      jujulib._makeRequest(this.bakery, url, 'POST', body, handler);
    },

    /**
      List available clouds in JIMM.

      @public listClouds
      @params callback {Function} A callback to handle errors or accept the
          data from the request. Must accept an error message or null as its
          first parameter and an array of clouds as its second.
    */
    listClouds: function (callback) {
      var url = this.url + '/location/cloud';
      jujulib._makeRequest(
        this.bakery, url, 'GET', null, _handleLocation(callback));
    },

    /**
      List regions available in the given cloud.

      @public listRegions
      @param cloud {String} The name of the cloud (for instance "aws").
        This can be one of the values retrieved by calling listClouds above.
      @params callback {Function} A callback to handle errors or accept the
          data from the request. Must accept an error message or null as its
          first parameter and an array of regions as its second.
    */
    listRegions: function (cloud, callback) {
      var url = this.url + '/location/region?cloud=' + cloud;
      jujulib._makeRequest(
        this.bakery, url, 'GET', null, _handleLocation(callback));
    },

    /**
      Queries the whoami service for auth info.

      @method whoami
      @param callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    whoami: function(callback) {
      var url = this.url + '/whoami';
      jujulib._makeRequest(
        this.bakery,
        url,
        'GET',
        null,
        jujulib._transformAuthObject.bind(this, callback),
        true,
        // turn off redirect, we want to silently fail
        // if the macaroon is valid.
        false
      );
    },

    /**
      Lists all the templates for cloud credentials for the currently
      authenticated user.

      @method listTemplates
      @param callback {Function} A callback to handle errors or accept the data
        from the request. Must accept an error message or null as its first
        parameter and the response data as its second.
    */
    listTemplates: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        var templates = response.templates || [];
        var data = templates.map(function(template) {
          return {
            path: template.path,
            schema: template.schema,
            config: template.config,
            location: template.location
          };
        });
        callback(null, data);
      };
      var url = this.url + '/template';
      return jujulib._makeRequest(
        this.bakery, url, 'GET', null, handler, true);
    },

    /**
      Adds a new template for the currently authenticated user in JIMM.

      @method addTemplate
      @param ownerName the owner the template.
      @param templateName the name of the template.
      @param template A JavaScript object holding the information for the
        template - a 'controller' key, and a 'config' key with credentials.
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addTemplate: function(ownerName, templateName, template, callback) {
      var handler = function(error, response) {
        callback(error || null);
      };
      var url = [this.url, 'template', ownerName, templateName].join('/');
      return jujulib._makeRequest(
        this.bakery, url, 'PUT', template, handler, false);
    },

    /**
      Deletes a given template for the currently authenticated user in JIMM.

      @method deleteTemplate
      @param ownerName the owner the template.
      @param templateName the name of the template.
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    deleteTemplate: function(ownerName, templateName, callback) {
      var handler = function(error, response) {
        callback(error || null);
      };
      var url = [this.url, 'template', ownerName, templateName].join('/');
      return jujulib._makeRequest(
        this.bakery, url, 'DELETE', null, handler, false);
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.jimm = jimm;
  jujulib.jimmAPIVersion = jimmAPIVersion;

}((module && module.exports) ? module.exports : this));
