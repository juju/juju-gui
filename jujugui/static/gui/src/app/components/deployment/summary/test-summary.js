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

describe('DeploymentSummary', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary', function() { done(); });
  });

  it('can display a list of changes', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var changeDescriptions = [{
      icon: 'my-icon.svg',
      description: 'Django was added',
      time: '10:12 am'
    }, {
      icon: 'another-icon.svg',
      description: 'Apache2 was added',
      time: '10:13 am'
    }];
    var changeItems = [
      <juju.components.DeploymentSummaryChangeItem
        key={0}
        change={changeDescriptions[0]} />,
      <juju.components.DeploymentSummaryChangeItem
        key={1}
        change={changeDescriptions[1]} />];
    var className = 'deployment-summary-change-item ' +
        'deployment-summary__list-header';
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={changeDescriptions}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      action: instance._handleChangeCloud,
      title: 'Change cloud',
      type: 'inline-neutral'
    }, {
      title: 'Deploy',
      action: instance._handleDeploy,
      disabled: false,
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Deployment summary">
          <div className="deployment-panel__notice twelve-col">
            <juju.components.SvgIcon
              name="general-action-blue"
              size="16" />
            This deployment is free, you can deploy xxxxxxxxx more
          </div>
          <form className="six-col">
            <p>Name your model</p>
            <label className="deployment-panel__label"
              htmlFor="model-name">
              Model name
            </label>
            <input className="deployment-panel__input"
              defaultValue="Prod"
              id="model-name"
              placeholder="test_model_01"
              ref="modelName"
              required="required"
              type="text" />
          </form>
          <div className="six-col last-col">
            <p>Deploying to:</p>
            <div className="deployment-panel__box">
              [selected credential]
            </div>
          </div>
          {undefined}
          <h3 className="deployment-panel__section-title">
            Change log ({6})
            {undefined}
          </h3>
          <ul className="deployment-summary__list">
            <li className={className}>
              <span className="deployment-summary-change-item__change">
                Change
              </span>
              <span className="deployment-summary-change-item__time">
                Time
              </span>
            </li>
            {changeItems}
          </ul>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a placement message', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        deploymentStorage={{}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        controller="yellow/aws-eu-central"
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-summary__placement twelve-col">
        <span>
          You have {'1'} unplaced unit{''} which will
          be automatically placed.
        </span>
        <span className="link" tabIndex="0" role="button"
          onClick={instance._handleViewMachinesClick}>
          View machines
        </span>
      </div>);
    assert.deepEqual(output.props.children[0].props.children[3], expected);
  });

  it('can display a clear changes button', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={true}
        modelName="Prod"
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <h3 className="deployment-panel__section-title">
        Change log ({6})
        <span className="link deployment-panel__section-title-link"
          onClick={instance._handleClear}
          role="button"
          tabIndex="0">
          Clear all changes&nbsp;&rsaquo;
        </span>
      </h3>);
    assert.deepEqual(output.props.children[0].props.children[4], expected);
  });

  it('can navigate to the machine view', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />);
    output.props.children[0].props.children[3].props.children[1]
      .props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionB: {
        component: 'machine',
        metadata: {}
      },
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });

  it('can navigate to change the cloud', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'choose-cloud'
        }
      }
    });
  });

  it('creates a new model on deploy', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var ecsCommit = sinon.stub();
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var appSet = sinon.stub();
    var createSocketURL = sinon.stub().returns('newurl');
    var jem = {
      newEnvironment: sinon.stub(),
    };
    var detach = sinon.stub();
    var env = {
      setCredentials: sinon.stub(),
      set: sinon.stub(),
      connect: sinon.stub(),
      on: sinon.stub().returns({ detach: detach })
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={jem}
        env={env}
        appSet={appSet}
        createSocketURL={createSocketURL}
        controller="yellow/aws-eu-central"
        deploymentStorage={{ templateName: 'secureTemplate' }}
        users={{ jem: { user: 'joecoder' }}}
        autoPlaceUnits={autoPlaceUnits}
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        changeDescriptions={[]}
        changeState={changeState}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    instance.refs = {modelName: {value: 'Prod'}};
    output.props.children[1].props.buttons[1].action();
    // We automatically autoplace units on deploy in this workflow.
    assert.equal(autoPlaceUnits.callCount, 1, 'autoplace not called');
    // We first need to create a new model to deploy our changes into.
    assert.equal(jem.newEnvironment.callCount, 1);
    assert.equal(jem.newEnvironment.args[0][0], 'joecoder');
    assert.equal(jem.newEnvironment.args[0][1], 'Prod');
    assert.equal(jem.newEnvironment.args[0][2], 'secureTemplate');
    assert.equal(jem.newEnvironment.args[0][3], 'yellow/aws-eu-central');
    // This password is randomly generated so it can be of varying lengths.
    assert.equal(jem.newEnvironment.args[0][4].length > 10, true);
    // Call the callback from creating a new model to make sure it performs
    // the approriate calls.
    jem.newEnvironment.args[0][5](null, {
      'host-ports': ['1.1.1.1:1234'],
      user: 'joecoder',
      password: 'abc123',
      uuid: '1qaz2wsx3edc'
    });
    // The credentials need to be set in the app so that it can log into the
    // newly created model.
    assert.equal(env.setCredentials.callCount, 1);
    // The user prefix is important when setting the credentials here or else
    // It will fail when trying to connect with a warning from Juju which
    // will be of no help.
    assert.deepEqual(env.setCredentials.args[0][0], {
      user: 'user-joecoder',
      password: 'abc123'
    });
    assert.equal(createSocketURL.callCount, 1);
    assert.deepEqual(createSocketURL.args[0], [
      '1.1.1.1', '1234', '1qaz2wsx3edc'
    ]);
    assert.equal(appSet.callCount, 1);
    assert.deepEqual(appSet.args[0], ['socket_url', 'newurl']);
    assert.equal(env.set.callCount, 1);
    assert.deepEqual(env.set.args[0], ['socket_url', 'newurl']);
    assert.equal(env.connect.callCount, 1);
    assert.equal(env.on.callCount, 1);
    assert.equal(env.on.args[0][0], 'login');
    // Make sure that it commits after the login call
    env.on.args[0][1]();
    assert.equal(ecsCommit.callCount, 1);
    assert.equal(ecsCommit.callCount, 1, 'ecs commit not called');
    assert.equal(changeState.callCount, 1, 'change state not called');
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
    // It should detach the env on login event listener after logging in so
    // that we don't try and commit multiple times.
    assert.equal(detach.callCount, 1);
  });
});
