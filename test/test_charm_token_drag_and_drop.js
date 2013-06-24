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
  var Y, charmContainer, container, CharmContainer, dropZone;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-charm-container',
      'juju-tests-utils'
    ],
    function(Y) {
      CharmContainer = Y.juju.widgets.browser.CharmContainer;
      done();
    });

  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
    dropZone = Y.namespace('juju-tests.utils').makeContainer('the-drop-zone')
      .addClass('zoom-plane');
  });

  afterEach(function() {
    if (charmContainer) {
      charmContainer.destroy();
    }
    container.remove().destroy(true);
  });

  it('makes each charm token draggable', function() {
    var charmData = [{
      name: 'foo',
      id: 'foo-id'
    }, {
      name: 'bar',
      id: 'bar-id'
    }, {
      name: 'baz',
      id: 'baz-id'
    }];
    charmContainer = new Y.juju.widgets.browser.CharmContainer({
      children: charmData
    });
    charmContainer.render(container);
    var draggableCharms = [];
    charmContainer._makeDraggable = function(element, dragImage, charmId) {
      draggableCharms.push(charmId);
    };
    charmContainer.addCharmTokenDragAndDrop(container);
    // Since each individual element in the charm token DOM is made draggable,
    // the total number of DOM nodes touched is greater than the number of
    // charms represented.
    assert.isTrue(draggableCharms.length > charmData.length);
    // All of the charm tokens are made draggable.
    draggableCharms = Y.Array.dedupe(draggableCharms);
    assert.deepEqual(draggableCharms, ['foo-id', 'bar-id', 'baz-id']);
  });

  it('adds a drop handler to the drop zone', function(done) {
    charmContainer = new Y.juju.widgets.browser.CharmContainer();
    dropZone = {
      on: function(what, callable) {
        assert.equal(what, 'drop');
        done();
      }
    };
    charmContainer.render(container);
    charmContainer._getDropZone = function() {return dropZone;};
    charmContainer.addCharmTokenDragAndDrop(container);
  });

  it('can make an element draggable', function() {
    charmContainer = new Y.juju.widgets.browser.CharmContainer();
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
      }
    };
    var dragImage = {};
    charmContainer._makeDragStartHandler = function(dragImage, charmId) {
      assert.equal(element, element);
      assert.equal(dragImage, dragImage);
      assert.equal(charmId, charmId);
    };
    charmContainer._makeDraggable(element, dragImage, 'charm-id');
    assert.isTrue(setAttributeCalled);
    assert.isTrue(onCalled);
  });

  it('can set up drag and drop configuration', function() {
    charmContainer = new Y.juju.widgets.browser.CharmContainer();
    var setDataCalled, setDragImageCalled;
    var dragImage = {_node: {id: 'the real drag image'}};
    var charmId = 'charm-id';
    var handler = charmContainer._makeDragStartHandler(dragImage, charmId);
    var evt = {
      _event: {
        dataTransfer: {
          setData: function(name, value) {
            assert.equal(name, 'charmId');
            assert.equal(value, charmId);
            setDataCalled = true;
          },
          setDragImage: function(provideDragImage, x, y) {
            assert.equal(provideDragImage, dragImage._node);
            assert.equal(x, 0);
            assert.equal(y, 0);
            setDragImageCalled = true;
          }
        }
      }
    };
    handler(evt);
    assert.equal(evt._event.dataTransfer.effectAllowed, 'copy');
    assert.isTrue(setDataCalled);
    assert.isTrue(setDragImageCalled);
  });

  it('can get the drop zone', function() {
    charmContainer = new Y.juju.widgets.browser.CharmContainer();
    assert.equal(charmContainer._getDropZone().get('id'), 'the-drop-zone');
  });

});
