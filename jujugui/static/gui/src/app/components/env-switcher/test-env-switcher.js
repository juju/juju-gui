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
        environmentName="MyEnv"
        listModelsWithInfo={sinon.stub()}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);

    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();

    var expected = <div className="env-switcher"
        role="navigation"
        aria-label="Model switcher">
        <div
          className="env-switcher__toggle"
          onClick={instance.toggleEnvList}
          onKeyPress={instance.handleKeyToggle}
          id="environmentSwitcherToggle"
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="environmentSwitcherMenu"
          aria-controls="environmentSwitcherMenu"
          aria-expanded="false">
          <span className="env-switcher__name">
            MyEnv
          </span>
          <juju.components.SvgIcon name="chevron_down_16"
            className="env-switcher__chevron"
            size="16" />
        </div>
        {undefined}
      </div>;
    assert.deepEqual(output, expected);
  });

  it('open the list on click', function() {
    var showProfile = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={sinon.stub()}
        showProfile={showProfile}
        switchModel={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });

    renderer.render(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={sinon.stub()}
        showProfile={showProfile}
        switchModel={sinon.stub()} />);

    var instance = renderer.getMountedInstance();
    output = renderer.getRenderOutput();

    assert.deepEqual(output.props.children[1],
      <juju.components.EnvList
        handleEnvClick={instance.handleEnvClick}
        createNewEnv={instance.createNewEnv}
        showProfile={showProfile}
        envs={[]} />);
  });

  it('fetches a list of environments on mount', function() {
    const listModelsWithInfo = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={listModelsWithInfo}
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

  it('fetches the env list when opening', function() {
    const listModelsWithInfo = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={listModelsWithInfo}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Click the toggler
    output.props.children[0].props.onClick({
      preventDefault: () => null
    });
    assert.equal(listModelsWithInfo.callCount, 1);
    const err = null;
    const models = [{name: 'm1', isAlive: true}];
    listModelsWithInfo.args[0][0](err, models);
    assert.deepEqual(instance.state.envList, models);
  });

  it('can call to switch models', function() {
    // To switch environments you click on an environment list item in a sub
    // component so here we're just going to call the method that gets
    // passed down.
    const models = [{
      uuid: 'abc123',
      name: 'Tardis',
      user: 'The Dr.',
      password: 'buffalo',
      isAlive: true
    }];
    var listModelsWithInfo = sinon.stub();
    var switchModel = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={listModelsWithInfo}
        showProfile={sinon.stub()}
        switchModel={switchModel} />, true);
    var instance = renderer.getMountedInstance();
    instance.componentDidMount();
    listModelsWithInfo.args[0][0](null, models);
    instance.handleEnvClick({
      name: 'abc123',
      id: 'abc123'
    });
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(instance.state, {
      showEnvList: false,
      envList: models
    });
    assert.deepEqual(switchModel.args[0], ['abc123', models, 'abc123']);
  });

  it('can show the profile', function() {
    // To view the user profile you click a button in a sub component. This
    // excersizes the method that gets passed down.
    var showProfile = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EnvSwitcher.prototype.wrappedComponent
        listModelsWithInfo={sinon.stub()}
        showProfile={showProfile}
        switchModel={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    instance.toggleEnvList({preventDefault: sinon.stub()});
    var output = renderer.getRenderOutput();
    output.props.children[1].props.showProfile();
    assert.equal(showProfile.callCount, 1);
  });
});
