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
    // XXX: Add the getMountedInstance until it lands, at which point this can
    // removed. See:
    // https://github.com/facebook/react/pull/4918/files
    if (!shallowRenderer.getMountedInstance) {
      shallowRenderer.getMountedInstance = function() {
        return this._instance ? this._instance._instance : null;
      };
    }
    return (returnRenderer) ?
      shallowRenderer : shallowRenderer.getRenderOutput();
  },

  /**
    Provide a mock method for the ReactDnD connectDragSource method.

    @method connectDragSource
    @param {Object} components The components to return.
  */
  connectDragSource: function(components) {
    return components;
  },

  /**
    Provide a mock method for the ReactDnD connectDropTarget method.

    @method connectDropTarget
    @param {Object} components The components to return.
  */
  connectDropTarget: function(components) {
    return components;
  },

  /**
    JSON.stringify doesn't print undefined values to the console when trying
    to inspect an object. This loging wrapper prints the undefined values
    and also gives you the option to print the functions as well.

    @method log
    @param {Object} obj The object to stringify
    @param {Boolean} showFn Whether you want to show the functions.
  */
  log: function log(obj, showFn) {
    console.log(jsTestUtils.superStringify(obj, showFn));
  },

  /**
    Custom JSON.stringify to properly parse complex objects with cyclical
    dependencies.

    @method superStringify
    @param {Object} obj The object to stringify
    @param {Boolean} showFn Whether you want to show the functions.
  */
  superStringify: function superStringify(obj, showFn) {
    var seen = [];
    return JSON.stringify(obj, function (k, v) {
      if (v !== null && typeof v === 'object') {
        // Handle cyclical dependencies.
        var seenIndex = seen.indexOf(v);
        if (seenIndex > -1) {
          return;
        }
        seen.push(v);
      }
      if (v === undefined) {
        return 'undefined';
      }
      if (showFn && typeof v === 'function') {
        return '' + v;
      }
      return v;
    }, 4);
  },

  /**
    Takes the two supplied objects, stringifies them and then outputs their
    diffs to the console.

    @method compare
    @param {Object} a The source object.
    @param {Object} b The expected object.
    @param {Boolean} showFn Whether you want to show the functions.
  */
  compare: function compare(a, b, showFn) {
    var stringA = jsTestUtils.superStringify(a, showFn);
    var stringB = jsTestUtils.superStringify(b, showFn);

    var diff = JsDiff.diffLines(stringA, stringB);
    diff.forEach(function (part) {
      if (part.added === true) {
        console.log('+ ' + part.value);
      } else if (part.removed === true) {
        console.log('- ' + part.value);
      } else {
        console.log(part.value);
      }
    });
  },

  /**
    Constructs either a charm or bundle object, suitable for being used in
    place of a YUI model. The object stubs out the getEntity function to
    return a POJO, as well as the get function to return various keys in the
    underlying POJO.

    @method makeEntity
    @param {Object} isBundle A boolean flag to control whether the entity
      produced is a charm or a bundle. Optional.
    @param {Boolean} files An list of files included in the entity. Optional.
   */
  makeEntity: function(isBundle=false, files=[]) {
    var pojo;
    if (isBundle) {
      pojo = {
        name: 'django-cluster',
        full_name: 'django-cluster',
        description: 'HA Django cluster.',
        displayName: 'django cluster',
        url: 'http://example.com/django-cluster',
        code_source: {location: 'lp:django-cluster/code'},
        downloads: 1000,
        owner: 'test-owner',
        promulgated: true,
        id: 'cs:~charmers/wily/django-cluster',
        type: 'bundle',
        entityType: 'bundle',
        iconPath: 'data:image/gif;base64,',
        tags: ['database'],
        options: {},
        series: 'trusty',
        files: files
      };
    } else {
      pojo = {
        name: 'django',
        full_name: 'trusty/django',
        description: 'Django framework.',
        displayName: 'django',
        url: 'http://example.com/django',
        code_source: {location: 'lp:django/code'},
        downloads: 1000,
        owner: 'test-owner',
        promulgated: true,
        id: 'cs:~charmers/wily/django',
        type: 'charm',
        entityType: 'charm',
        iconPath: 'data:image/gif;base64,',
        tags: ['database'],
        series: 'trusty',
        files: files,
        options: {
          username: {
            description: 'Your username',
            type: 'string',
            default: 'spinach'
          },
          password: {
            description: 'Your password',
            type: 'string',
            default: 'abc123'
          }
        },
        relations: {
          provides: {
            http: {
              name: 'http',
              interface: 'http'
            }
          },
          requires: {
            cache: {
              name: 'cache',
              interface: 'cache'
            }
          }
        },
        revisions: [{
          authors: [{
            email: 'charles.butler@canonical.com',
            name: 'Charles Butler'
          }],
          date: '2015-06-16T17:09:35Z',
          message: 'Fix the django 1.8 with postgresql test.',
          revno: 40
        }, {
          authors: [{
            email: 'tim.van.steenburgh@canonical.com',
            name: 'Tim Van Steenburgh'
          }],
          date: '2015-06-12T14:02:06Z',
          message: 'Remove charmhelpers.contrib (not used)',
          revno: 39
        }, {
          authors: [{
            email: 'charles.butler@canonical.com',
            name: 'Charles Butler'
          }],
          date: '2015-05-22T19:35:18Z',
          message: 'Run migrate if django is modern enough.',
          revno: 38
        }]
      };
    }
    var mockEntity = {};
    mockEntity.toEntity = sinon.stub().returns(pojo);
    mockEntity.get = function(key) {
      return pojo[key];
    };
    mockEntity.set = function(key, value) {
      pojo[key] = value;
    };
    return mockEntity;
  },

  /**
    Constructs a generic Model object, suitable for being used in place of a YUI
    model. The object stubs out get, set, and associated functions to work
    properly within the relatively simple test environment.

    @method makeModel
   */
  makeModel: function(attrs) {
    var defaultAttrs = {
      id: 'wordpress',
      icon: 'icon.gif',
      unit_count: '2',
      name: 'demo',
      units: {
        toArray: function() {
          return [
            {agent_state: 'uncommitted'},
            {agent_state: 'pending'}
          ];
        }
      }
    };
    function extend(a, b) {
      for (var key in b) {
        a[key] = b[key];
      }
      return a;
    }
    return {
      attrs: extend(defaultAttrs, attrs),

      get: function(key) {
        return this.attrs[key];
      },

      getAttrs: function() {
        return this.attrs;
      },

      set: function(key, value) {
        this.attrs[key] = value;
      },

      setAttrs: function(a) {
        for (var key in a) {
          this.attrs[key] = a[key];
        }
      }
    };
  }
};
