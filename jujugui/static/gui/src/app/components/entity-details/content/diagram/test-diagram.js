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
  const getDiagramURL = sinon.stub().returns('example.com/diagram.svg');

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-diagram', function() { done(); });
  });

  it('can display a diagram', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContentDiagram
        diagramUrl="example.com/diagram.svg" />);
    expect(output).toEqualJSX(
      <div className="entity-content__diagram">
        <object type="image/svg+xml" data="example.com/diagram.svg"
          title={undefined}
          className="entity-content__diagram-image" />
      </div>);
  });

  it('can display a diagram as a row', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        isRow={true} />);
    assert.equal(output.props.className,
      'entity-content__diagram row row--grey');
  });

  it('can display a diagram expand button', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        isExpandable={true}
        title="example" />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    expect(output).toEqualJSX(
      <div className="entity-content__diagram">
        <object type="image/svg+xml" data="example.com/diagram.svg"
          title="example" className="entity-content__diagram-image" />
        <button role="button" className="entity-content__diagram-expand"
          onClick={instance._handleExpand.bind(instance)}>
          <juju.components.SvgIcon name="fullscreen-grey_16" size="12" />
        </button>
      </div>
    );
  });

  it('_handleExpand calls the displayLightbox prop', () => {
    const displayLightbox = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        displayLightbox={displayLightbox}
        isExpandable={true}
        title="example" />, true);
    const instance = renderer.getMountedInstance();
    instance._handleExpand();
    expect(displayLightbox.callCount).toEqual(1);
  });
});
