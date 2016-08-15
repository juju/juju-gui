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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('EntityContentDiagram', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-diagram', function() { done(); });
  });

  it('can display a diagram', function() {
    var getDiagramURL = sinon.stub().returns('example.com/diagram.svg');
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityContentDiagram
        getDiagramURL={getDiagramURL}
        id="big-bundle" />);
    assert.equal(getDiagramURL.callCount, 1);
    assert.equal(getDiagramURL.args[0][0], 'big-bundle');
    assert.deepEqual(output,
      <div className="entity-content__diagram row row--grey">
        <object type="image/svg+xml" data="example.com/diagram.svg"
          className="entity-content__diagram-image" />
      </div>);
  });
});
