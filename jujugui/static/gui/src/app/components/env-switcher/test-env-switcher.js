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

describe('EnvSwitcher', function() {

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('env-switcher', function() { done(); });
  });

  it('renders the closed switcher component', function() {
    var renderer = jsTestUtils.shallowRender(
      // Have to access the wrapped component as we don't want to test the click
      // outside wrapper.
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        environmentName="MyEnv"
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);

    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();

    var expected = <div className="env-switcher"
        role="navigation"
        aria-label="Model switcher">
        <div
          className="env-switcher--toggle"
          onClick={instance.toggleEnvList}
          onKeyPress={instance.handleKeyToggle}
          id="environmentSwitcherToggle"
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="environmentSwitcherMenu"
          aria-controls="environmentSwitcherMenu"
          aria-expanded="false">
          <span className="environment-name">
            MyEnv
          </span>
          <juju.components.SvgIcon name="chevron_down_16"
            size="16" />
        </div>
        {''}
      </div>;
    assert.deepEqual(output, expected);
  });

  it('open the list on click', function() {
    var env = {
      listModelsWithInfo: sinon.stub()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        env={env}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var output = renderer.getRenderOutput();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });

    renderer.render(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        env={env}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />);

    var instance = renderer.getMountedInstance();
    output = renderer.getRenderOutput();

    assert.deepEqual(output.props.children[1],
      <juju.components.EnvList
        handleEnvClick={instance.handleEnvClick}
        createNewEnv={instance.createNewEnv}
        showUserProfile={instance.showUserProfile}
        envs={[]}
        uncommittedChanges={false} />);
  });

  it('fetches a list of environments on mount (JEM)', function() {
    var listEnvironments = sinon.stub();
    var jem = {
      listEnvironments: listEnvironments
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        jem={jem}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(listEnvironments.callCount, 1);
    var envData = {
      env: 'env'
    };
    listEnvironments.args[0][0](null, envData);
    assert.deepEqual(instance.state.envList, envData);
  });

  it('fetches a list of environments on mount (controller)', function() {
    var listModelsWithInfo = sinon.stub();
    var env = {
      listModelsWithInfo: listModelsWithInfo
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        env={env}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(listModelsWithInfo.callCount, 1);
    listModelsWithInfo.args[0][0]({
      models: [{name: 'm1', isAlive: true}, {name: 'm2', isAlive: false}]
    });
    assert.deepEqual(instance.state.envList, [{name: 'm1', isAlive: true}]);
  });

  it('fetches the env list when opening', function() {
    var env = {
      listModelsWithInfo: sinon.stub()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        env={env}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });
    assert.equal(env.listModelsWithInfo.callCount, 1);
    var envData = {
      models: [{name: 'm1', isAlive: true}]
    };
    env.listModelsWithInfo.args[0][0](envData);
    assert.deepEqual(instance.state.envList, envData.models);
  });

  it('can call to switch environments', function() {
    // To switch environments you click on an environment list item in a sub
    // component so here we're just going to call the method that gets
    // passed down.
    var envs = [{
      uuid: 'abc123',
      name: 'Tardis',
      user: 'The Dr.',
      password: 'buffalo'
    }];
    var listEnvironments = sinon.stub();
    var switchModel = sinon.stub();
    var mask = sinon.stub();
    var jem = {
      listEnvironments: listEnvironments
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={mask}
        jem={jem}
        switchModel={switchModel}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listEnvironments.args[0][0](null, envs);
    instance.handleEnvClick({
      name: 'abc123',
      id: 'abc123'
    });
    assert.equal(mask.callCount, 1);
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(instance.state, {
      showEnvList: false,
      envList: envs
    });
    assert.deepEqual(switchModel.args[0], ['abc123', envs, 'abc123']);
  });

  // To fully test the new env creation it has to be tested accepting a custom
  // name as well. So there are two tests which call this method passing it
  // different data.
  function createNewJEMEnvTest(envName) {
    // To create a new environment you click a button in a sub component. this
    // excersizes the method that gets passed down.
    var envs = [{
      uuid: 'abc123',
      name: 'Tardis',
      user: 'The Dr.',
      password: 'buffalo'
    }];
    var listEnvironments = sinon.stub();
    var listSrv = sinon.stub();
    var newEnv = sinon.stub();

    listSrv.callsArgWith(0, null, [{path: 'admin/foo'}]);

    var jem = {
      listEnvironments: listEnvironments,
      listServers: listSrv,
      newEnvironment: newEnv
    };
    var switchModel = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        jem={jem}
        switchModel={switchModel}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listEnvironments.args[0][0](null, envs);
    // Previous code is to set up the state of the component.
    instance.createNewEnv(envName);
    assert.equal(newEnv.callCount, 1);
    assert.equal(newEnv.args[0][0], 'admin');
    // First we check that the env name is not undefined.
    assert.notEqual(newEnv.args[0][1], undefined);
    // Then we check to see if it matches either the name passed in, or what
    // it shoudl generate if it was passed in.
    assert.equal(newEnv.args[0][1], envName || 'new-env-1');
    assert.equal(newEnv.args[0][2], 'admin/foo');
    assert.equal(newEnv.args[0][3], 'admin/foo');
    assert.equal(newEnv.args[0][4].length > 10, true);
    // Check to make sure that the env creation callback switches envs.
    var createdEnv = {
      uuid: '123abc',
      name: 'newname'
    };
    newEnv.args[0][5](null, createdEnv);
    // After creating an env it should re-list them.
    assert.equal(listEnvironments.callCount, 2);
    // Then switch to the new one.
    envs.push(createdEnv);
    listEnvironments.args[1][0](null, envs);
    assert.equal(switchModel.callCount, 1);
  }

  it('can call to create a new env (JEM)', function() {
    createNewJEMEnvTest();
  });

  it('can use a custom env name if provided (JEM)', function() {
    createNewJEMEnvTest('custom-env-name');
  });

  it('can call to create a new env (controller)', function() {
    // To create a new environment you click a button in a sub component. This
    // excersizes the method that gets passed down.
    var envs = [{
      uuid: 'abc123',
      name: 'Tardis',
      user: 'The Dr.',
      password: 'buffalo'
    }];
    var listModelsWithInfo = sinon.stub();
    var createModel = sinon.stub();
    var env = {
      createModel: createModel,
      listModelsWithInfo: listModelsWithInfo
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        env={env}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listModelsWithInfo.args[0][0](envs);
    // Previous code is to set up the state of the component.
    instance.createNewEnv();
    assert.equal(createModel.callCount, 1);
    assert.equal(createModel.args[0][0], 'new-env-1');
    assert.equal(createModel.args[0][1], 'user-admin');
    // Because the callbacks are identical for JEM and JES we do not need
    // to test that it switches envs past this point as long as the previous
    // test passes.
  });

  it('can call to change the state to the profile', function() {
    // To view the user profile you click a button in a sub component. This
    // excersizes the method that gets passed down.
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        showConnectingMask={sinon.stub()}
        changeState={changeState}
        switchModel={sinon.stub()}
        uncommittedChanges={false} />, true);
    var instance = renderer.getMountedInstance();
    instance.showUserProfile();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'profile',
        metadata: {}
      }
    });
  });

});
