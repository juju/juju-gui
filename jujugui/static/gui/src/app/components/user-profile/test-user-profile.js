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

describe('UserProfile', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

  it('renders the header and lists', () => {
    var jem = {
      listEnvironments: sinon.stub().returns([])
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        jem={jem}
        switchEnv={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var whitelist = ['path', 'name', 'user', 'uuid', 'host-ports'];
    var expected = (
      <juju.components.Panel
        instanceName="user-profile"
        visible={true}>
        <span className="user-profile__close"
          tabIndex="0" role="button"
          onClick={instance.close}>
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
        <juju.components.UserProfileHeader />
        <juju.components.UserProfileList
          title="Models"
          data={[]}
          uuidKey="uuid"
          switchEnv={instance.switchEnv}
          whitelist={whitelist}/>
      </juju.components.Panel>
    );
    assert.deepEqual(output, expected);
  });

  it('closes when clicking the close button', () => {
    var changeState = sinon.stub();
    var listEnvs = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchEnv={sinon.stub()}
        listEnvs={listEnvs}
        showConnectingMask={sinon.stub()}
        changeState={changeState} />);

    output.props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });
  });

  it('requests jem envs if jem is provided and updates state', () => {
    var jem = {
      listEnvironments: sinon.stub()
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchEnv={sinon.stub()}
        changeState={sinon.stub()}
        showConnectingMask={sinon.stub()}
        jem={jem} />, true);
    var instance = component.getMountedInstance();

    assert.equal(jem.listEnvironments.callCount, 1);
    // This should be the callback passed to the listEnvironments call.
    jem.listEnvironments.args[0][0](null, ['myenvs']);
    assert.deepEqual(instance.state.envList, ['myenvs']);
  });

  it('requests jes envs if no jem is provided and updates state', () => {
    var listEnvs = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchEnv={sinon.stub()}
        changeState={sinon.stub()}
        showConnectingMask={sinon.stub()}
        listEnvs={listEnvs} />, true);
    var instance = component.getMountedInstance();

    assert.equal(listEnvs.args[0][0], 'user-admin');
    // This should be the callback passed to listEnvs.
    listEnvs.args[0][1](['myenvs']);
    assert.deepEqual(instance.state.envList, ['myenvs']);
  });

  it('switches env when calling switchEnv method passed to list', () => {
    // This method is passed down to child components and called from there.
    // We are just calling it directly here to unit test the method.
    var switchEnv = sinon.stub();
    var changeState = sinon.stub();
    var listEnvs = sinon.stub();
    var showMask = sinon.stub();
    var createSocketURL = sinon.stub().returns('gensocketurl');
    var dbset = sinon.stub();
    var envs = [{
      uuid: 'abc123',
      user: 'foo',
      password: 'bar'
    }];
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchEnv={switchEnv}
        createSocketURL={createSocketURL}
        changeState={changeState}
        showConnectingMask={showMask}
        dbEnvironmentSet={dbset}
        listEnvs={listEnvs} />, true);
    var instance = component.getMountedInstance();
    // Call the callback for the listEnvs call to populate the state.
    listEnvs.args[0][1](envs);
    // Call the method that's passed down. We test that this method is correctly
    // passed down in the initial 'happy path' full rendering test.
    instance.switchEnv('abc123', 'modelname');
    // Make sure we show the canvas loading mask when switching models.
    assert.equal(showMask.callCount, 1);
    // We need to call to generate the proper socket URL.
    assert.equal(createSocketURL.callCount, 1);
    // Check that switchEnv is called with the proper values.
    assert.equal(switchEnv.callCount, 1, 'switchEnv not called');
    assert.deepEqual(switchEnv.args[0], ['gensocketurl', 'foo', 'bar']);
    // The database needs to be updated with the new model name.
    assert.equal(dbset.callCount, 1);
    assert.deepEqual(dbset.args[0], ['name', 'modelname']);
    // Make sure we close the profile page when switching envs.
    assert.equal(changeState.callCount, 1, 'changeState not called');
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });

  });

});
