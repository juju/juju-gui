/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017Canonical Ltd.

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

  var ns = Y.namespace('juju');

  ns.analytics = {

    /**
      Send analytics to GA

      @param {String} category A sensible category name. Generally the
        component name is a good start
      @param {String} action Some identifiable action
      @param {String} label Name the event. This might be enough for
        some events
      @param {Object} value A single depth object of extra information
    */
    send: function (category, action, label, value){
      let loggedIn = undefined;
      // Sometimes this doesn't get set...
      if (window.app && window.app.controllerAPI) {
        // Always decorate with whether the user is logged in
        loggedIn = window.app.controllerAPI.userIsAuthenticated;
      }
      let _value = {
        loggedIn:  loggedIn
      };
      let _valueArr = [];
      let _valueStr;

      if (!category) {
        console.error('Analytics: Category required');
        return false;
      }
      if (!action) {
        console.error('Analytics: Action required');
        return false;
      }
      if (!label) {
        console.error('Analytics: Label required');
        return false;
      }

      if (value) {
        Object.keys(value).forEach(key => {
          _value[key] = value[key];
        });
      }

      Object.keys(_value).forEach(key => {
        _valueArr.push(`${key}:${_value[key]}`);
      });

      _valueStr = _valueArr.join('|');

      // Emiting a google tag manager event registering the state change.
      if (window.dataLayer) {
        window.dataLayer.push({
          'event': 'GAEvent',
          'eventCategory': category,
          'eventAction': action,
          'eventLabel': label,
          'eventValue': _valueStr
        });
      }
      return true;
    }
  };
}, '', {
  requires: []
});
