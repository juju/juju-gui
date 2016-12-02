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
  let model;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-entity', () => { done(); });
  });

  beforeEach(() => {
    model = {
      uuid: 'env1',
      name: 'spinach/sandbox',
      lastConnection: 'today',
      owner: 'test-owner',
      isController: false,
      isAlive: true
    };
  });

  it('can render a model', () => {
    const displayConfirmation = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        displayConfirmation={displayConfirmation}
        entity={model}
        expanded={false}
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
            <div className="seven-col no-margin-bottom">
              {undefined}{"sandbox"}
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'five-col last-col no-margin-bottom'}>
              <juju.components.GenericButton
                action={displayConfirmation}
                type="inline-base"
                title="Destroy model" />
              <juju.components.GenericButton
                action={button.props.action}
                type="inline-neutral"
                title="Manage" />
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            {undefined}
            <div className="three-col last-col">
              Owner: {"test-owner"}
            </div>
            {undefined}
            {undefined}
            {undefined}
            {undefined}
          </div>
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
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
        expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="seven-col no-margin-bottom">
              {undefined}{"django-cluster"}
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'five-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral"
                title="View" />
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            <div className="nine-col">
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
            <div className="three-col last-col">
              Owner: {"test-owner"}
            </div>
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
    assert.deepEqual(output, expected);
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
        expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="seven-col no-margin-bottom">
              {undefined}{"django-cluster"}
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'five-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral"
                title="View" />
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            {undefined}
            <div className="nine-col">
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
            <div className="three-col last-col">
              Owner: {"test-owner"}
            </div>
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
    assert.deepEqual(output, expected);
  });

  it('can render a charm', () => {
    const charm = jsTestUtils.makeEntity().toEntity();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
        changeState={sinon.stub()}
        entity={charm}
        expanded={false}
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
        expanded={false}>
        <span>Summary details</span>
        <div>
          <div className="expanding-row__expanded-header twelve-col">
            <div className="seven-col no-margin-bottom">
              <img className="user-profile__entity-icon"
                src={undefined}
                title="django" />
              django
            </div>
            <div className={'expanding-row__expanded-header-action ' +
              'five-col last-col no-margin-bottom'}>
              {undefined}
              <juju.components.GenericButton
                action={viewButton.props.action}
                type="inline-neutral"
                title="View" />
            </div>
          </div>
          <div className={'expanding-row__expanded-content twelve-col ' +
            'no-margin-bottom'}>
            <div className="nine-col">
              Series: {"trusty"}
            </div>
            {undefined}
            <div className="three-col last-col">
              Owner: {"test-owner"}
            </div>
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
    assert.deepEqual(output, expected);
  });

  it('can switch envs for a model', () => {
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
    assert.equal(switchModel.args[0][0], 'env1');
    assert.equal(switchModel.args[0][1], 'sandbox');
  });

  it('can display a delete confirmation', () => {
    const displayConfirmation = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntity
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
});
