/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorHeader = require('./header');

const jsTestUtils = require('../../../utils/component-test-utils');

fdescribe('InspectorHeader', function() {

  // render creates and returns a renderer for the header component, optionally
  // passing the provided parameters.
  const render = (params={}) => {
    const renderer = jsTestUtils.shallowRender(
      <InspectorHeader
        backCallback={params.backCallback || sinon.stub()}
        changeState={params.changeState}
        entityId={params.entityId || 'cs:demo'}
        icon={params.icon}
        title={params.title || 'Juju GUI'}
        type={params.type}
      />, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  };

  it('displays the provided title', function() {
    const output = render().output;
    assert.equal(output.props.children[1].props.children, 'Juju GUI');
  });

  it('adds a class based on the provided type', function() {
    const output = render({type: 'error'}).output;
    assert.equal(output.props.className,
      'inspector-header inspector-header--type-error');
  });

  it('does not add a type class if it is not provided', function() {
    const output = render().output;
    assert.equal(output.props.className, 'inspector-header');
  });

  it('displays the provided icon', function() {
    const output = render({icon: 'icon.svg'}).output;
    assert.equal(output.props.children[2].props.children.props.src, 'icon.svg');
  });

  it('calls supplied callable when clicked', function() {
    const callbackStub = sinon.stub();
    const output = render({backCallback: callbackStub}).output;
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });

  it('can render correctly with details inline list', () => {
    const instance = render({changeState: sinon.stub()}).instance;
    const output = instance._renderHeaderLinks();
    const expected = (
      <ul className="inspector-header__inline-list">
        <li className="inspector-header__list-item">
          <a href="#" onClick={instance._navigateToGetStarted.bind(instance)}>
            Get started
          </a>
        </li>
        <li className="inspector-header__list-item">
          <a href="#" onClick={instance._navigateToCharmDetails.bind(instance)}>
            Charm details
          </a>
        </li>
      </ul>);
    expect(output).toEqualJSX(expected);
  });

  it('navigates to the getstarted page of a charm or bundle', () => {
    const changeState = sinon.stub();
    const event = {preventDefault: sinon.stub()};
    const instance = render({changeState: changeState}).instance;
    instance._navigateToGetStarted(event);
    assert.strictEqual(changeState.callCount, 1, 'changeState call count');
    assert.deepEqual(changeState.args[0], [{
      postDeploymentPanel: {show: true, entityId: 'cs:demo'}
    }]);
    assert.strictEqual(event.preventDefault.callCount, 1, 'preventDefault call count');
    assert.deepEqual(event.preventDefault.args[0], []);
  });
});
