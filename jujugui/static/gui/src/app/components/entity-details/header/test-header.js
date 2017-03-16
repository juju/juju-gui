/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EntityHeader', function() {
  let acl, mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-header', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders the latest entity properly', function() {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getModelName={sinon.stub()}
          getBundleYAML={sinon.stub()}
          hasPlans={false}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="row-hero"
        ref="headerWrapper"
        style={{}}>
        <header className="entity-header">
          <div className="inner-wrapper">
            <div className="eight-col no-margin-bottom">
              <img src="data:image/gif;base64," alt="django"
                   width="96" className="entity-header__icon"/>
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
                  By{' '}
                  <a href="https://launchpad.net/~test-owner"
                    className="link"
                    target="_blank">test-owner</a>
                </li>
                {[<li key="trusty" className="entity-header__series">
                  trusty
                </li>]}
                {undefined}
              </ul>
              <ul className="entity-header__social-list">
                <li>
                  <a id="item-twitter"
                    target="_blank"
                    href={'https://twitter.com/intent/tweet?text=django%20' +
                      'charm&via=ubuntu_cloud&url=https%3A%2F%2Fjujucharms' +
                      '.com%2Fdjango%2Ftrusty%2F'}>
                    <juju.components.SvgIcon
                      name="icon-social-twitter"
                      size="35"/>
                  </a>
                </li>
                <li>
                  <a id="item-googleplus"
                    target="_blank"
                    href={'https://plus.google.com/share?url=https%3A%2F%2F' +
                      'jujucharms.com%2Fdjango%2Ftrusty%2F'}>
                    <juju.components.SvgIcon
                      name="icon-social-google"
                      size="35"/>
                  </a>
                </li>
              </ul>
            </div>
            <div className={
              'entity-header__right four-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.CopyToClipboard
                value="juju deploy cs:django" />
              <juju.components.GenericButton
                ref="deployAction"
                action={instance._handleDeployClick}
                disabled={false}
                type="positive"
                title="Add to model" />
            </div>
          </div>
        </header>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('renders an old entity properly', function() {
    mockEntity.set('revision_id', 122);
    const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getBundleYAML={sinon.stub()}
          getModelName={sinon.stub()}
          hasPlans={false}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    const output = renderer.getRenderOutput();

    assert.deepEqual(
      output.props.children.props.children.props.children[0].
      props.children[1].props.children[2].props.children[1],
      122
    );
  });

  it('can display plans', function() {
    var plans = [{
      url: 'test'
    }];
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getModelName={sinon.stub()}
          getBundleYAML={sinon.stub()}
          hasPlans={true}
          plans={plans}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <select className="entity-header__select"
        ref="plan">
        <option key="default">Choose a plan</option>
        {[<option key="test0"
          value="test">
          test
        </option>]}
      </select>);
    assert.deepEqual(
      output.props.children.props.children.props.children[1].props.children[0],
      expected);
  });

  it('displays correctly when loading plans', function() {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getBundleYAML={sinon.stub()}
          getModelName={sinon.stub()}
          hasPlans={true}
          plans={null}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <select className="entity-header__select"
        ref="plan">
        <option key="default">Loading plans...</option>
        {null}
      </select>);
    assert.deepEqual(
      output.props.children.props.children.props.children[1].props.children[0],
      expected);
  });

  it('displays correctly when there are no plans', function() {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getBundleYAML={sinon.stub()}
          getModelName={sinon.stub()}
          hasPlans={true}
          plans={[]}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    var output = renderer.getRenderOutput();
    var expected = (undefined);
    assert.deepEqual(
      output.props.children.props.children.props.children[1].props.children[0],
      expected);
  });

  it('displays the counts for a bundle', function() {
    var pluralize = sinon.stub();
    pluralize.withArgs('application').returns('applications');
    pluralize.withArgs('machine').returns('machines');
    pluralize.withArgs('unit').returns('units');
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={entity}
          getBundleYAML={sinon.stub()}
          getModelName={sinon.stub()}
          hasPlans={false}
          importBundleYAML={sinon.stub()}
          pluralize={pluralize}
          scrollPosition={0} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <li>
        {3} {"applications"},
        &nbsp;
        {2} {"machines"},
        &nbsp;
        {5} {"units"}
      </li>);
    assert.deepEqual(
      output.props.children.props.children.props.children[0]
        .props.children[2].props.children[2], expected);
  });

  it('displays an add to model button', function() {
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        getBundleYAML={sinon.stub()}
        getModelName={sinon.stub()}
        hasPlans={false}
        importBundleYAML={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    assert.equal(deployAction.props.type, 'positive');
    assert.equal(deployAction.props.title, 'Add to model');
  });

  it('displays the model name in the add to model button if provided', () => {
    const output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        getBundleYAML={sinon.stub()}
        getModelName={sinon.stub().returns('porkchop')}
        hasPlans={false}
        importBundleYAML={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0} />);
    const deployAction = output.refs.deployAction;
    assert.equal(deployAction.props.type, 'positive');
    assert.equal(deployAction.props.title, 'Add to porkchop');
  });

  it('displays an unsupported message for multi-series charms', function() {
    mockEntity.set('series', undefined);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        getBundleYAML={sinon.stub()}
        getModelName={sinon.stub()}
        hasPlans={false}
        importBundleYAML={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0} />);
    var textContent = output.refs.deployAction.innerText;
    assert.equal(textContent, 'This type of charm can only be deployed from ' +
      'the command line.');
  });

  it('adds a charm when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={false}
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity}
        pluralize={sinon.stub()}
        scrollPosition={0}/>);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
  });

  it('can include a plan when deploying a charm', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var plans = [{url: 'test-plan'}];
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={true}
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity}
        plans={plans}
        pluralize={sinon.stub()}
        scrollPosition={0}/>);
    var refs = output.refs;
    var deployAction = refs.deployAction;
    // Change the select value to a plan.
    refs.plan.value = 'test-plan';
    // Simulate a click.
    deployAction.props.action();
    assert.equal(deployService.callCount, 1);
    assert.deepEqual(deployService.args[0][2], plans);
    assert.deepEqual(deployService.args[0][3], plans[0]);
  });

  it('can set the plans when deploying a charm without selecing one', () => {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var plans = [{url: 'test-plan'}];
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={true}
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity}
        plans={plans}
        pluralize={sinon.stub()}
        scrollPosition={0}/>);
    var refs = output.refs;
    var deployAction = refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(deployService.callCount, 1);
    assert.deepEqual(deployService.args[0][2], plans);
    assert.isUndefined(deployService.args[0][3]);
  });

  it('adds a bundle when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    var importBundleYAML = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        addNotification={sinon.stub()}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={false}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        pluralize={sinon.stub()}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.deepEqual(importBundleYAML.args[0][0], 'mock yaml');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        acl={acl}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={false}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        addNotification={addNotification}
        pluralize={sinon.stub()}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(
      addNotification.args[0][0].title, 'Bundle failed to deploy');
  });

  it('can display as sticky', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        acl={acl}
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        getModelName={sinon.stub()}
        hasPlans={false}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        addNotification={addNotification}
        pluralize={sinon.stub()}
        scrollPosition={100} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      headerWrapper: {
        clientHeight: 99
      }
    };
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output,
        <div className="row-hero"
          ref="headerWrapper"
          style={{height: '99px'}}>
          <header className="entity-header entity-header--sticky">
            {output.props.children.props.children}
          </header>
        </div>);
  });

  it('can disable the deploy button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          acl={acl}
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          getBundleYAML={sinon.stub()}
          getModelName={sinon.stub()}
          hasPlans={false}
          importBundleYAML={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.GenericButton
        ref="deployAction"
        action={instance._handleDeployClick}
        disabled={true}
        type="positive"
        title="Add to model" />);
    assert.deepEqual(output.props.children.props.children.props.children[1]
      .props.children[2], expected);
  });
});
