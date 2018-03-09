/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityContentDiagram = require('./diagram');
const SvgIcon = require('../../../svg-icon/svg-icon');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentDiagram', function() {

  it('can display a diagram', function() {
    const output = jsTestUtils.shallowRender(
      <EntityContentDiagram
        diagramUrl="example.com/diagram.svg" />);
    expect(output).toEqualJSX(
      <div className="entity-content__diagram">
        <object className="entity-content__diagram-image" data="example.com/diagram.svg"
          title={undefined}
          type="image/svg+xml" />
      </div>);
  });

  it('can display a diagram as a row', () => {
    const output = jsTestUtils.shallowRender(
      <EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        isRow={true} />);
    assert.equal(output.props.className,
      'entity-content__diagram row row--grey');
  });

  it('can display a diagram expand button', () => {
    const renderer = jsTestUtils.shallowRender(
      <EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        isExpandable={true}
        title="example" />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    expect(output).toEqualJSX(
      <div className="entity-content__diagram">
        <object className="entity-content__diagram-image" data="example.com/diagram.svg"
          title="example" type="image/svg+xml" />
        <button
          className="entity-content__diagram-expand"
          onClick={instance._handleExpand.bind(instance)}
          role="button">
          <SvgIcon name="fullscreen-grey_16" size="12" />
        </button>
      </div>
    );
  });

  it('_handleExpand calls the displayLightbox prop', () => {
    const displayLightbox = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <EntityContentDiagram
        diagramUrl="example.com/diagram.svg"
        displayLightbox={displayLightbox}
        isExpandable={true}
        title="example" />, true);
    const instance = renderer.getMountedInstance();
    instance._handleExpand();
    expect(displayLightbox.callCount).toEqual(1);
  });
});
