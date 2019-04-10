/* Copyright (C) 2017 Canonical Ltd. */
'use strict';


/**
  Factory that returns a function for sending analytics to GA.

  @param {String} controllerAPI For checking status of the user.
  @param {String} dataLayer The GA dataLayer instance.
  @return {function} The curryed function for sending analaytics.
*/
const sendAnalyticsFactory = function(controllerAPI, dataLayer) {

  /**
    The retunrned function that sends stats to GA.

    @param {String} category A sensible category name. Generally the
      component name is a good start.
    @param {String} action Some identifiable action.
    @param {String} label Name the event. This might be enough for
      some events.
    @param {Object} value An optional single depth object for
      extra information.
  */
  return function(category, action, label, value) {
    // We want to check for required params to provide good feedback for
    // developers - this is a fail fast way to ensure required fields are
    // set. On the other hand, we don't want to block the execution in case
    // of errors while sending analytics.
    const requiredArgs = ['category', 'action', 'label'];
    for (let i = 0, ii = requiredArgs.length; i < ii; i+= 1) {
      if (!arguments[i]) {
        console.error(`cannot send analytics: ${requiredArgs[i]} required`);
        return;
      }
    }
    if (!dataLayer) {
      return null;
    }
    let loggedIn = undefined;
    // Sometimes this doesn't get set...
    // Always decorate with whether the user is logged in
    if (controllerAPI) {
      loggedIn = controllerAPI.userIsAuthenticated;
    }
    let valueObj = {
      loggedIn: loggedIn
    };
    let valueArr = [];
    let valueStr;

    if (value) {
      Object.keys(value).forEach(key => {
        valueObj[key] = value[key];
      });
    }

    Object.keys(valueObj).forEach(key => {
      valueArr.push(`${key}:${valueObj[key]}`);
    });

    valueStr = valueArr.join('|');

    // Emit a google tag manager event registering the state change.
    dataLayer.push({
      'event': 'GAEvent',
      'eventCategory': category,
      'eventAction': action,
      'eventLabel': label,
      'eventValue': valueStr
    });
  };
};

module.exports = {sendAnalyticsFactory};
