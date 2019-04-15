/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityHeader = require('./header');
const {SvgIcon} = require('@canonical/juju-react-components');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('EntityHeader', function() {
  let acl, mockEntity, attrs;

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityHeader
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      deployService={options.deployService || sinon.stub()}
      entityModel={options.entityModel || mockEntity}
      getBundleYAML={options.getBundleYAML || sinon.stub()}
      getModelName={options.getModelName || sinon.stub()}
      hasPlans={options.hasPlans === undefined ? false : options.hasPlans}
      importBundleYAML={options.importBundleYAML || sinon.stub()}
      plans={options.plans} />,
    {disableLifecycleMethods: true}
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    attrs = {
      revisions: ['cs:~who/django-42']
    };
    mockEntity = jsTestUtils.makeEntity(false, attrs);
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders the latest entity properly', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders an old entity properly', function() {
    mockEntity.set('revision_id', 122);
    const wrapper = renderComponent();
    const expected = (
      <span className="entity-header__version">
        {'#'}{122}
      </span>);
    assert.compareJSX(wrapper.find('.entity-header__version'), expected);
  });

  it('can display plans', function() {
    const plans = [{url: 'test'}];
    const wrapper = renderComponent({
      hasPlans: true,
      plans
    });
    const expected = (
      <select
        className="entity-header__select"
        ref="plan">
        <option key="default">Choose a plan</option>
        {[<option
          key="test0"
          value="test">
          test
        </option>]}
      </select>);
    assert.compareJSX(wrapper.find('.entity-header__select'), expected);
  });

  it('displays correctly when loading plans', function() {
    const wrapper = renderComponent({
      hasPlans: true,
      plans: null
    });
    const expected = (
      <select
        className="entity-header__select"
        ref="plan">
        <option key="default">Loading plans...</option>
        {null}
      </select>);
    assert.compareJSX(wrapper.find('.entity-header__select'), expected);
  });

  it('displays correctly when there are no plans', function() {
    const wrapper = renderComponent({
      hasPlans: true,
      plans: []
    });
    assert.equal(wrapper.find('.entity-header__select').length, 0);
  });

  it('displays the counts for a bundle', function() {
    const entity = jsTestUtils.makeEntity(true, attrs);
    const wrapper = renderComponent({
      entityModel: entity
    });
    const expected = (
      <li className="entity-header__counts">
        {3} {'applications'},
        &nbsp;
        {2} {'machines'},
        &nbsp;
        {5} {'units'}
      </li>);
    assert.compareJSX(wrapper.find('.entity-header__counts'), expected);
  });

  it('can mark charms as subordinates', function() {
    attrs.is_subordinate = true;
    const entity = jsTestUtils.makeEntity(false, attrs);
    const wrapper = renderComponent({
      entityModel: entity
    });
    const expected = (
      <li className="entity-header__subordinate">
        Subordinate
        <a
          href={
            'https://jujucharms.com/docs/stable/' +
            'authors-subordinate-applications'}
          target="_blank">
          <SvgIcon
            name="help_16"
            size="16" />
        </a>
      </li>);
    assert.compareJSX(wrapper.find('.entity-header__subordinate'), expected);
  });

  it('displays an add to model button', function() {
    const wrapper = renderComponent();
    const deployAction = wrapper.find('Button');
    assert.equal(deployAction.prop('modifier'), 'positive');
    assert.equal(deployAction.children().text(), 'Add to model');
  });

  it('displays the model name in the add to model button if provided', () => {
    const wrapper = renderComponent({
      getModelName: sinon.stub().returns('porkchop')
    });
    const deployAction = wrapper.find('Button');
    assert.equal(deployAction.prop('modifier'), 'positive');
    assert.equal(deployAction.children().text(), 'Add to porkchop');
  });

  it('displays an unsupported message for multi-series charms', function() {
    mockEntity.set('series', undefined);
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.entity-header__deploy-action').children().text(),
      'This type of charm can only be deployed from the command line.');
  });

  it('adds a charm when the add button is clicked', function() {
    const deployService = sinon.stub();
    const wrapper = renderComponent({
      deployService
    });
    // Simulate a click.
    wrapper.find('Button').props().action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
  });

  it('can include a plan when deploying a charm', function() {
    const deployService = sinon.stub();
    const plans = [{url: 'test-plan'}];
    const wrapper = renderComponent({
      deployService,
      hasPlans: true,
      plans: plans
    });
    const instance = wrapper.instance();
    // Change the select value to a plan.
    instance.refs = {plan: {value: 'test-plan'}};
    // Simulate a click.
    wrapper.find('Button').props().action();
    assert.equal(deployService.callCount, 1);
    assert.deepEqual(deployService.args[0][2], plans);
    assert.deepEqual(deployService.args[0][3], plans[0]);
  });

  it('can set the plans when deploying a charm without selecing one', () => {
    const deployService = sinon.stub();
    const plans = [{url: 'test-plan'}];
    const wrapper = renderComponent({
      deployService,
      hasPlans: true,
      plans: plans
    });
    // Simulate a click.
    wrapper.find('Button').props().action();
    assert.equal(deployService.callCount, 1);
    assert.deepEqual(deployService.args[0][2], plans);
    assert.isUndefined(deployService.args[0][3]);
  });

  it('adds a bundle when the add button is clicked', function() {
    const deployService = sinon.stub();
    const getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    const importBundleYAML = sinon.stub();
    const entity = jsTestUtils.makeEntity(true, attrs);
    const wrapper = renderComponent({
      deployService,
      entityModel: entity,
      getBundleYAML,
      importBundleYAML
    });
    // Simulate a click.
    wrapper.find('Button').props().action();
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.deepEqual(importBundleYAML.args[0][0], 'mock yaml');
    assert.equal(importBundleYAML.args[0][1], 'django-cluster');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    const getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    const addNotification = sinon.stub();
    const entity = jsTestUtils.makeEntity(true, attrs);
    const wrapper = renderComponent({
      addNotification,
      entityModel: entity,
      getBundleYAML
    });
    // Simulate a click.
    wrapper.find('Button').props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(
      addNotification.args[0][0].title, 'Bundle failed to deploy');
  });

  it('goes to the profile page when the owner is clicked', function() {
    const changeState = sinon.stub();
    const evt = {
      preventDefault: sinon.stub().withArgs(),
      stopPropagation: sinon.stub().withArgs()
    };
    const wrapper = renderComponent({
      changeState
    });
    const instance = wrapper.instance();
    instance._onOwnerClick(evt);
    assert.strictEqual(evt.preventDefault.callCount, 1, 'preventDefault');
    assert.strictEqual(evt.stopPropagation.callCount, 1, 'stopPropagation');
    assert.strictEqual(changeState.callCount, 1, 'changeState');
    const args = changeState.args[0];
    assert.strictEqual(args.length, 1, 'changeState args');
    assert.deepEqual(args[0], {
      hash: null,
      store: null,
      profile: 'test-owner'
    });
  });

  it('goes to the last revision when present', function() {
    const changeState = sinon.stub();
    const evt = {
      preventDefault: sinon.stub().withArgs(),
      stopPropagation: sinon.stub().withArgs()
    };
    const wrapper = renderComponent({
      changeState
    });
    const instance = wrapper.instance();
    instance._onLastRevisionClick(evt);
    assert.strictEqual(evt.preventDefault.callCount, 1, 'preventDefault');
    assert.strictEqual(evt.stopPropagation.callCount, 1, 'stopPropagation');
    assert.strictEqual(changeState.callCount, 1, 'changeState');
    const args = changeState.args[0];
    assert.strictEqual(args.length, 1, 'changeState args');
    assert.deepEqual(args[0], {store: 'u/who/django/42'});
  });

  it('can disable the deploy button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Button').prop('disabled'), true);
  });
});
