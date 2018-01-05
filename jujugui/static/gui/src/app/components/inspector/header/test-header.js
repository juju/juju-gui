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
        changeState={options.changeState}
        charmId={options.charmId}
        entityPath={options.entityPath}
        hasGetStarted={options.hasGetStarted}
        icon={options.icon}
        showLinks={options.showLinks}
        title="Juju GUI"
        type={options.type} />);
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

  it('by default the header links are disabled', () => {
    const output = renderComponent();
    assert.equal(output.props.children[3], undefined);
  });

  it('renders the Get Started and Charm Details links when requested', () => {
    const output = renderComponent({
      hasGetStarted: true,
      showLinks: true
    });
    expect(output.props.children[3]).toEqualJSX(
      <ul className="inspector-header__inline-list">
        <li className='inspector-header__list-item'>
          <a onClick={sinon.stub()}>
            Get started
          </a>
        </li>
        <li className="inspector-header__list-item">
          <a onClick={sinon.stub()}>
            Charm details
          </a>
        </li>
      </ul>);
  });

  it('shows the Get Started link disabled if the charm is missind it', () => {
    const output = renderComponent({
      hasGetStarted: false,
      showLinks: true
    });
    assert.equal(
      output.props.children[3].props.children[0].props.className,
      'inspector-header__list-item inspector-header__list-item--disabled');
  });

  it('clicking the Get Started link does nothing if it is disabled', () => {
    const changeState = sinon.stub();
    const output = renderComponent({
      changeState,
      charmId: 'charmid',
      hasGetStarted: false,
      showLinks: true
    });
    output.props.children[3].props.children[0].props.children.props.onClick({
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    });
    assert.equal(changeState.callCount, 0);
  });

  it('clicking the Get Started link changes state to show the get started', () => {
    const changeState = sinon.stub();
    const charmId = 'cs:~hatch/ghost';
    const output = renderComponent({
      changeState,
      charmId,
      hasGetStarted: true,
      showLinks: true
    });
    output.props.children[3].props.children[0].props.children.props.onClick({
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    });
    assert.deepEqual(changeState.args[0], [{
      postDeploymentPanel: {
        show: true,
        entityId: charmId
      }
    }]);
  });

  it('clicking the Charm Details link changes state to show the details', () => {
    const changeState = sinon.stub();
    const entityPath = 'u/hatch/ghost';
    const output = renderComponent({
      changeState,
      entityPath,
      hasGetStarted: true,
      showLinks: true
    });
    output.props.children[3].props.children[1].props.children.props.onClick({
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    });
    assert.deepEqual(changeState.args[0], [{
      store: entityPath
    }]);
  });
});
