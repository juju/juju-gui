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

  it('renders the closed switcher component', () => {
    const renderer = jsTestUtils.shallowRender(
      // Have to access the wrapped component as we don't want to test the click
      // outside wrapper.
      <juju.components.EnvSwitcher.wrappedComponent
        acl={{}}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        environmentName="MyEnv"
        listModelsWithInfo={sinon.stub()}
        humanizeTimestamp={sinon.stub()}
        setModelName={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);

    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();

    const expected = (
      <div className="env-switcher"
        role="navigation"
        aria-label="Model switcher">
        <div className="env-switcher__toggle editable">
          <span className="env-switcher__name"
            contentEditable={true}
            dangerouslySetInnerHTML={{__html: 'MyEnv'}}
            onBlur={sinon.stub()}
            onFocus={sinon.stub()}
            ref="name" />
          <div className="env-switcher__chevron"
            onClick={instance._toggleEnvList}
            onKeyPress={instance._handleKeyToggle}
            id="environmentSwitcherToggle"
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            aria-controls="environmentSwitcherMenu"
            aria-expanded="false">
            <juju.components.SvgIcon
              name="chevron_down_16"
              size="16" />
          </div>
        </div>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('should not have an editable name when the model is committed', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        acl={{}}
        changeState={sinon.stub()}
        environmentName="MyEnv"
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        modelCommitted={true}
        setModelName={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <span className="env-switcher__name">
        MyEnv
      </span>);
    expect(output.props.children[0].props.children[0]).toEqualJSX(expected);
  });

  it('can change the model name', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        acl={{}}
        changeState={sinon.stub()}
        environmentName="MyEnv"
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={sinon.stub()}
        modelCommitted={false}
        setModelName={setModelName}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      name: {
        innerText: 'new-name'
      }
    };
    const output = renderer.getRenderOutput();
    const input = output.props.children[0].props.children[0];
    input.props.onBlur();
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'new-name');
  });

  it('opens the list on click', () => {
    const acl = {};
    const changeState = sinon.stub();
    const humanizeTimestamp = sinon.stub();
    const switchModel = sinon.stub();
    const user = {username: 'who@external', displayName: 'who'};
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        humanizeTimestamp={humanizeTimestamp}
        listModelsWithInfo={sinon.stub()}
        setModelName={sinon.stub()}
        switchModel={switchModel}
        user={user} />, true);
    let output = renderer.getRenderOutput();
    // Click the toggler
    output.props.children[0].props.children[1].props.onClick({
      preventDefault: () => null
    });

    renderer.render(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        environmentName=""
        humanizeTimestamp={humanizeTimestamp}
        listModelsWithInfo={sinon.stub()}
        setModelName={sinon.stub()}
        switchModel={switchModel}
        user={user} />);

    const instance = renderer.getMountedInstance();
    output = renderer.getRenderOutput();

    const expected = <juju.components.EnvList
      acl={acl}
      changeState={changeState}
      environmentName=""
      envs={[]}
      handleModelClick={instance.handleModelClick}
      humanizeTimestamp={humanizeTimestamp}
      switchModel={switchModel}
      user={user} />;

    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('fetches a list of environments on mount', () => {
    const listModelsWithInfo = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={{}}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        setModelName={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(listModelsWithInfo.callCount, 1);
    const err = null;
    const models = [
      {name: 'model1', isAlive: true},
      {name: 'model1', isAlive: false}
    ];
    listModelsWithInfo.args[0][0](err, models);
    assert.deepEqual(instance.state.envList, [models[0]]);
  });

  it('fetches the env list when opening', () => {
    const listModelsWithInfo = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={{}}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        setModelName={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Click the toggler
    output.props.children[0].props.children[1].props.onClick({
      preventDefault: () => null
    });
    assert.equal(listModelsWithInfo.callCount, 1);
    const err = null;
    const models = [{name: 'm1', isAlive: true}];
    listModelsWithInfo.args[0][0](err, models);
    assert.deepEqual(instance.state.envList, models);
  });

  it('can call to switch models', () => {
    // To switch environments you click on an environment list item in a sub
    // component so here we're just going to call the method that gets
    // passed down.
    const models = [{
      uuid: 'abc123',
      name: 'Tardis',
      owner: 'The Dr.',
      password: 'buffalo',
      isAlive: true
    }];
    const listModelsWithInfo = sinon.stub();
    const switchModel = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={{}}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        setModelName={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={switchModel} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listModelsWithInfo.args[0][0](null, models);
    const model = {
      id: 'abc123',
      name: 'Tardis',
      owner: 'The Dr.'
    };
    instance.handleModelClick(model);
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(switchModel.args[0], [model]);
  });

  it('handles errors when getting models', function() {
    const addNotification = sinon.stub();
    const listModelsWithInfo = sinon.stub().callsArgWith(0, 'Uh oh!', null);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.wrappedComponent
        acl={{}}
        addNotification={addNotification}
        changeState={sinon.stub()}
        humanizeTimestamp={sinon.stub()}
        listModelsWithInfo={listModelsWithInfo}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to retrieve model list',
      message: 'unable to retrieve model list: Uh oh!',
      level: 'error'
    });
  });
});
