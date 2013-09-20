/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

describe('charm token drag and drop', function() {
  var Y, container, cleanIconHelper, outerContainer, Token, token, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-token',
      'juju-tests-utils'
    ],
    function(Y) {
      Token = Y.juju.widgets.browser.Token;
      utils = Y.namespace('juju-tests.utils');
      cleanIconHelper = utils.stubCharmIconPath();
      done();
    });

  });

  beforeEach(function() {
    outerContainer = Y.namespace('juju-tests.utils').makeContainer()
      .addClass('yui3-token');
    container = Y.namespace('juju-tests.utils').makeContainer();
    outerContainer.append(container);
  });

  afterEach(function() {
    outerContainer.remove().destroy(true);
    if (token) {
      token.destroy();
    }
  });

  after(function() {
    cleanIconHelper();
  });

  it('extracts charm configuration from the widget configuration', function() {
    // The widget configuration is a superset of the charm configuration, which
    // is needed when deploying a charm via drag and drop.  The charm
    // configuration is extracted by the initializer and stored in an
    // attribute.
    var config = {
      id: 'test',
      description: 'some description',
      thingThatIsNotCharmConfiguration: 42
    };
    token = new Token(config);
    assert.equal(token.data.id, config.id);
    assert.equal(token.data.description, config.description);
    assert.equal(token.data.thingThatIsNotCharmConfiguration, undefined);
  });

  it('makes each charm token draggable', function() {
    var cfg = {
      id: 'test',
      url: 'cs:test',
      name: 'some-charm',
      description: 'some description',
      commitCount: 1,
      downloads: 3,
      tested_providers: ['ec2'],
      boundingBox: container,
      contentBox: container
    };
    // We need to simulate a complex token with several nested elements.
    token = new Token(cfg);
    var draggable = [];
    token._makeDraggable = function(element, data) {
      draggable.push(Y.JSON.parse(data).id);
    };
    token.renderUI(container);
    // Many elements are made draggable for a single token token.
    assert.isTrue(draggable.length > 1);
    // There is only a single token represented by all the draggable elements.
    draggable = Y.Array.dedupe(draggable);
    assert.equal(draggable.length, 1);
    // All of the charm tokens are made draggable.
    assert.deepEqual(draggable, ['cs:test']);
  });

  it('can make an element draggable', function() {
    token = new Token();
    var setAttributeCalled, onCalled;
    var element = {
      setAttribute: function(name, value) {
        assert.equal(name, 'draggable');
        assert.equal(value, 'true');
        setAttributeCalled = true;
      },
      on: function(when, callable) {
        assert.equal(when, 'dragstart');
        onCalled = true;
        return {detach: function() {}};
      }
    };
    var dragImage = {};
    token._makeDragStartHandler = function(dragImage, data) {
      assert.equal(element, element);
      assert.equal(dragImage, dragImage);
      assert.equal(data, data);
    };
    token._makeDraggable(element, dragImage, 'charm-id');
    assert.isTrue(setAttributeCalled);
    assert.isTrue(onCalled);
  });

  it('can set up drag and drop configuration', function() {
    var stopPropagationCalled;
    var UNIQUE_ID = 'UNIQUE ID';
    var DRAG_IMAGE_DOM_NODE = 'DRAG IMAGE DOM NODE';
    var fauxIcon = {
      cloned: false,
      cloneNode: function() {
        // The charm's icon is cloned and used as a drag image.
        fauxIcon.cloned = true;
        return fauxIcon;
      },
      getAttribute: function(name) {
        assert.equal(name, 'src');
        return UNIQUE_ID;
      },
      getDOMNode: function() {
        return DRAG_IMAGE_DOM_NODE;
      },
      one: function() {
        return {
          getAttribute: this.getAttribute,
          get: function() {}
        };
      },
      setStyles: function() {return fauxIcon;}
    };
    container.one = function(selector) {
      assert.equal(selector, '.icon');
      return fauxIcon;
    };
    var cfg = {
      boundingBox: container,
      contentBox: container
    };
    token = new Token(cfg);
    token.render();
    var setDataCalled, setDragImageCalled;
    var data = 'data';
    var handler = token._makeDragStartHandler(data);
    var dragDataSet = [];
    var evt = {
      _event: {
        dataTransfer: {
          setData: function(type, data) {
            dragDataSet = JSON.parse(data);
            setDataCalled = true;
          },
          setDragImage: function(providedDragImage, x, y) {
            assert.equal(providedDragImage, DRAG_IMAGE_DOM_NODE);
            assert.equal(x, 0);
            assert.equal(y, 0);
            setDragImageCalled = true;
          }
        },
        stopPropagation: function() {
          stopPropagationCalled = true;
        }
      }
    };
    handler(evt);
    assert.equal(evt._event.dataTransfer.effectAllowed, 'copy');
    console.log(dragDataSet);
    assert.deepEqual(dragDataSet, {
      data: 'data',
      dataType: 'token-drag-and-drop',
      iconSrc: 'UNIQUE ID'
    });
    // Assure that we verified all data that was set.
    assert.isTrue(setDataCalled);
    assert.isTrue(setDragImageCalled);
    assert.isTrue(stopPropagationCalled);
  });

  it('respects the isDraggable switch', function() {
    token = new Token({contentBox: container});
    token.set('isDraggable', false);
    var dragEnabled = false;
    token._addDraggability = function() {
      dragEnabled = true;
    };
    token.renderUI(container);
    // Since we set isDraggable to false, _addDraggability was not called.
    assert.isFalse(dragEnabled);
    // If we set isDraggable to true, _addDraggability will be called.
    token.set('isDraggable', true);
    token.renderUI(container);
    assert.isTrue(dragEnabled);
  });

  it('fixes the charm id in _addDraggability', function() {
    var cfg = {
      id: 'test',
      url: 'cs:test',
      boundingBox: container
    };
    token = new Token(cfg);
    token._makeDraggable = function(element, data) {};
    token._addDraggability();
    assert.equal(token.data.id, token.data.url);
  });

});
