/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentDiagram = require('./diagram');
const SvgIcon = require('../../../svg-icon/svg-icon');

describe('EntityContentDiagram', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContentDiagram
      clearLightbox={options.clearLightbox}
      diagramUrl={options.diagramUrl || 'example.com/diagram.svg'}
      displayLightbox={options.displayLightbox}
      isExpandable={options.isExpandable}
      isRow={options.isRow}
      title={options.title || 'example'} />
  );

  it('can display a diagram', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="entity-content__diagram">
        <object className="entity-content__diagram-image" data="example.com/diagram.svg"
          title="example"
          type="image/svg+xml" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a diagram as a row', () => {
    const wrapper = renderComponent({ isRow: true });
    assert.equal(wrapper.prop('className'),
      'entity-content__diagram row row--grey');
  });

  it('can display a diagram expand button', () => {
    const wrapper = renderComponent({ isExpandable: true });
    const expected = (
      <button
        className="entity-content__diagram-expand"
        onClick={wrapper.find('button').prop('onClick')}
        role="button">
        <SvgIcon name="fullscreen-grey_16" size="12" />
      </button>
    );
    assert.compareJSX(wrapper.find('button'), expected);
  });

  it('_handleExpand calls the displayLightbox prop', () => {
    const displayLightbox = sinon.spy();
    const wrapper = renderComponent({
      displayLightbox,
      isExpandable: true
    });
    const instance = wrapper.instance();
    instance._handleExpand();
    expect(displayLightbox.callCount).toEqual(1);
  });
});
