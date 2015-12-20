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
    var output = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        environmentName="MyEnv" />);
    assert.deepEqual(output,
      <div className="env-switcher">
        <div
          className="env-switcher--toggle"
          onClick={output.props.children[0].props.onClick}>
          <span className="environment-name">
            MyEnv
          </span>
          <juju.components.SvgIcon name="chevron_down_16"
            size="16" />
        </div>
        {''}
      </div>);
  });

  it('open the list on click', function() {
    var env = {
      listEnvs: sinon.stub()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        env={env} />, true);
    var output = renderer.getRenderOutput();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });

    renderer.render(
      <juju.components.EnvSwitcher
        env={env} />);

    var instance = renderer.getMountedInstance();
    output = renderer.getRenderOutput();

    assert.deepEqual(output.props.children[1],
      <juju.components.EnvList
        handleEnvClick={instance.handleEnvClick}
        createNewEnv={instance.createNewEnv}
        showUserProfile={instance.showUserProfile}
        envs={[]}/>);
  });

  it('fetches a list of environments on mount (JEM)', function() {
    var listEnvs = sinon.stub();
    var jem = {
      listEnvironments: listEnvs
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        jem={jem} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(listEnvs.callCount, 1);
    var envData = {
      env: 'env'
    };
    listEnvs.args[0][0](null, envData);
    assert.deepEqual(instance.state.envList, envData);
  });

  it('fetches a list of environments on mount (JES)', function() {
    var listEnvs = sinon.stub();
    var env = {
      listEnvs: listEnvs
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        env={env} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(listEnvs.callCount, 1);
    var envData = {
      envs: {env: 'env'}
    };
    listEnvs.args[0][1](envData);
    assert.deepEqual(instance.state.envList, envData.envs);
  });

  it('fetches the env list when opening', function() {
    var env = {
      listEnvs: sinon.stub()
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        env={env} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });
    assert.equal(env.listEnvs.callCount, 1);
    var envData = {
      envs: [{env: 'env'}]
    };
    env.listEnvs.args[0][1](envData);
    assert.deepEqual(instance.state.envList, envData.envs);
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
    var socketURL = '/a/socket/url/abc123';
    var createSocketURL = sinon.stub().returns(socketURL);
    var listEnvs = sinon.stub();
    var switchEnv = sinon.stub();
    var mask = sinon.stub();
    var jem = {
      listEnvironments: listEnvs
    };
    var app = {
      createSocketURL: createSocketURL,
      switchEnv: switchEnv
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        showConnectingMask={mask}
        jem={jem}
        app={app} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listEnvs.args[0][0](null, envs);
    instance.handleEnvClick({
      currentTarget: {
        getAttribute: () => 'abc123'
      }
    });
    assert.equal(mask.callCount, 1);
    assert.equal(switchEnv.callCount, 1);
    assert.deepEqual(instance.state, {
      showEnvList: false,
      envName: 'abc123',
      envList: envs
    });
    assert.deepEqual(switchEnv.args[0], [
      socketURL, envs[0].user, envs[0].password
    ]);
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
    var listEnvs = sinon.stub();
    var listSrv = sinon.stub();
    var newEnv = sinon.stub();

    listSrv.callsArgWith(0, null, [{path: 'admin/foo'}]);

    var jem = {
      listEnvironments: listEnvs,
      listServers: listSrv,
      newEnvironment: newEnv
    };
    var socketURL = '/a/socket/url/abc123';
    var createSocketURL = sinon.stub().returns(socketURL);
    var switchEnv = sinon.stub();
    var app = {
      createSocketURL: createSocketURL,
      switchEnv: switchEnv
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        jem={jem}
        app={app} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listEnvs.args[0][0](null, envs);
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
    assert.equal(listEnvs.callCount, 2);
    // Then switch to the new one.
    envs.push(createdEnv);
    listEnvs.args[1][0](null, envs);
    assert.equal(switchEnv.callCount, 1);
    // After creating a new env it should update the envName state
    assert.equal(instance.state.envName, 'newname');
  }

  it('can call to create a new env (JEM)', function() {
    createNewJEMEnvTest();
  });

  it('can use a custom env name if provided (JEM)', function() {
    createNewJEMEnvTest('custom-env-name');
  });

  it('can call to create a new env (JES)', function() {
    // To create a new environment you click a button in a sub component. This
    // excersizes the method that gets passed down.
    var envs = [{
      uuid: 'abc123',
      name: 'Tardis',
      user: 'The Dr.',
      password: 'buffalo'
    }];
    var listEnvs = sinon.stub();
    var createEnv = sinon.stub();
    var env = {
      createEnv: createEnv,
      listEnvs: listEnvs
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        env={env} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listEnvs.args[0][1](envs);
    // Previous code is to set up the state of the component.
    instance.createNewEnv();
    assert.equal(createEnv.callCount, 1);
    assert.equal(createEnv.args[0][0], 'new-env-1');
    assert.equal(createEnv.args[0][1], 'user-admin');
    // Because the callbacks are identical for JEM and JES we do not need
    // to test that it switches envs past this point as long as the previous
    // test passes.
  });

  it('can call to change the state to the profile', function() {
    // To view the user profile you click a button in a sub component. This
    // excersizes the method that gets passed down.
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher
        changeState={changeState} />, true);
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
