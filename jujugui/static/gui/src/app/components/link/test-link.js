/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');
const enzyme = require('enzyme');

const Link = require('./link');

describe('Link', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Link
      changeState={options.changeState || sinon.stub()}
      classes={options.classes || null}
      clickState={options.clickState || {state: 'new'}}
      generatePath={options.generatePath || sinon.stub().returns('/new/state')}>
      Link content
    </Link>
  );

  it('can generate a link', () => {
    const wrapper = renderComponent();
    const expected = (
      <a className="link"
        href="/new/state"
        onClick={wrapper.prop('onClick')}>
        Link content
      </a>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render with extra classes', () => {
    const wrapper = renderComponent({ classes: ['another'] });
    assert.equal(wrapper.prop('className').includes('another'), true);
  });

  it('changes state when clicked on', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    const preventDefault = sinon.stub();
    wrapper.simulate('click', { preventDefault });
    assert.equal(preventDefault.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {state: 'new'});
  });
});
