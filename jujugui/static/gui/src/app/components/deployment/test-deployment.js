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

describe('Deployment', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-component', function() { done(); });
  });

  it('can display the deployment summary', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var ecsClear = sinon.stub();
    var ecsCommit = sinon.stub();
    var changeDescriptions = [];
    var jem = {};
    var env = {};
    var appSet = sinon.stub();
    var createSocketURL = sinon.stub();
    var users = {
      jem: {
        user: 'foo'
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        activeComponent="summary"
        autoPlaceUnits={autoPlaceUnits}
        changeCounts={{}}
        changeDescriptions={changeDescriptions}
        changeState={changeState}
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        getUnplacedUnitCount={getUnplacedUnitCount}
        jem={jem}
        env={env}
        appSet={appSet}
        createSocketURL={createSocketURL}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={sinon.stub()}
        services={[]}
        user={{}}
        users={users} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <juju.components.DeploymentSummary
        jem={jem}
        env={env}
        appSet={appSet}
        createSocketURL={createSocketURL}
        controller='yellow/aws-us-east'
        deploymentStorage={instance._deploymentStorage}
        users={users}
        autoPlaceUnits={autoPlaceUnits}
        changeDescriptions={changeDescriptions}
        changeState={changeState}
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />);
    assert.deepEqual(output.props.children, expected);
  });

  it('can display the choose cloud step', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var ecsClear = sinon.stub();
    var ecsCommit = sinon.stub();
    var jem = {};
    var changeDescriptions = [];
    var env = {};
    var appSet = sinon.stub();
    var createSocketURL = sinon.stub();
    var pluralize = sinon.stub();
    var services = [];
    var user = {};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        activeComponent="choose-cloud"
        autoPlaceUnits={autoPlaceUnits}
        changeCounts={{}}
        changeDescriptions={changeDescriptions}
        changeState={changeState}
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        getUnplacedUnitCount={getUnplacedUnitCount}
        jem={jem}
        env={env}
        appSet={appSet}
        createSocketURL={createSocketURL}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize}
        services={services}
        user={user}
        users={{}} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <juju.components.DeploymentChooseCloud
        jem={jem}
        changeCounts={{}}
        changeState={changeState}
        clouds={instance.clouds}
        pluralize={pluralize}
        services={services}
        setDeploymentInfo={instance.setDeploymentInfo}
        user={user} />);
    assert.deepEqual(output.props.children, expected);
  });

  it('can display the add credentials step', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var ecsClear = sinon.stub();
    var ecsCommit = sinon.stub();
    var jem = {
      addTemplate: sinon.stub()
    };
    var users = {
      jem: {
        user: 'foo'
      }
    };
    var changeDescriptions = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        activeComponent="add-credentials-aws"
        appSet={sinon.stub()}
        autoPlaceUnits={autoPlaceUnits}
        changeCounts={{}}
        changeDescriptions={changeDescriptions}
        changeState={changeState}
        createSocketURL={sinon.stub()}
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        env={{}}
        getUnplacedUnitCount={getUnplacedUnitCount}
        jem={jem}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={sinon.stub()}
        services={[]}
        user={{}}
        users={users} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentAddCredentials
        changeState={changeState}
        controller='yellow/aws-us-east'
        cloud={instance.clouds['aws']}
        jem={jem}
        setDeploymentInfo={instance.setDeploymentInfo}
        users={users} />);
    assert.deepEqual(output.props.children, expected);
  });
});
