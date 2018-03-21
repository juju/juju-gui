/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorHeader = require('./header');

describe('InspectorHeader', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorHeader
      backCallback={options.backCallback || sinon.stub()}
      changeState={options.changeState}
      charmId={options.charmId}
      entityPath={options.entityPath}
      hasGetStarted={options.hasGetStarted}
      icon={options.icon}
      showLinks={options.showLinks}
      title="Juju GUI"
      type={options.type} />
  );

  it('displays the provided title', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.inspector-header__title').text(), 'Juju GUI');
  });

  it('adds a class based on the provided type', () => {
    const wrapper = renderComponent({type: 'error'});
    assert.equal(
      wrapper.prop('className').includes(
        'inspector-header inspector-header--type-error'),
      true);
  });

  it('does not add a type class if it is not provided', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.prop('className'), 'inspector-header');
  });

  it('displays the provided icon', () => {
    const wrapper = renderComponent({icon: 'icon.svg'});
    assert.equal(
      wrapper.find('.inspector-header__service-icon').prop('src'), 'icon.svg');
  });

  it('calls supplied callable when clicked', () => {
    const callbackStub = sinon.stub();
    const wrapper = renderComponent({backCallback: callbackStub});
    wrapper.props().onClick();
    assert.equal(callbackStub.callCount, 1);
  });

  it('by default the header links are disabled', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.inspector-header__inline-list').length, 0);
  });

  it('renders the Get Started and Charm Details links when requested', () => {
    const wrapper = renderComponent({
      hasGetStarted: true,
      showLinks: true
    });
    const links = wrapper.find('.inspector-header__list-item a');
    const expected = (
      <ul className="inspector-header__inline-list">
        <li className="inspector-header__list-item">
          <a onClick={links.at(0).prop('onClick')}>
            Charm details
          </a>
        </li>
        <li className='inspector-header__list-item'>
          <a onClick={links.at(1).prop('onClick')}>
            Get started
          </a>
        </li>
      </ul>);
    assert.compareJSX(wrapper.find('.inspector-header__inline-list'), expected);
  });

  it('does not show the Get Started link if not available', () => {
    const wrapper = renderComponent({
      hasGetStarted: false,
      showLinks: true
    });
    assert.equal(wrapper.find('.inspector-header__list-item').length, 1);
  });

  it('clicking the Get Started link changes state to show the get started', () => {
    const changeState = sinon.stub();
    const charmId = 'cs:~hatch/ghost';
    const wrapper = renderComponent({
      changeState,
      charmId,
      hasGetStarted: true,
      showLinks: true
    });
    wrapper.find('.inspector-header__list-item a').at(1).props().onClick({
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
    const wrapper = renderComponent({
      changeState,
      entityPath,
      hasGetStarted: true,
      showLinks: true
    });
    wrapper.find('.inspector-header__list-item a').at(0).props().onClick({
      preventDefault: sinon.stub(),
      stopPropagation: sinon.stub()
    });
    assert.deepEqual(changeState.args[0], [{
      store: entityPath
    }]);
  });
});
