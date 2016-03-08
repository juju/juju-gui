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
  var models, charmstore, charms, bundles, users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

  beforeEach(() => {
    models = [{
      uuid: 'env1',
      name: 'sandbox',
      lastConnection: 'today',
      owner: 'test-owner'
    }];
    var list = sinon.stub();
    var charm = jsTestUtils.makeEntity().toEntity();
    charm.series = [charm.series];
    charms = [charm];
    var bundle = jsTestUtils.makeEntity(true).toEntity();
    bundle.series = [bundle.series];
    bundles = [bundle];
    list.withArgs('test-owner', sinon.match.any, 'charm').callsArgWith(
      1, null, charms);
    list.withArgs('test-owner', sinon.match.any, 'bundle').callsArgWith(
      1, null, bundles);
    charmstore = {
      list: list,
      version: '9',
      url: 'example.com/'
    };
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var jem = {
      listEnvironments: sinon.stub().callsArgWith(0, null, {envs: []})
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var expected = (
      <juju.components.Panel
        instanceName="user-profile"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <juju.components.UserProfileHeader
              users={users}
              avatar=""
              bundleCount={0}
              charmCount={0}
              environmentCount={0}
              interactiveLogin={instance._interactiveLogin}
              username={users.charmstore.usernameDisplay} />
            <div className="user-profile__empty twelve-col no-margin-bottom">
              <img alt="Empty profile"
                className="user-profile__empty-image"
                src="/juju-ui/assets/images/non-sprites/empty_profile.png" />
              <h2 className="user-profile__empty-title">
                Your profile is currently empty
              </h2>
              <p className="user-profile__empty-text">
                Your models, bundles and charms will appear here when you create
                them.
              </p>
            </div>
          </div>
        </div>
      </juju.components.Panel>
    );
    assert.deepEqual(output, expected);
  });

  it('displays loading spinners for charms and bundles', () => {
    var jem = {
      listEnvironments: sinon.stub().callsArgWith(0, null, {envs: models})
    };
    charmstore.list = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(
      output.props.children.props.children.props.children[1]
        .props.children[1], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
    assert.deepEqual(
      output.props.children.props.children.props.children[1].props
        .children[2], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
  });

  it('displays loading spinners for models', () => {
    var jem = {
      listEnvironments: sinon.stub()
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(
      output.props.children.props.children.props.children[1]
        .props.children[0], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
  });

  it('renders lists of entities', () => {
    var jem = {
      listEnvironments: sinon.stub().callsArgWith(0, null, {envs: models})
    };
    var changeState = sinon.stub();
    var getDiagramURL = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={getDiagramURL}
        jem={jem}
        switchModel={switchModel}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={changeState}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          users={users}
          avatar=""
          bundleCount={1}
          charmCount={1}
          environmentCount={1}
          interactiveLogin={instance._interactiveLogin}
          username={users.charmstore.usernameDisplay} />
        <div>
          <div>
            <div className="user-profile__header twelve-col no-margin-bottom">
              Models
              <span className="user-profile__size">
                ({1})
              </span>
            </div>
            <ul className="user-profile__list twelve-col">
              <li className="user-profile__list-header twelve-col">
                <span className="user-profile__list-col three-col">
                  Name
                </span>
                <span className="user-profile__list-col four-col">
                  Credential
                </span>
                <span className="user-profile__list-col two-col">
                  Last accessed
                </span>
                <span className="user-profile__list-col one-col">
                  Units
                </span>
                <span className={
                  'user-profile__list-col two-col last-col'}>
                  Owner
                </span>
              </li>
              {[<juju.components.UserProfileEntity
                entity={models[0]}
                expanded={false}
                key="env1"
                switchModel={instance.switchEnv}
                type="model">
                <span className="user-profile__list-col three-col">
                  sandbox
                </span>
                <span className="user-profile__list-col four-col">
                  --
                </span>
                <span className="user-profile__list-col two-col">
                  today
                </span>
                <span className="user-profile__list-col one-col">
                  --
                </span>
                <span className="user-profile__list-col two-col last-col">
                  test-owner
                </span>
              </juju.components.UserProfileEntity>]}
            </ul>
          </div>
          <div>
            <div className="user-profile__header twelve-col no-margin-bottom">
              Bundles
              <span className="user-profile__size">
                ({1})
              </span>
            </div>
            <ul className="user-profile__list twelve-col">
              <li className="user-profile__list-header twelve-col">
                <span className="user-profile__list-col five-col">
                  Name
                </span>
                <span className={
                  'user-profile__list-col three-col user-profile__list-icons'}>
                  Charms
                </span>
                <span className="user-profile__list-col one-col prepend-one">
                  Units
                </span>
                <span className={
                  'user-profile__list-col two-col last-col'}>
                  Owner
                </span>
              </li>
              {[<juju.components.UserProfileEntity
                changeState={changeState}
                entity={bundles[0]}
                getDiagramURL={getDiagramURL}
                key="django-cluster"
                type="bundle">
                <span className={'user-profile__list-col five-col ' +
                  'user-profile__list-name'}>
                  django-cluster
                  <ul className="user-profile__list-tags">
                    {[<li className="user-profile__comma-item"
                      key="django-cluster-database">
                      database
                    </li>]}
                  </ul>
                </span>
                <span className={'user-profile__list-col three-col ' +
                  'user-profile__list-icons'}>
                  <img className="user-profile__list-icon"
                    key="icon-0-gunicorn"
                    src="example.com/9/gunicorn/icon.svg"
                    title="gunicorn" />
                  <img className="user-profile__list-icon"
                    key="icon-1-django"
                    src="example.com/9/django/icon.svg"
                    title="django" />
                </span>
                <span className="user-profile__list-col one-col prepend-one">
                  {5}
                </span>
                <span className="user-profile__list-col two-col last-col">
                  test-owner
                </span>
              </juju.components.UserProfileEntity>]}
            </ul>
          </div>
          <div>
            <div className="user-profile__header twelve-col no-margin-bottom">
              Charms
              <span className="user-profile__size">
                ({1})
              </span>
            </div>
            <ul className="user-profile__list twelve-col">
              <li className="user-profile__list-header twelve-col">
                <span className="user-profile__list-col three-col">
                  Name
                </span>
                <span className="user-profile__list-col seven-col">
                  Series
                </span>
                <span className="user-profile__list-col two-col last-col">
                  Owner
                </span>
              </li>
              {[<juju.components.UserProfileEntity
                changeState={changeState}
                entity={charms[0]}
                key="cs:django"
                type="charm">
                <span className={'user-profile__list-col three-col ' +
                  'user-profile__list-name'}>
                  django
                  <ul className="user-profile__list-tags">
                    {[<li className="user-profile__comma-item"
                      key="cs:django-database">
                      database
                    </li>]}
                  </ul>
                </span>
                <span className="user-profile__list-col four-col">
                  <ul className="user-profile__list-series">
                    {[<li className="user-profile__comma-item"
                      key="cs:django-trusty">
                      trusty
                    </li>]}
                  </ul>
                </span>
                <span className={'user-profile__list-col one-col ' +
                  'user-profile__list-icons'}>
                  <img className="user-profile__list-icon"
                    src="example.com/9/django/icon.svg"
                    title="django" />
                </span>
                <span className={'user-profile__list-col two-col ' +
                  'prepend-two last-col'}>
                  test-owner
                </span>
              </juju.components.UserProfileEntity>]}
            </ul>
          </div>
        </div>
      </div>);
    assert.deepEqual(output.props.children.props.children, expected);
  });

  it('does not pass the charmstore login if interactiveLogin is falsy', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        switchModel={sinon.stub()}
        listEnvs={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={false}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    var expected = (
      <juju.components.UserProfileHeader
        users={users}
        avatar=""
        bundleCount={0}
        charmCount={0}
        environmentCount={0}
        interactiveLogin={undefined}
        username={users.charmstore.usernameDisplay} />);
    assert.deepEqual(output.props.children.props.children.props.children[0],
      expected);
  });

  it('can log in to charmstore fetch macaroons from the bakery', () => {
    var macaroon = sinon.spy();
    var storeUser = sinon.stub();
    var charmstore = {
      bakery: {
        fetchMacaroonFromStaticPath:
          sinon.stub().callsArgWith(0, null, macaroon)
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        listEnvs={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        storeUser={storeUser}
        user={users.charmstore} />, true);
    var instance = renderer.getMountedInstance();
    instance._interactiveLogin();
    assert.equal(charmstore.bakery.fetchMacaroonFromStaticPath.callCount, 1);
    assert.equal(storeUser.callCount, 1);
  });

  it('gets the entity data when the user authenticates', () => {
    var list = sinon.stub();
    var charmstore = {list: list};
    jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={{}}
        listEnvs={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(list.callCount, 0);
    jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        listEnvs={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(list.callCount, 2);
  });

  it('requests jem envs if jem is provided and updates state', () => {
    var jem = {
      listEnvironments: sinon.stub().callsArgWith(0, null, {envs: models})
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        changeState={sinon.stub()}
        charmstore={{}}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore}
        jem={jem} />, true);
    var instance = component.getMountedInstance();

    assert.equal(jem.listEnvironments.callCount, 1);
    assert.deepEqual(instance.state.envList, models);
  });

  it('requests jes envs if no jem is provided and updates state', () => {
    var listEnvs = sinon.stub().callsArgWith(1, {envs: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        changeState={sinon.stub()}
        charmstore={{}}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore}
        listEnvs={listEnvs} />, true);
    var instance = component.getMountedInstance();

    assert.equal(listEnvs.args[0][0], 'user-admin');
    assert.deepEqual(instance.state.envList, models);
  });

  it('switches env when calling switchModel method passed to list', () => {
    // This method is passed down to child components and called from there.
    // We are just calling it directly here to unit test the method.
    var switchModel = sinon.stub();
    var changeState = sinon.stub();
    var listEnvs = sinon.stub();
    var showMask = sinon.stub();
    var dbset = sinon.stub();
    var envs = [{
      uuid: 'abc123',
      user: 'foo',
      password: 'bar'
    }];
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={switchModel}
        users={users}
        changeState={changeState}
        charmstore={{}}
        getDiagramURL={sinon.stub()}
        showConnectingMask={showMask}
        storeUser={sinon.stub()}
        user={users.charmstore}
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
    // Check that switchModel is called with the proper values.
    assert.equal(switchModel.callCount, 1, 'switchEnv not called');
    assert.deepEqual(switchModel.args[0], ['abc123', [{
      uuid: 'abc123', user: 'foo', password: 'bar'}]]);
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

  it('requests entities and updates state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        changeState={sinon.stub()}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        listEnvs={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    assert.equal(charmstore.list.callCount, 2,
                 'charmstore list not called');
    assert.equal(charmstore.list.args[0][0], 'test-owner',
                 'username not passed to list request');
    assert.deepEqual(instance.state.charmList, charms,
                     'callback does not properly set charm state');
    assert.deepEqual(instance.state.bundleList, bundles,
                     'callback does not properly set bundle state');
  });

  it('will abort the requests when unmounting', function() {
    var charmstoreAbort = sinon.stub();
    var listEnvsAbort = sinon.stub();
    var listEnvs = sinon.stub().returns({abort: listEnvsAbort});
    charmstore.list = sinon.stub().returns({abort: charmstoreAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        changeState={sinon.stub()}
        charmstore={charmstore}
        dbEnvironmentSet={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        listEnvs={listEnvs}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        username={users.charmstore.user} />, true);
    renderer.unmount();
    assert.equal(charmstoreAbort.callCount, 2);
    assert.equal(listEnvsAbort.callCount, 1);
  });
});
