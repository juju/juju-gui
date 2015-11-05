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

describe('EnvList', function() {

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('env-list', function() { done(); });
  });

  it('renders a list of environments', function() {
    // JEM and JES use different keys for the name so this checks to make sure
    // that both are displayed as the name.
    var envs = [{ uuid: 'abc123', name: 'the name' },
                { uuid: '123abc', path: 'the path' }];
    var output = jsTestUtils.shallowRender(
      <juju.components.EnvList
        envs={envs} />);
    assert.deepEqual(output.props.children[0].props.children, [
      <li className="env-list__environment"
        data-id={envs[0].uuid}
        onClick={undefined}
        key={envs[0].uuid}>
        {envs[0].name}
      </li>,
      <li className="env-list__environment"
        data-id={envs[1].uuid}
        onClick={undefined}
        key={envs[1].uuid}>
        {envs[1].path}
      </li>]);
  });

  it('clicking an env calls the handleEnvClick prop', function() {
    var envs = [{ uuid: 'abc123', name: 'the name' }];
    var handleEnvClick = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.EnvList
        envs={envs}
        handleEnvClick={handleEnvClick} />);
    output.props.children[0].props.children[0].props.onClick();
    assert.equal(handleEnvClick.callCount, 1);
  });

  it('createNewEnv prop passed to buttonRow passes envName', function() {
    var envs = [{ uuid: 'abc123', name: 'the name' }];
    var createNewEnv = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.EnvList
        envs={envs}
        createNewEnv={createNewEnv} />);
    // Set the new environment name
    component.refs.envName.value = 'new env name';
    testUtils.Simulate.change(component.refs.envName);

    testUtils.Simulate.click(
        ReactDOM.findDOMNode(component).querySelector('.generic-button'));

    assert.equal(createNewEnv.callCount, 1);
    assert.equal(createNewEnv.args[0][0], 'new env name');
  });

});
