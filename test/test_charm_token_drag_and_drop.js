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
  var Y, container, outerContainer, CharmToken, token;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-charm-token',
      'juju-tests-utils'
    ],
    function(Y) {
      CharmToken = Y.juju.widgets.browser.CharmToken;
      done();
    });

  });

  beforeEach(function() {
    outerContainer = Y.namespace('juju-tests.utils').makeContainer()
      .addClass('yui3-charmtoken');
    container = Y.namespace('juju-tests.utils').makeContainer();
    outerContainer.append(container);
  });

  afterEach(function() {
    outerContainer.remove().destroy(true);
    if (token) {
      token.destroy();
    }
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
    token = new CharmToken(config);
    assert.equal(token.charmData.id, config.id);
    assert.equal(token.charmData.description, config.description);
    assert.equal(token.charmData.thingThatIsNotCharmConfiguration, undefined);
  });

  it('makes each charm token draggable', function() {
    var cfg = {
      id: 'test',
      url: 'test',
      name: 'some-charm',
      description: 'some description',
      recent_commit_count: 1,
      downloads: 3,
      tested_providers: ['ec2'],
      boundingBox: container,
      contentBox: container
    };
    // We need to simulate a complex token with several nested elements.
    token = new CharmToken(cfg);
    var draggable = [];
    token._makeDraggable = function(element, charmData) {
      draggable.push(Y.JSON.parse(charmData).id);
    };
    token.renderUI(container);
    // Many elements are made draggable for a single token token.
    assert.isTrue(draggable.length > 1);
    // There is only a single token represented by all the draggable elements.
    draggable = Y.Array.dedupe(draggable);
    assert.equal(draggable.length, 1);
    // All of the charm tokens are made draggable.
    assert.deepEqual(draggable, ['test']);
  });

  it('can make an element draggable', function() {
    token = new CharmToken();
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
    token._makeDragStartHandler = function(dragImage, charmData) {
      assert.equal(element, element);
      assert.equal(dragImage, dragImage);
      assert.equal(charmData, charmData);
    };
    token._makeDraggable(element, dragImage, 'charm-id');
    assert.isTrue(setAttributeCalled);
    assert.isTrue(onCalled);
  });

  it('can set up drag and drop configuration', function() {
    var setAttributeCalled, getCalled, stopPropagationCalled;
    var UNIQUE_ID = 'UNIQUE ID';
    var DRAG_IMAGE_DOM_NODE = 'DRAG IMAGE DOM NODE';
    var fauxIcon = {
      cloned: false,
      cloneNode: function() {
        // The charm's icon is cloned and used as a drag image.
        fauxIcon.cloned = true;
        return fauxIcon;
      },
      get: function(name) {
        // The YUI-generated unique ID is used to keep track of the cloned
        // icon.
        assert.equal(name, '_yuid');
        getCalled = true;
        return UNIQUE_ID;
      },
      setAttribute: function(name, value) {
        // A unique ID is set as the drag image ID so it can be removed from
        // the DOM when the dragging is done.
        assert.equal(name, 'id');
        assert.equal(value, UNIQUE_ID);
        setAttributeCalled = true;
      },
      getAttribute: function(name) {
        assert.equal(name, 'id');
        return UNIQUE_ID;
      },
      getDOMNode: function() {
        return DRAG_IMAGE_DOM_NODE;
      },
      one: function() {
        return {
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
    token = new CharmToken(cfg);
    token.render();
    var setDataCalled, setDragImageCalled;
    var charmData = 'data';
    var handler = token._makeDragStartHandler(charmData);
    var dragDataSet = [];
    var evt = {
      _event: {
        dataTransfer: {
          setData: function(name, value) {
            dragDataSet.push([name, value]);
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
    assert.deepEqual(dragDataSet.splice(0, 1),
        [['clonedIconId', 'UNIQUE ID']]);
    assert.deepEqual(dragDataSet.splice(0, 1),
        [['charmData', 'data']]);
    assert.deepEqual(dragDataSet.splice(0, 1),
        [['dataType', 'charm-token-drag-and-drop']]);
    // Assure that we verified all data that was set.
    assert.deepEqual(dragDataSet, []);
    assert.isTrue(setDataCalled);
    assert.isTrue(setDragImageCalled);
    assert.isTrue(stopPropagationCalled);
    assert.isTrue(setAttributeCalled);
    assert.isTrue(getCalled);
  });

  it('respects the isDraggable switch', function() {
    token = new CharmToken({contentBox: container});
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

});
