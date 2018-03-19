/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const CopyToClipboard = require('../../copy-to-clipboard/copy-to-clipboard');
const EntityHeader = require('./header');
const GenericButton = require('../../generic-button/generic-button');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('EntityHeader', function() {
  let acl, mockEntity, urllib;

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
      plans={options.plans}
      pluralize={options.pluralize || sinon.stub()}
      scrollPosition={
        options.scrollPosition === undefined ? 0 : options.scrollPosition}
      urllib={options.urllib || urllib} />,
    { disableLifecycleMethods: true }
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    mockEntity = jsTestUtils.makeEntity();
    urllib = sinon.stub();
    urllib.fromLegacyString = sinon.stub().returns({
      revision: 42,
      path: sinon.stub().returns('u/who/django/42'),
      legacyPath: sinon.stub().returns('django-cluster')
    });
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders the latest entity properly', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="row-hero"
        ref="headerWrapper"
        style={{}}>
        <header className="entity-header">
          <div className="inner-wrapper">
            <div className="eight-col no-margin-bottom">
              <img alt="django" className="entity-header__icon"
                src="data:image/gif;base64," width="96" />
              <h1
                className="entity-header__title"
                itemProp="name"
                ref="entityHeaderTitle">
                django{' '}
                <span className="entity-header__version">
                  {'#'}{123}
                </span>
              </h1>
              <ul className="bullets inline entity-header__properties">
                <li className="entity-header__by">
                  By&nbsp;
                  <span className="link"
                    onClick={wrapper.find('.entity-header__by .link').prop('onClick')}>
                    test-owner
                  </span>
                </li>
                <li className="entity-header__series">
                  <span className="link"
                    onClick={wrapper.find('.entity-header__series .link').prop('onClick')}>
                    Latest version (#{42})
                  </span>
                </li>
                {[<li className="entity-header__series" key="trusty">
                  trusty
                </li>]}
                {undefined}
                {<li className="entity-header__channels"
                  key="Stable, Candidate">
                  Stable, Candidate
                </li>}
              </ul>
              <ul className="entity-header__social-list">
                <li>
                  <a href={'https://twitter.com/intent/tweet?text=django%20' +
                      'charm&via=ubuntu_cloud&url=https%3A%2F%2Fjujucharms' +
                      '.com%2Fdjango%2Ftrusty%2F'}
                  id="item-twitter"
                  target="_blank">
                    <SvgIcon
                      name="icon-social-twitter"
                      size="36" />
                  </a>
                </li>
                <li>
                  <a href={'https://plus.google.com/share?url=https%3A%2F%2F' +
                      'jujucharms.com%2Fdjango%2Ftrusty%2F'}
                  id="item-googleplus"
                  target="_blank">
                    <SvgIcon
                      name="icon-social-google"
                      size="36" />
                  </a>
                </li>
              </ul>
            </div>
            <div className={
              'entity-header__right four-col last-col no-margin-bottom'}>
              {undefined}
              <CopyToClipboard
                value="juju deploy cs:django" />
              <GenericButton
                action={wrapper.find('GenericButton').prop('action')}
                disabled={false}
                ref="deployAction"
                tooltip="Add this charm to a new model"
                type="positive">
                Add to model
              </GenericButton>
            </div>
          </div>
        </header>
      </div>);
    assert.compareJSX(wrapper, expected);
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
      <select className="entity-header__select"
        ref="plan">
        <option key="default">Choose a plan</option>
        {[<option key="test0"
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
      <select className="entity-header__select"
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
    const pluralize = sinon.stub();
    pluralize.withArgs('application').returns('applications');
    pluralize.withArgs('machine').returns('machines');
    pluralize.withArgs('unit').returns('units');
    const entity = jsTestUtils.makeEntity(true);
    const wrapper = renderComponent({
      entityModel: entity,
      pluralize
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
    const entity = jsTestUtils.makeEntity(false, {is_subordinate: true});
    const wrapper = renderComponent({
      entityModel: entity
    });
    const expected = (
      <li className="entity-header__subordinate">
        Subordinate
        <a href={
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
    const deployAction = wrapper.find('GenericButton');
    assert.equal(deployAction.prop('type'), 'positive');
    assert.equal(deployAction.children().text(), 'Add to model');
  });

  it('displays the model name in the add to model button if provided', () => {
    const wrapper = renderComponent({
      getModelName: sinon.stub().returns('porkchop')
    });
    const deployAction = wrapper.find('GenericButton');
    assert.equal(deployAction.prop('type'), 'positive');
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
    wrapper.find('GenericButton').props().action();
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
    instance.refs = { plan: { value: 'test-plan' } };
    // Simulate a click.
    wrapper.find('GenericButton').props().action();
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
    wrapper.find('GenericButton').props().action();
    assert.equal(deployService.callCount, 1);
    assert.deepEqual(deployService.args[0][2], plans);
    assert.isUndefined(deployService.args[0][3]);
  });

  it('adds a bundle when the add button is clicked', function() {
    const deployService = sinon.stub();
    const getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    const importBundleYAML = sinon.stub();
    const entity = jsTestUtils.makeEntity(true);
    const wrapper = renderComponent({
      deployService,
      entityModel: entity,
      getBundleYAML,
      importBundleYAML
    });
    // Simulate a click.
    wrapper.find('GenericButton').props().action();
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.deepEqual(importBundleYAML.args[0][0], 'mock yaml');
    assert.equal(importBundleYAML.args[0][1], 'u/who/django/42');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    const getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    const addNotification = sinon.stub();
    const entity = jsTestUtils.makeEntity(true);
    const wrapper = renderComponent({
      addNotification,
      entityModel: entity,
      getBundleYAML
    });
    // Simulate a click.
    wrapper.find('GenericButton').props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(
      addNotification.args[0][0].title, 'Bundle failed to deploy');
  });

  it('can display as sticky', function() {
    const wrapper = renderComponent({
      scrollPosition: 100
    });
    const instance = wrapper.instance();
    instance.refs = {
      headerWrapper: {
        clientHeight: 99
      }
    };
    instance.componentDidMount();
    wrapper.update();
    // const expected = (
    //   <div className="row-hero"
    //     ref="headerWrapper"
    //     style={{height: '99px'}}>
    //     <header className="entity-header entity-header--sticky">
    //       {output.props.children.props.children}
    //     </header>
    //   </div>
    // );
    assert.deepEqual(wrapper.find('.row-hero').prop('style'), {height: '99px'});
    assert.equal(
      wrapper.find('header').prop('className').includes('entity-header--sticky'),
      true);
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
    assert.equal(wrapper.find('GenericButton').prop('disabled'), true);
  });
});
