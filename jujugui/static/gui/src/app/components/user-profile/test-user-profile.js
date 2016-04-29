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
  var models, charmstore, charms, bundles, users, env;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

  beforeEach(() => {
    models = [{
      uuid: 'env1',
      name: 'spinach/sandbox',
      lastConnection: 'today',
      ownerTag: 'test-owner',
      isAlive: true
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
    env = {
      findFacadeVersion: sinon.stub(),
      get: sinon.stub().returns('default')
    };
  });

  it('renders the empty state', () => {
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('models');
    pluralize.withArgs('bundle', sinon.match.any).returns('bundles');
    pluralize.withArgs('charm', sinon.match.any).returns('charms');
    var links = [{
      label: '0 models'
    }, {
      label: '0 bundles'
    }, {
      label: '0 charms'
    }];
    var jem = {
      listModels: sinon.stub().callsArgWith(0, null, [])
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={pluralize}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    /* eslint-disable max-len */
    var expected = (
      <juju.components.Panel
        instanceName="user-profile"
        visible={true}>
        <div className="twelve-col">
          <div className="inner-wrapper">
            <juju.components.UserProfileHeader
              users={users}
              avatar=""
              interactiveLogin={instance._interactiveLogin}
              links={links}
              username={users.charmstore.usernameDisplay} />
            <div className="user-profile__empty twelve-col no-margin-bottom">
              <img alt="Empty profile"
                className="user-profile__empty-image"
                src="/static/gui/build/app/assets/images/non-sprites/empty_profile.png" />
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
        {undefined}
      </juju.components.Panel>
    );
    /* eslint-disable max-len */
    assert.deepEqual(output, expected);
  });

  it('displays the empty_profile asset with a staticURL provided', () => {
    var jem = {
      listModels: sinon.stub().callsArgWith(0, null, [])
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        staticURL='surl'
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(
      output.props.children[0].props.children.props
            .children[1].props.children[0].props.src,
      'surl/static/gui/build/app/assets/images/non-sprites/empty_profile.png');
  });

  it('displays loading spinners for charms and bundles', () => {
    charmstore.list = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        listModels={sinon.stub().callsArgWith(0, {models: models})}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(
      output.props.children[0].props.children.props.children[1]
        .props.children[1], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
    assert.deepEqual(
      output.props.children[0].props.children.props.children[1].props
        .children[2], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
  });

  it('displays loading spinners for models', () => {
    var jem = {
      listModels: sinon.stub()
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        jem={jem}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(
      output.props.children[0].props.children.props.children[1]
        .props.children[0], (
          <div className="twelve-col">
          <juju.components.Spinner />
          </div>
        ));
  });

  it('renders lists of entities', () => {
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('model');
    pluralize.withArgs('bundle', sinon.match.any).returns('bundle');
    pluralize.withArgs('charm', sinon.match.any).returns('charm');
    var links = [{
      label: '1 model'
    }, {
      label: '1 bundle'
    }, {
      label: '1 charm'
    }];
    var changeState = sinon.stub();
    var getDiagramURL = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={getDiagramURL}
        gisf={false}
        listModels={sinon.stub().callsArgWith(0, {models: models})}
        switchModel={switchModel}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={pluralize}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var content = output.props.children[0].props.children;
    var expected = (
      <div className="inner-wrapper">
        <juju.components.UserProfileHeader
          users={users}
          avatar=""
          interactiveLogin={instance._interactiveLogin}
          links={links}
          username={users.charmstore.usernameDisplay} />
        <div>
          <div>
            <div className="user-profile__header twelve-col no-margin-bottom">
              Models
              <span className="user-profile__size">
                ({1})
              </span>
              <div className='user-profile__create-new'>
                <juju.components.GenericButton
                  action={instance.switchModel}
                  type='inline-neutral'
                  title='Create new' />
              </div>
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
                displayConfirmation={content.props.children[1].props
                  .children[0].props.children[1].props.children[1][0].props.displayConfirmation}
                entity={models[0]}
                expanded={false}
                key="env1"
                showDestroy={false}
                switchModel={instance.switchModel}
                type="model">
                <span className="user-profile__list-col three-col">
                  spinach/sandbox
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
              {undefined}
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
              {undefined}
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
    assert.deepEqual(content, expected);
  });

  it('does not pass the charmstore login if interactiveLogin is falsy', () => {
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('models');
    pluralize.withArgs('bundle', sinon.match.any).returns('bundles');
    pluralize.withArgs('charm', sinon.match.any).returns('charms');
    var links = [{
      label: '0 models'
    }, {
      label: '0 bundles'
    }, {
      label: '0 charms'
    }];
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={{}}
        destroyModel={sinon.stub()}
        switchModel={sinon.stub()}
        listModels={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={false}
        pluralize={pluralize}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    var expected = (
      <juju.components.UserProfileHeader
        users={users}
        avatar=""
        interactiveLogin={undefined}
        links={links}
        username={users.charmstore.usernameDisplay} />);
    assert.deepEqual(output.props.children[0].props.children.props.children[0],
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
        listModels={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        pluralize={sinon.stub()}
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
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={{}}
        listModels={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    assert.equal(list.callCount, 0);
    component.render(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        listModels={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(list.callCount, 2);
  });

  it('requests jem envs if jem is provided and updates state', () => {
    // Since JEM models currently have a different data schema from JES models.
    var jemModels = models.map(function(model) {
      return {
        uuid: model.uuid,
        path: `${model.ownerTag}/${model.name}`
      };
    });
    var jem = {
      listModels: sinon.stub().callsArgWith(0, null, jemModels)
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        changeState={sinon.stub()}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        pluralize={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore}
        jem={jem} />, true);
    var instance = component.getMountedInstance();

    assert.equal(jem.listModels.callCount, 1);
    assert.deepEqual(instance.state.envList, jemModels);

    // Make sure we properly displayed the different bits within a JEM model.
    var output = component.getRenderOutput();
    var displayedModel = output.props.children[0].props.children.props.children[1].props.children[0].props.children[1].props.children[1][0]; // eslint-disable-line
    var displayedChildren = displayedModel.props.children;
    var displayedName = displayedChildren[0].props.children;
    var displayedLastConnection = displayedChildren[2].props.children;
    var displayedOwner = displayedChildren[4].props.children;
    var jemModel = jemModels[0];
    assert.equal(displayedName, jemModel.path);
    // XXX kadams54: Because we don't have a LastConnection yet for JEM models.
    assert.equal(displayedLastConnection, 'N/A');
    assert.equal(jemModel.path.indexOf(displayedOwner), 0);
  });

  it('requests controller models if no jem is passed (updates state)', () => {
    var listModels = sinon.stub().callsArgWith(0, {models: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={sinon.stub()}
        users={users}
        changeState={sinon.stub()}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        pluralize={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore}
        listModels={listModels} />, true);
    var instance = component.getMountedInstance();
    assert.deepEqual(instance.state.envList, models);
  });

  it('switches env when calling switchModel method passed to list', () => {
    // This method is passed down to child components and called from there.
    // We are just calling it directly here to unit test the method.
    var switchModel = sinon.stub();
    var changeState = sinon.stub();
    var listModels = sinon.stub();
    var showMask = sinon.stub();
    var models = [{
      uuid: 'abc123',
      user: 'foo',
      password: 'bar',
      ownerTag: 'who'
    }];
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={switchModel}
        users={users}
        changeState={changeState}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        pluralize={sinon.stub()}
        showConnectingMask={showMask}
        storeUser={sinon.stub()}
        user={users.charmstore}
        listModels={listModels} />, true);
    var instance = component.getMountedInstance();
    // Call the callback for the listModels call to populate the state.
    listModels.args[0][0]({models: models});
    // Call the method that's passed down. We test that this method is
    // correctly passed down in the initial 'happy path' full rendering test.
    instance.switchModel('abc123', 'modelname');
    // Make sure we show the canvas loading mask when switching models.
    assert.equal(showMask.callCount, 1);
    // We need to call to generate the proper socket URL.
    // Check that switchModel is called with the proper values.
    assert.equal(switchModel.callCount, 1, 'switchModel not called');
    assert.deepEqual(switchModel.args[0], ['abc123', [{
      uuid: 'abc123',
      user: 'foo',
      password: 'bar',
      ownerTag: 'who',
      owner: 'who'
    }], 'modelname']);
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
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
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

  it('gets the default model for older versions of Juju', () => {
    env.findFacadeVersion = sinon.stub().returns(null);
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    var instance = component.getMountedInstance();
    component.getRenderOutput();
    assert.deepEqual(instance.state.envList, [{
      name: 'default',
      owner: 'test owner',
      ownerTag: 'test owner',
      uuid: '',
      lastConnection: 'now'
    }]);
  });

  it('will abort the requests when unmounting', function() {
    var charmstoreAbort = sinon.stub();
    var listModelsAbort = sinon.stub();
    var listModels = sinon.stub().returns({abort: listModelsAbort});
    charmstore.list = sinon.stub().returns({abort: charmstoreAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        changeState={sinon.stub()}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        listModels={listModels}
        pluralize={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    renderer.unmount();
    assert.equal(charmstoreAbort.callCount, 2);
    assert.equal(listModelsAbort.callCount, 1);
  });

  it('can reset the model connection', () => {
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('models');
    pluralize.withArgs('bundle', sinon.match.any).returns('bundles');
    pluralize.withArgs('charm', sinon.match.any).returns('charms');
    var utilsSwitchModel = sinon.stub();
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        switchModel={utilsSwitchModel}
        users={users}
        listModels={sinon.stub()}
        showConnectingMask={sinon.stub()}
        changeState={changeState}
        charmstore={{}}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        interactiveLogin={true}
        storeUser={sinon.stub()}
        pluralize={pluralize}
        user={users.charmstore} />, true);
    var instance = renderer.getMountedInstance();
    instance.switchModel();
    assert.equal(utilsSwitchModel.callCount, 1,
                 'Model disconnect not called');
    var switchArgs = utilsSwitchModel.args[0];
    assert.equal(switchArgs[0], undefined,
                 'UUID should not be defined');
    assert.deepEqual(changeState.getCall(0).args[0], {
      sectionC: {
        component: null,
        metadata: null
      }
    }, 'App state not reset');
  });

  it('can display a confirmation when models are to be destroyed', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        users={users}
        charmstore={charmstore}
        destroyModel={sinon.stub()}
        env={env}
        getDiagramURL={sinon.stub()}
        gisf={false}
        listModels={sinon.stub().callsArgWith(0, {models: models})}
        switchModel={sinon.stub()}
        showConnectingMask={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    output.props.children[0].props.children.props.children[1].props
      .children[0].props.children[1].props.children[1][0]
      .props.displayConfirmation();
    output = component.getRenderOutput();
    var expected = (
      <juju.components.ConfirmationPopup
        buttons={output.props.children[1].props.buttons}
        message="Are you sure you want to destroy sandbox? This action cannot be undone."
        title="Destroy model" />);
    assert.deepEqual(output.props.children[1], expected);
  });
});
