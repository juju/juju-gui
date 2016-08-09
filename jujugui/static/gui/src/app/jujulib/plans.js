/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

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
      @param uuid {String} The UUID of the model the charm is being deployed
        on.
      @param charmUrl {String} URL of the charm being deployed.
      @param applicationName {String} name of the application.
      @param planUrl {String} The URL of the plan being deployed.
      @param budget {String} The budget name for allocation.
      @param limit {String} The numeric limit for allocation.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    authorizePlan: function(uuid, charmUrl, applicationName, planUrl, budget,
        limit, callback) {
      var url = this.url + '/plan/authorize';
      var payload = {
        'env-uuid': uuid,
        'charm-url': charmUrl,
        'service-name': applicationName,
        'plan-url': planUrl,
        'budget': budget,
        'limit': limit
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, callback);
    },

    /**
      Lists available plans for the given charm.

      @public listPlansForCharm
      @param charmUrl {String} A fully qualified charm URL, with or without
        the "cs:" schema.
      @param callback {Function} A callback to handle errors or accept the
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
      @param modelUUID {String} The model UUID.
      @param applicationName {String} The name of the application.
      @param callback {Function} A callback to handle errors or accept the
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
    showActivePlan: function(modelUUID, applicationName, callback) {
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
      var url = this.url + '/plan/model/' + modelUUID +
        '/service/' + applicationName;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Lists a user's budgets.

      @public listBudgets
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an object of budget data as its second, containing
        the following data:
          - budgets: an array of budgets;
          - total: an object container then summary of all budgets.
    */
    listBudgets: function(callback) {
      var handler = function(error, data) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, data);
      };
      var url = this.url + '/budget';
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Create a new budget for the authorised user.

      @public createBudget
      @param budget {String} The budget name.
      @param limit {String} The numeric limit.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    createBudget: function(budget, limit, callback) {
      var url = this.url + '/budget';
      var payload = {
        'budget': budget,
        'limit': limit
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, callback);
    },

    /**
      Changes the budget to the new limit.

      @method updateBudget
      @param budgetId {String} The budget name
      @param limit {String} The new budget value (numeric).
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    updateBudget: function(budgetId, limit, callback) {
      var url = this.url + '/budget/' + budgetId;
      var payload = { limit: limit };
      return jujulib._makeRequest(this.bakery, url, 'PATCH', payload, callback);
    },

    /**
      Removes a budget associated with the currently logged in user.

      @method removeBudget
      @param budgetId {String} The budget name
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    removeBudget: function(budgetId, callback) {
      var url = this.url + '/budget/' + budgetId;
      return jujulib._makeRequest(this.bakery, url, 'DELETE', null, callback);
    },

    /**
      Adds a budget allocation to an application.

      @method createAllocation
      @param budgetId {String} The budget name
      @param application {String} The application to set this allocation on.
      @param model {String} The model uuid
      @param limit {String} The limit for the allocation (numeric).
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    createAllocation: function(budgetId, application, model, limit, callback) {
      var url = this.url + '/budget/' + budgetId + '/allocation';
      var payload = {
        services: [application],
        model: model,
        limit: limit
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, callback);
    },

    /**
      Changes an allocation for an application

      @method updateAllocation
      @param model {String} The model uuid.
      @param app {String} the application name.
      @param limit {String} The limit for the allocation (numeric).
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    updateAllocation: function(model, app, limit, callback) {
      var url = this.url + '/model/' + model +
        '/service/' + app + '/allocation';
      var payload = { limit: limit };
      return jujulib._makeRequest(this.bakery, url, 'PATCH', payload, callback);
    },

    /**
      Removes the allocation from the service

      @method removeAllocation
      @param {String} app The application name.
      @param {String} model The model uuid
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    removeAllocation: function(app, model, callback) {
      var url = this.url + '/environment/' + model +
        '/service/' + app + '/allocation';
      return jujulib._makeRequest(this.bakery, url, 'DELETE', null, callback);
    },

    /**
      Get the details for a budget.

      @public showBudget
      @param budget {String} A buget name.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an object of budget data as its second, containing
        the following data:
          - limit: the budget limit;
          - total: an object container then summary of all budgets;
          - allocations: an array of allocation details.
    */
    showBudget: function(budget, callback) {
      var handler = function(error, data) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, data);
      };
      var url = this.url + '/budget/' + budget;
      return jujulib._makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Create a new profile and credit limit for the authorised user.

      @public createProfile
      @param user {String} The user's name.
      @param limit {String} The numeric limit.
      @param defaultBudget {String} The default budget name.
      @param defaultLimit {String} The numeric limit for the default budget.
      @param callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    createProfile: function(
      user, limit, defaultBudget, defaultLimit, callback) {
      var url = this.url + '/profile';
      var payload = {
        'user': user,
        'limit': limit,
        'default-budget': defaultBudget,
        'default-budget-limit': defaultLimit
      };
      return jujulib._makeRequest(this.bakery, url, 'POST', payload, callback);
    },

    /**
      Updates the users credit limit.

      @method updateCreditLimit
      @param {String} user The user's name.
      @param {String} limit The numeric limit.
      @param {Function} callback A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    updateCreditLimit: function(user, limit, callback) {
      var url = this.url + '/profile/' + user;
      var payload = { update: { limit: limit } };
      return jujulib._makeRequest(this.bakery, url, 'PATCH', payload, callback);
    },

    /**
      Updates the users default budget

      @method updateDefaultBudget
      @param {String} defaultBudget The default budgets name.
      @param {Function} callback A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and an authorization object as its second.
    */
    updateDefaultBudget: function(defaultBudget, callback) {
      var url = this.url + '/profile';
      var payload = { update: { 'default-budget': defaultBudget } };
      return jujulib._makeRequest(this.bakery, url, 'PATCH', payload, callback);
    }

  };

  /**
    Handles plan response data.

    @public _handlePlan
    @param plan {Object} The plan data returned by the plan service. It
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
