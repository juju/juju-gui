/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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
 * The view helpers for Handlebars templates.
 *
 * @module views
 * @submodule views.helpers
 */
YUI.add('juju-view-helpers', function(Y) {

  Y.Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {
    if (arguments.length < 3) {
      throw new Error('Handlerbars Helper "compare" needs 2 parameters');
    }
    var operator = options.hash.operator || '==';
    var operators = {
      '==':       function(l,r) { return l == r; },
      '===':      function(l,r) { return l === r; },
      '!=':       function(l,r) { return l != r; },
      '<':        function(l,r) { return l < r; },
      '>':        function(l,r) { return l > r; },
      '<=':       function(l,r) { return l <= r; },
      '>=':       function(l,r) { return l >= r; },
      'typeof':   function(l,r) { return typeof l == r; }
    };
    if (!operators[operator]) {
      throw new Error('Handlerbars Helper "compare" does not know the operator '
                      + operator);
    }
    var result = operators[operator](lvalue,rvalue);
    if (result) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Y.Handlebars.registerHelper('fullSeries', function(series) {
    series = series.toLowerCase();
    var names = {
      oneiric: 'Oneiric 11.10',
      precise: 'Precise 12.04',
      quantal: 'Quantal 12.10',
      raring: 'Raring 13.04',
      saucy: 'Saucy 13.10',
      trusty: 'Trusty 14.04',
      utopic: 'Utopic 14.10',
      vivid: 'Vivid 15.04'
    };
    return names[series] || series;
  });

}, '0.1.0', {
  requires: [
    'handlebars'
  ]
});
