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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EntityHeader', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-header', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders an entity properly', function() {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          addNotification={sinon.stub()}
          changeState={sinon.spy()}
          currentModel="uuid123"
          deployService={sinon.spy()}
          entityModel={mockEntity}
          environmentName="my-env"
          getBundleYAML={sinon.stub()}
          importBundleYAML={sinon.stub()}
          listModels={sinon.stub()}
          pluralize={sinon.stub()}
          scrollPosition={0}
          switchModel={sinon.stub()}
          user={{}} />, true);
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
                django
              </h1>
              <ul className="bullets inline entity-header__properties">
                <li className="entity-header__by">
                  By{' '}
                  <a href="https://launchpad.net/~test-owner"
                    target="_blank">test-owner</a>
                </li>
                <li className="entity-header__series">
                  trusty
                </li>
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
            <div className="four-col last-col no-margin-bottom">
              <juju.components.CopyToClipboard
                value="juju deploy cs:django" />
              <juju.components.MultiButton
                action={instance._handleDeploy}
                defaultValue={{
                  name: 'my-env',
                  uuid: 'uuid123'
                }}
                options={[{
                  label: 'Add to new',
                  value: {
                    name: null,
                    uuid: null
                  }
                }]}
                type="positive"
                label="Add to my-env" />
            </div>
          </div>
        </header>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('displays the counts for a bundle', function() {
    var pluralize = sinon.stub();
    pluralize.withArgs('service').returns('services');
    pluralize.withArgs('machine').returns('machines');
    pluralize.withArgs('unit').returns('units');
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          addNotification={sinon.stub()}
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={entity}
          getBundleYAML={sinon.stub()}
          importBundleYAML={sinon.stub()}
          listModels={sinon.stub()}
          pluralize={pluralize}
          scrollPosition={0}
          user={{user: 'spinach'}} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <li>
        {3} {"services"},&nbsp;
        {2} {"machines"},&nbsp;
        {5} {"units"}
      </li>);
    assert.deepEqual(
      output.props.children.props.children.props.children[0]
        .props.children[2].props.children[2], expected);
  });

  it('displays an unsupported message for multi-series charms', function() {
    mockEntity.set('series', undefined);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={sinon.spy()}
        currentModel="uuid123"
        deployService={sinon.spy()}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{}} />, true);
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output.props.children.props.children.props.children[1].props.children[1],
        <div>
          This type of charm can only be deployed from the command line.
        </div>);
  });

  it('can add a charm to the current model', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={changeState}
        currentModel="uuid123"
        deployService={deployService}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={getBundleYAML}
        importBundleYAML={importBundleYAML}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{}} />, true);
    var instance = renderer.getMountedInstance();
    // Simulate a click.
    instance._handleDeploy({uuid: 'uuid123', name: 'my-env'});
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
  });

  it('can add a bundle to the current model', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    var importBundleYAML = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={changeState}
        currentModel="uuid123"
        deployService={deployService}
        entityModel={entity}
        environmentName="my-env"
        getBundleYAML={getBundleYAML}
        importBundleYAML={importBundleYAML}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{}} />, true);
    var instance = renderer.getMountedInstance();
    // Simulate a click.
    instance._handleDeploy({uuid: 'uuid123', name: 'my-env'});
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.equal(importBundleYAML.args[0][0], 'mock yaml');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={addNotification}
        changeState={changeState}
        currentModel="uuid123"
        deployService={deployService}
        entityModel={entity}
        environmentName="my-env"
        getBundleYAML={getBundleYAML}
        importBundleYAML={importBundleYAML}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{}} />, true);
    var instance = renderer.getMountedInstance();
    // Simulate a click.
    instance._handleDeploy({uuid: 'uuid123', name: 'my-env'});
    assert.equal(addNotification.callCount, 1);
    assert.equal(
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
        addNotification={addNotification}
        changeState={changeState}
        currentModel="uuid123"
        deployService={deployService}
        entityModel={entity}
        environmentName="my-env"
        getBundleYAML={getBundleYAML}
        importBundleYAML={importBundleYAML}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        scrollPosition={100}
        switchModel={sinon.stub()}
        user={{}} />, true);
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

  it('can fetch and display model options', function() {
    var models = [{
      name: 'model-1',
      uuid: 'uuid1'
    }];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={sinon.spy()}
        currentModel="uuid123"
        deployService={sinon.spy()}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, models)}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var button = output.props.children.props.children.props.children[1]
      .props.children[1];
    var expected = (
      <juju.components.MultiButton
        action={instance._handleDeploy}
        defaultValue={{
          name: 'my-env',
          uuid: 'uuid123'
        }}
        options={[{
          label: 'model-1',
          value: {
            name: 'model-1',
            uuid: 'uuid1'
          }
        }, {
          label: 'Add to new',
          value: {
            name: null,
            uuid: null
          }
        }]}
        type="positive"
        label="Add to my-env" />);
    assert.deepEqual(button, expected);
  });

  it('can update the models if the user changes', function() {
    var listModels = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={sinon.spy()}
        currentModel="uuid123"
        deployService={sinon.spy()}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={listModels}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{user: 'user1'}} />, true);
    assert.equal(listModels.callCount, 1);
    renderer.render(
      <juju.components.EntityHeader
      addNotification={sinon.stub()}
      changeState={sinon.spy()}
      currentModel="uuid123"
      deployService={sinon.spy()}
      entityModel={mockEntity}
      environmentName="my-env"
      getBundleYAML={sinon.stub()}
      importBundleYAML={sinon.stub()}
      listModels={listModels}
      scrollPosition={0}
      switchModel={sinon.stub()}
      user={{user: 'user2'}} />);
    assert.equal(listModels.callCount, 2);
  });

  it('can update the models if the user logs out', function() {
    var listModels = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={sinon.spy()}
        currentModel="uuid123"
        deployService={sinon.spy()}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={listModels}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{user: 'user1'}} />, true);
    var instance = renderer.getMountedInstance();
    assert.equal(listModels.callCount, 1);
    renderer.render(
      <juju.components.EntityHeader
      addNotification={sinon.stub()}
      changeState={sinon.spy()}
      currentModel="uuid123"
      deployService={sinon.spy()}
      entityModel={mockEntity}
      environmentName="my-env"
      getBundleYAML={sinon.stub()}
      importBundleYAML={sinon.stub()}
      listModels={listModels}
      scrollPosition={0}
      switchModel={sinon.stub()}
      user={{}} />);
    assert.equal(listModels.callCount, 1);
    assert.deepEqual(instance.state.modelList, []);
  });

  it('can switch models and deploy the entity', function() {
    var deployService = sinon.stub();
    var switchModel = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={ sinon.stub()}
        currentModel="uuid123"
        deployService={deployService}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={sinon.stub()}
        scrollPosition={0}
        switchModel={switchModel}
        user={{}} />, true);
    var instance = renderer.getMountedInstance();
    // Simulate a click.
    instance._handleDeploy({uuid: 'anotheruuid', name: 'my-env'});
    assert.equal(deployService.callCount, 0);
    assert.equal(switchModel.callCount, 1);
    assert.equal(switchModel.args[0][0], 'anotheruuid');
    assert.equal(switchModel.args[0][1], instance.state.modelList);
    assert.equal(switchModel.args[0][2], 'my-env');
    assert.equal(switchModel.args[0][3], instance._deployEntity);
  });

  it('can cancel requests when the component is unmounted', function() {
    var abort = sinon.stub();
    var listModels = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        addNotification={sinon.stub()}
        changeState={ sinon.stub()}
        currentModel="uuid123"
        deployService={sinon.stub()}
        entityModel={mockEntity}
        environmentName="my-env"
        getBundleYAML={sinon.stub()}
        importBundleYAML={sinon.stub()}
        listModels={listModels}
        scrollPosition={0}
        switchModel={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    var instance = renderer.getMountedInstance();
    // Using renderer.unmount() gives an error as shallowRender does not seem to
    // like unmounting a component with a ref on the wrapping element. Instead,
    // call the componentWillUnmount directly.
    instance.componentWillUnmount();
    assert.equal(abort.callCount, 1);
  });
});
