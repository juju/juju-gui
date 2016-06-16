/* Copyright (C) 2016 Canonical Ltd. */

var module = module;

(function (exports) {
  'use strict';

  var jujulib = exports.jujulib;

  /**
    Romulus plans service client.

    Provides access to the Romulus plans API.
  */

  var plansAPIVersion = 'v2';

  /**
    Initializer.

    @function plans
    @param url {String} The URL of the Romulus plans instance, including
      scheme and port, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the plans
      instance.
    @returns {Object} A client object for making Romulus plans API calls.
  */
  function plans(url, bakery) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + plansAPIVersion;
    this.bakery = bakery;
  };

  plans.prototype = {
    /**
      Get a plan authorization to deploy a charm.

      @public authorizePlan
      @params env-uuid {String} UUID of the environment the charm is being deployed on
      @params charm-url {String} URL of the charm being deployed
      @params service-name {String} name of the service
      @params plan-url {String} url of the plan being deployed
      @params budget {String} budget name for allocation
      @params limit {String} numeric limit for allocation
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    authorizePlan: function(envUUID, charmUrl, serviceName, planUrl, budget,
        limit, callback) {
      var url = this.url + '/plan/authorize';
      var payload = {
        'env-uuid': envUUID,
        'charm-url': charmUrl,
        'service-name': serviceName,
        'plan-url': planUrl,
        'budget': budget,
        'limit': limit
      }
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, callback);
    },

    /**
      Lists available plans for the given charm.

      @public listPlansForCharm
      @params charmUrl {String} A fully qualified charm URL, with or without
        the "cs:" schema.
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and a list of plans as its second. Each plan includes
        the following fields:
          - url: the plan URL, like "canonical-landscape/24-7";
          - price: the price for this plan;
          - description: a text describing the plan;
          - createdAt: a date object with the plan creation time;
          - yaml: the YAML content for the plan
            (not really useful in this context).
    */
    listPlansForCharm: function(charmUrl, callback) {
      var handler = function(error, plans) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, plans.map(_handlePlan));
      };
      if (charmUrl.substring(0, 3) !== 'cs:') {
        charmUrl = 'cs:' + charmUrl;
      }
      var url = this.url + '/charm?charm-url=' + charmUrl;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Finds the currently active plan for the given model and application.

      @public showActivePlan
      @params modelUuid {String} The model UUID.
      @params applicationName {String} The name of the application.
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter the currently active plan as its second argument, and a
        list of available plans as its third. Each plan includes the following
        fields:
          - url: the plan URL, like "canonical-landscape/24-7";
          - price: the price for this plan;
          - description: a text describing the plan;
          - createdAt: a date object with the plan creation time;
          - yaml: the YAML content for the plan
            (not really useful in this context).
    */
    showActivePlan: function(modelUuid, applicationName, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null, []);
          return;
        }
        var availablePlans = response['available-plans'];
        var plans = Object.keys(availablePlans).map(function(key) {
          return _handlePlan(availablePlans[key]);
        });
        var current = availablePlans[response['current-plan']];
        callback(null, _handlePlan(current), plans);
      };
      var url = this.url + '/status/' + modelUuid + '/' + applicationName;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    }

  };

  /**
    Handles plan response data.

    @public _handlePlan
    @params plan {Object} The plan data returned by the plan service. It
      includes at least the following fields:
        - url: the plan URL, like "canonical-landscape/24-7";
        - price: the price for this plan;
        - description: a text describing the plan;
        - created-on: the creation time string, like "2016-06-08T15:54:13Z";
        - plan: the YAML content for the plan.
    @return {Object} A JavaScript friendly representation of a plan.
  */
  var _handlePlan = function(plan) {
    var milliseconds = Date.parse(plan['created-on']);
    return {
      url: plan.url,
      price: plan.price,
      description: plan.description,
      createdAt: new Date(milliseconds),
      yaml: plan.plan
    };
  };

  // Populate the library with the API client and supported version.
  jujulib.plans = plans;
  jujulib.plansAPIVersion = plansAPIVersion;

}((module && module.exports) ? module.exports : this));
