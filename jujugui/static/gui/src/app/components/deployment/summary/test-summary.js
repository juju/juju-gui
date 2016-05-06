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
  var changeCounts, pluralize;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary', function() { done(); });
  });

  beforeEach(() => {
    changeCounts = {
      '_addMachines': 1,
      '_deploy': 2
    };
    pluralize = (val) => {
      return val + 's';
    };
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={{}}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{templateName: 'spinach/my-creds'}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeCounts={changeCounts}
        changeDescriptions={changeDescriptions}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />, true);
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
          title="Review deployment">
          <form className="six-col last-col">
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
              type="text"
              disabled={false} />
          </form>
          <div className={'deployment-choose-cloud__cloud-option ' +
            'deployment-summary__cloud-option six-col last-col'}>
            <span className={
              'deployment-choose-cloud__cloud-option-title'}>
              <span className="deployment-choose-cloud__cloud-option-name">
                my-creds
              </span>
              <span className="deployment-choose-cloud__cloud-option-owner">
                spinach
              </span>
            </span>
            <form className="deployment-summary__cloud-option-region">
              <label className="deployment-panel__label"
                htmlFor="region">
                Region
              </label>
              <input className="deployment-panel__input"
                id="region"
                placeholder="us-central1"
                required="required"
                type="text" />
            </form>
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Deploying {2} {'services'} on&nbsp;{1} {'machines'}
          </h3>
          {undefined}
          <juju.components.ExpandingRow
            classes={{
              'deployment-summary__changelog': true
            }}>
            <div className="deployment-summary__changelog-title">
              <div className="deployment-summary__changelog-title-chevron">
                <juju.components.SvgIcon
                  name="chevron_down_16"
                  size="16" />
              </div>
              <span>
                View complete change log ({6}&nbsp;{'changes'})
              </span>
              {undefined}
            </div>
            <ul className="deployment-summary__list">
              <li className={'deployment-summary-change-item ' +
                  'deployment-summary__list-header'}>
                <span className="deployment-summary-change-item__change">
                  Change
                </span>
                <span className="deployment-summary-change-item__time">
                  Time
                </span>
              </li>
              {changeItems}
            </ul>
          </juju.components.ExpandingRow>
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
        deploymentStorage={{templateName: 'spinach/my-creds'}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeCounts={changeCounts}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        controller="yellow/aws-eu-central"
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-summary__placement twelve-col">
        <span>
          You have {'1'}{' unplaced '}{'units'}{', '}{'thiss'}
          {' will be  placed onto '}{'as'}{' new '}{'machines'}.
          To remove or  manually place these units use the 
        </span>
        <span className="link" tabIndex="0" role="button"
          onClick={instance._handleViewMachinesClick}>
          machine view
        </span>.
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
        deploymentStorage={{templateName: 'spinach/my-creds'}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeCounts={changeCounts}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={true}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <span className="link deployment-panel__section-title-link"
        onClick={instance._handleClear}
        role="button"
        tabIndex="0">
        Clear all changes&nbsp;&rsaquo;
      </span>);
    assert.deepEqual(output.props.children[0].props.children[4]
      .props.children[0].props.children[2], expected);
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
        deploymentStorage={{templateName: 'spinach/my-creds'}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeCounts={changeCounts}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />);
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
        deploymentStorage={{templateName: 'spinach/my-creds'}}
        users={{}}
        autoPlaceUnits={sinon.stub()}
        changeCounts={changeCounts}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />);
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

  it('only commits changes on existing models', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var ecsCommit = sinon.stub();
    var jem = {
      newModel: sinon.stub(),
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        jem={jem}
        env={{}}
        appSet={sinon.stub()}
        createSocketURL={sinon.stub()}
        controller="yellow/aws-eu-central"
        deploymentStorage={{ templateName: 'secureTemplate' }}
        users={{ jem: { user: 'joecoder' }}}
        autoPlaceUnits={autoPlaceUnits}
        changeCounts={changeCounts}
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        changeDescriptions={[]}
        changeState={changeState}
        getUnplacedUnitCount={sinon.stub().returns(1)}
        modelCommitted={true}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    // We need to make sure that the model name input is disabled if
    // the user is deploying to an existing model.
    var props = output.props;
    assert.equal(
      props.children[0].props.children[0].props.children[1].props.disabled,
      true);
    assert.equal(props.children[1].props.buttons[0].title, 'Commit');
    instance.refs = {modelName: {value: 'Prod'}};
    output.props.children[1].props.buttons[0].action();
    assert.equal(autoPlaceUnits.callCount, 1);
    assert.equal(ecsCommit.callCount, 1);
    assert.equal(changeState.callCount , 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
    // The deploy method should exit before trying to call to
    // create a new model.
    assert.equal(jem.newModel.callCount, 0);
  });

  it('creates a new model on deploy', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var ecsCommit = sinon.stub();
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var appSet = sinon.stub();
    var createSocketURL = sinon.stub().returns('newurl');
    var jem = {
      newModel: sinon.stub(),
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
        changeCounts={changeCounts}
        changeDescriptions={[]}
        changeState={changeState}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        modelName="Prod"
        numberOfChanges={6}
        pluralize={pluralize} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    instance.refs = {modelName: {value: 'Prod'}};
    output.props.children[1].props.buttons[1].action();
    // We automatically autoplace units on deploy in this workflow.
    assert.equal(autoPlaceUnits.callCount, 1, 'autoplace not called');
    // We first need to create a new model to deploy our changes into.
    assert.equal(jem.newModel.callCount, 1);
    assert.equal(jem.newModel.args[0][0], 'joecoder');
    assert.equal(jem.newModel.args[0][1], 'Prod');
    assert.equal(jem.newModel.args[0][2], 'secureTemplate');
    assert.equal(jem.newModel.args[0][3], 'yellow/aws-eu-central');
    // Call the callback from creating a new model to make sure it performs
    // the approriate calls.
    jem.newModel.args[0][4](null, {
      hostPorts: ['1.1.1.1:1234'],
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
    assert.equal(appSet.callCount, 2);
    assert.deepEqual(appSet.args[0], ['jujuEnvUUID', '1qaz2wsx3edc']);
    assert.deepEqual(appSet.args[1], ['socket_url', 'newurl']);
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
