/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

YUI.add('analytics', function(Y) {

  let ns = Y.namespace('juju');

  /**
    Factory that returns a function for sending analytics to GA.

    @param {String} controllerAPI For checking status of the user.
    @param {String} dataLayer The GA dataLayer instance.
    @return {function} The curryed function for sending analaytics.
  */
  ns.sendAnalyticsFactory = function(controllerAPI, dataLayer) {

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
      if (!dataLayer) {
        return null;
      }

      // We want to check for required params to provide good feedback for
      // developers - this is a fail fast way to ensure required fields are set.
      const requiredArgs = ['category', 'action', 'label'];
      for (let i = 0, ii = requiredArgs.length; i < ii; i+= 1) {
        if (!arguments[i]) {
          throw new Error(`cannot send analytics: ${requiredArgs[i]} required`);
        }
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

      // Emiting a google tag manager event registering the state change.
      dataLayer.push({
        'event': 'GAEvent',
        'eventCategory': category,
        'eventAction': action,
        'eventLabel': label,
        'eventValue': valueStr
      });
    };
  };
}, '', {
  requires: []
});
