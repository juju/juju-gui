/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var jsTestUtils = {

  /**
    shallowRender provides a convenience wrapper around the React
    testUtils createRenderer method.

    The createRenderer isn't well documented but you can view it's source
    code:
      https://github.com/facebook/react/blob/
      dc2570e1ceebd2b4be7ebe0990f8524f6b53ea7c/src/test/ReactTestUtils.js#L347

    @method shallowRender
    @param {Object} component The components to render.
    @param {Boolean} returnRenderer Whether or not it should return the
      component instance or just the rendered output.
    @return {Object} See returnRenderer parameter.
  */
  shallowRender: function(component, returnRenderer) {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(component);
    return (returnRenderer) ?
      shallowRenderer : shallowRenderer.getRenderOutput();
  },

  /**
    JSON.stringify doesn't print undefined values to the console when trying
    to inspect an object. This loging wrapper prints the undefined values
    and also gives you the option to print the functions as well.

    @method log
    @param {Object} obj The object to stringify
    @param {Boolean} showFn Whether you want to show the functions.
  */
  log: function(obj, showFn) {
    console.log(
        JSON.stringify(
            obj,
            (k, v) => {
              if (v === undefined) {
                return 'undefined';
              }
              if (showFn && typeof v === 'function') {
                return '' + v;
              }
              return v;
           },
           4
    ));
  }

};
