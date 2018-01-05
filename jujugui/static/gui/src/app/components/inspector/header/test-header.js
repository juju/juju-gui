/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorHeader', () => {

  function renderComponent(options = {}) {
    return jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={options.backCallback || sinon.stub()}
        title="Juju GUI"
        type={options.type}
        icon={options.icon} />);
  }

  it('displays the provided title', () => {
    const output = renderComponent();
    assert.equal(output.props.children[1].props.children, 'Juju GUI');
  });

  it('adds a class based on the provided type', () => {
    const output = renderComponent({type: 'error'});
    assert.equal(output.props.className,
      'inspector-header inspector-header--type-error');
  });

  it('does not add a type class if it is not provided', () => {
    const output = renderComponent();
    assert.equal(output.props.className, 'inspector-header');
  });

  it('displays the provided icon', () => {
    const output = renderComponent({icon: 'icon.svg'});
    assert.equal(output.props.children[2].props.children.props.src, 'icon.svg');
  });

  it('calls supplied callable when clicked', () => {
    const callbackStub = sinon.stub();
    const output = renderComponent({backCallback: callbackStub});
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });
});
