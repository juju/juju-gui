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

describe('UserProfileEntity', () => {
  let acl, model;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-entity', () => { done(); });
  });

  beforeEach(() => {
    acl = {canRemoveModel: (_) => true};
    model = {
      uuid: 'env1',
      name: 'spinach/sandbox',
      lastConnection: 'today',
      owner: 'test-owner',
      isController: false,
      isAlive: true,
      cloud: 'aws',
      credential: 'aws_user@local_foobar',
      credentialName: 'foobar',
      numMachines: 5
    };
  });

  it('can render a model', () => {
    const displayConfirmation = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        acl={acl}
        displayConfirmation={displayConfirmation}
        entity={model}
        expanded={false}
        permission="Read"
        switchModel={sinon.stub()}
        type="model">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const button = output.props.children[1].props.children[0].props.children[1]
      .props.children[1];
    const expected = (
      <juju.components.ExpandingRow classes={{
        'user-profile__entity': true, 'user-profile__list-row': true}}
      expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="six-col no-margin-bottom">
              {undefined}
              <div className="entity-title">
                <span className="entity-title__name">
                  sandbox
                </span>
                <span className="entity-title__credential">
                  foobar
                </span>
              </div>
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'six-col last-col no-margin-bottom'}>
              <juju.components.GenericButton
                action={displayConfirmation}
                type="inline-neutral">
                Destroy model
              </juju.components.GenericButton>
              <juju.components.GenericButton
                action={button.props.action}
                type="inline-neutral">
                Manage
              </juju.components.GenericButton>
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            {undefined}
            <div className="modelInfo">
              <div className="prepend-two two-col">
                test-owner
              </div>
              <div className="two-col">
                5
              </div>
              <div className="two-col">
                aws/no region
              </div>
              <div className="two-col">
                Read
              </div>
              <div className="two-col last-col">
                <juju.components.DateDisplay
                  date="today"
                  relative={true} />
              </div>
            </div>
            {undefined}
            {undefined}
            {undefined}
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a model without the ability of destroying it', () => {
    const displayConfirmation = sinon.stub();
    acl = {canRemoveModel: (_) => false};
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        acl={acl}
        displayConfirmation={displayConfirmation}
        entity={model}
        expanded={false}
        permission="Read"
        switchModel={sinon.stub()}
        type="model">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const button = output.props.children[1].props.children[0].props.children[1]
      .props.children[1];
    const expected = (
      <juju.components.ExpandingRow classes={{
        'user-profile__entity': true, 'user-profile__list-row': true}}
      expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="six-col no-margin-bottom">
              {undefined}
              <div className="entity-title">
                <span className="entity-title__name">
                  sandbox
                </span>
                <span className="entity-title__credential">
                  foobar
                </span>
              </div>
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'six-col last-col no-margin-bottom'}>
              <juju.components.GenericButton
                action={button.props.action}
                type="inline-neutral">
                Manage
              </juju.components.GenericButton>
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            {undefined}
            <div className="modelInfo">
              <div className="prepend-two two-col">
                test-owner
              </div>
              <div className="two-col">
                5
              </div>
              <div className="two-col">
                aws/no region
              </div>
              <div className="two-col">
                Read
              </div>
              <div className="two-col last-col">
                <juju.components.DateDisplay
                  date="today"
                  relative={true} />
              </div>
            </div>
            {undefined}
            {undefined}
            {undefined}
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a bundle with applications', () => {
    const bundle = jsTestUtils.makeEntity(true).toEntity();
    delete bundle.services;
    bundle.applications = {
      django: {},
      postgresql: {}
    };
    const getDiagramURL = sinon.stub().returns('bundle.svg');
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={sinon.stub()}
        entity={bundle}
        expanded={false}
        getDiagramURL={getDiagramURL}
        type="bundle">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const viewButton = output.props.children[1].props.children[0]
      .props.children[1].props.children[1];
    const tag = output.props.children[1].props.children[1]
      .props.children[5].props.children[1].props.children[0];
    const expected = (
      <juju.components.ExpandingRow classes={{
        'user-profile__entity': true, 'user-profile__list-row': true}}
      key="django-cluster"
      expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="six-col no-margin-bottom">
              {undefined}
              <div className="entity-title">
                <span className="entity-title__name">
                  django-cluster
                </span>
              </div>
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'six-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral">
                View
              </juju.components.GenericButton>
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            <div className="twelve-col last-col">
              Composed of:
              <ul className="user-profile__entity-service-list">
                <li className="user-profile__comma-item"
                  key="django-cluster-service-django">
                  django
                </li>
                <li className="user-profile__comma-item"
                  key="django-cluster-service-postgresql">
                  postgresql
                </li>
              </ul>
            </div>
            {undefined}
            <div className="user-profile__entity-diagram twelve-col">
              <object type="image/svg+xml" data="bundle.svg"
                className="entity-content__diagram-image" />
            </div>
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Description
              </div>
              <div className="ten-col last-col">
                HA Django cluster.
              </div>
            </div>
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Tags
              </div>
              <ul className="ten-col last-col">
                {[<li className="user-profile__comma-item link"
                  key="django-cluster-database"
                  onClick={tag.props.onClick}
                  role="button"
                  tabIndex="0">
                  database
                </li>]}
              </ul>
            </div>
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a bundle with services', () => {
    const bundle = jsTestUtils.makeEntity(true).toEntity();
    delete bundle.applications;
    bundle.services = {
      mysql: {},
      wordpress: {}
    };
    const getDiagramURL = sinon.stub().returns('bundle.svg');
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={sinon.stub()}
        entity={bundle}
        expanded={false}
        getDiagramURL={getDiagramURL}
        type="bundle">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const viewButton = output.props.children[1].props.children[0]
      .props.children[1].props.children[1];
    const tag = output.props.children[1].props.children[1]
      .props.children[5].props.children[1].props.children[0];
    const expected = (
      <juju.components.ExpandingRow classes={{
        'user-profile__entity': true, 'user-profile__list-row': true}}
      key="django-cluster"
      expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="six-col no-margin-bottom">
              {undefined}
              <div className="entity-title">
                <span className="entity-title__name">
                  django-cluster
                </span>
              </div>
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'six-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral">
                View
              </juju.components.GenericButton>
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            <div className="twelve-col last-col">
              Composed of:
              <ul className="user-profile__entity-service-list">
                <li className="user-profile__comma-item"
                  key="django-cluster-service-mysql">
                  mysql
                </li>
                <li className="user-profile__comma-item"
                  key="django-cluster-service-wordpress">
                  wordpress
                </li>
              </ul>
            </div>
            {undefined}
            <div className="user-profile__entity-diagram twelve-col">
              <object type="image/svg+xml" data="bundle.svg"
                className="entity-content__diagram-image" />
            </div>
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Description
              </div>
              <div className="ten-col last-col">
                HA Django cluster.
              </div>
            </div>
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Tags
              </div>
              <ul className="ten-col last-col">
                {[<li className="user-profile__comma-item link"
                  key="django-cluster-database"
                  onClick={tag.props.onClick}
                  role="button"
                  tabIndex="0">
                  database
                </li>]}
              </ul>
            </div>
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can show metrics button and graph', () => {
    const charm = jsTestUtils.makeEntity().toEntity();
    charm.series = ['trusty', 'zesty'];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={sinon.stub()}
        entity={charm}
        expanded={false}
        getKpiMetrics={sinon.stub()}
        d3={{}}
        type="charm">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    let kpiDiv = renderer.getRenderOutput().props.children[1]
      .props.children[1].props.children[7];
    assert.equal(kpiDiv, undefined);
    let instance = renderer.getMountedInstance();
    instance.setState({
      hasMetrics: true,
      metricTypes: ['bad-wolf'],
      metrics: [
        {
          metric: 'bad-wolf',
          sum: 10,
          count: 10,
          time: new Date()
        }
      ]
    });
    kpiDiv = renderer.getRenderOutput().props.children[1]
      .props.children[1].props.children[7];
    const expectedButton = (
      <div>
        <juju.components.GenericButton
          action={function noRefCheck() {}}>
          Show KPI Metrics
        </juju.components.GenericButton>
      </div>);
    expect(kpiDiv).toEqualJSX(expectedButton);
    instance.setState({kpiVisible: true});
    kpiDiv = renderer.getRenderOutput().props.children[1]
      .props.children[1].props.children[7];
    const expectedChart = (
      <div>
        <juju.components.GenericButton
          action={function noRefCheck() {}}>
          Show KPI Metrics
        </juju.components.GenericButton>
        <juju.components.UserProfileEntityKPI
          d3={{}}
          metricTypes={['bad-wolf']}
          metrics={[{count: 10, metric: 'bad-wolf', sum: 10, time: {}}]} />
      </div>);
    expect(kpiDiv).toEqualJSX(expectedChart);
  });

  it('can render a charm', () => {
    const charm = jsTestUtils.makeEntity().toEntity();
    charm.series = ['trusty', 'zesty'];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={sinon.stub()}
        entity={charm}
        expanded={false}
        getKpiMetrics={sinon.stub()}
        type="charm">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const viewButton = output.props.children[1].props.children[0]
      .props.children[1].props.children[1];
    const tag = output.props.children[1].props.children[1]
      .props.children[5].props.children[1].props.children[0];
    const expected = (
      <juju.components.ExpandingRow classes={{
        'user-profile__entity': true, 'user-profile__list-row': true}}
      key="cs:django"
      expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="six-col no-margin-bottom">
              <img className="user-profile__entity-icon"
                src={undefined}
                title="django" />
              <div className="entity-title">
                <span className="entity-title__name">
                  django
                </span>
              </div>
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'six-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral">
                View
              </juju.components.GenericButton>
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            <div className="twelve-col last-col">
              Series: {'trusty, zesty'}
            </div>
            {undefined}
            {undefined}
            {undefined}
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Description
              </div>
              <div className="ten-col last-col">
                Django framework.
              </div>
            </div>
            <div className="twelve-col no-margin-bottom">
              <div className="two-col">
                Tags
              </div>
              <ul className="ten-col last-col">
                {[<li className="user-profile__comma-item link"
                  key="cs:django-database"
                  onClick={tag.props.onClick}
                  role="button"
                  tabIndex="0">
                  database
                </li>]}
              </ul>
            </div>
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can switch to a model', () => {
    const switchModel = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        entity={model}
        switchModel={switchModel}
        type="model">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    output.props.children[1].props.children[0].props.children[1]
      .props.children[1].props.action();
    assert.equal(switchModel.callCount, 1);
    const args = switchModel.args[0];
    assert.equal(args.length, 1);
    assert.deepEqual(args[0], {
      id: 'env1',
      name: 'sandbox',
      owner: 'test-owner'
    });
  });

  it('can display a delete confirmation', () => {
    const displayConfirmation = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        acl={acl}
        entity={model}
        displayConfirmation={displayConfirmation}
        type="model">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    output.props.children[1].props.children[0].props.children[1]
      .props.children[0].props.action();
    assert.equal(displayConfirmation.callCount, 1);
  });

  it('hides the destroy button for controllers', () => {
    model.isController = true;
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        entity={model}
        type="model">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    const destroyButton = output.props.children[1].props.children[0].props
      .children[1].props.children[0];
    assert.equal(destroyButton, undefined);
  });

  it('can navigate to view a charm or bundle', () => {
    const bundle = jsTestUtils.makeEntity(true).toEntity();
    bundle.id = 'cs:django-cluster';
    const getDiagramURL = sinon.stub().returns('bundle.svg');
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={changeState}
        entity={bundle}
        getDiagramURL={getDiagramURL}
        type="bundle">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    output.props.children[1].props.children[0].props.children[1]
      .props.children[1].props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      store: 'django-cluster'
    });
  });

  it('can navigate to a tag search', () => {
    const bundle = jsTestUtils.makeEntity(true).toEntity();
    const getDiagramURL = sinon.stub().returns('bundle.svg');
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={changeState}
        entity={bundle}
        getDiagramURL={getDiagramURL}
        type="bundle">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const output = renderer.getRenderOutput();
    output.props.children[1].props.children[1].props.children[5]
      .props.children[1].props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      search: {
        tags: 'database'
      }
    });
  });

  it('handles errors getting metrics', () => {
    const addNotification = sinon.stub();
    const charm = jsTestUtils.makeEntity().toEntity();
    charm.id = 'cs:~yellow/trusty/uptime-0';
    charm.series = ['trusty', 'zesty'];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        addNotification={addNotification}
        changeState={sinon.stub()}
        entity={charm}
        expanded={false}
        getKpiMetrics={sinon.stub().callsArgWith(2, 'Uh oh!', null)}
        d3={{}}
        type="charm">
        <span>Summary details</span>
      </juju.components.UserProfileEntity>, true);
    const instance = renderer.getMountedInstance();
    instance.componentDidMount();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to retrieve metrics',
      message: 'unable to retrieve metrics: Uh oh!',
      level: 'error'
    });
  });
});
