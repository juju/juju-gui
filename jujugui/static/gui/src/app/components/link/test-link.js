/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');

const Link = require('./link');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Link', function() {
  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <Link
        changeState={options.changeState || sinon.stub()}
        classes={options.classes || null}
        clickState={options.clickState || {state: 'new'}}
        generatePath={options.generatePath || sinon.stub().returns('/new/state')}>
        Link content
      </Link>, true);
  }

  it('can generate a link', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <a className="link"
        href="/new/state"
        onClick={sinon.stub()}>
        Link content
      </a>);
    expect(output).toEqualJSX(expected);
  });

  it('can render with extra classes', () => {
    const renderer = renderComponent({ classes: ['another'] });
    const output = renderer.getRenderOutput();
    const expected = (
      <a className="another link"
        href="/new/state"
        onClick={sinon.stub()}>
        Link content
      </a>);
    expect(output).toEqualJSX(expected);
  });

  it('changes state when clicked on', () => {
    const changeState = sinon.stub();
    const renderer = renderComponent({ changeState });
    const output = renderer.getRenderOutput();
    const preventDefault = sinon.stub();
    output.props.onClick({ preventDefault });
    assert.equal(preventDefault.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {state: 'new'});
  });
});
