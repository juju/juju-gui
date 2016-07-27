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
      url: 'example.com/9'
    };
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
    env = {
      destroyModel: sinon.stub().callsArg(0),
      findFacadeVersion: sinon.stub(),
      get: sinon.stub().returns('default'),
      createModel: (modelName, userName, callback) => {
        assert.equal(modelName, 'newmodelname', 'model name not set properly');
        assert.equal(userName, 'test-owner', 'user name not set properly');
        // Simulate the model being created.
        callback({
          err: null,
          uuid: 'abc123',
          name: modelName
        });
      }
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
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={{}}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: []})}
        switchModel={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={pluralize}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
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
              <div className="user-profile__create-new user-profile__empty-button collapsed">
                <form onSubmit={instance.createAndSwitch}>
                  <juju.components.GenericButton
                    action={instance._nextCreateStep}
                    type='inline-neutral first'
                    title='Create new' />
                  <juju.components.GenericInput
                    placeholder="untitled_model"
                    required={true}
                    ref="modelName"
                    validate={[{
                      regex: /\S+/,
                      error: 'This field is required.'
                    }, {
                      regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                      error: 'This field must only contain upper and lowercase ' +
                        'letters, numbers, and hyphens. It must not start or ' +
                        'end with a hyphen.'
                    }]} />
                  <juju.components.GenericButton
                    action={instance.createAndSwitch}
                    type='inline-neutral second'
                    title='Submit' />
                </form>
              </div>
              <div className="clearfix">
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
        </div>
      </juju.components.Panel>
    );
    /* eslint-disable max-len */
    assert.deepEqual(output, expected);
  });

  it('displays the empty_profile asset with a staticURL provided', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={{}}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, [])}
        switchModel={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        staticURL='surl'
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(
      output.props.children.props.children.props.children[1].props
        .children[1].props.children[0].props.src,
      'surl/static/gui/build/app/assets/images/non-sprites/empty_profile.png');
  });

  it('displays loading spinners for charms and bundles', () => {
    charmstore.list = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        switchModel={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
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
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        switchModel={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
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
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('model');
    pluralize.withArgs('bundle', sinon.match.any).returns('bundle');
    pluralize.withArgs('charm', sinon.match.any).returns('charm');
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
    var getAgreements = sinon.stub();
    var listBudgets = sinon.stub();
    var user = users.charmstore;
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={charmstore}
        env={env}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={pluralize}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={user} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var content = output.props.children.props.children;
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
              <div className="user-profile__create-new collapsed">
                <form onSubmit={instance.createAndSwitch}>
                  <juju.components.GenericButton
                    action={instance._nextCreateStep}
                    type='inline-neutral first'
                    title='Create new' />
                  <juju.components.GenericInput
                    placeholder="untitled_model"
                    required={true}
                    ref="modelName"
                    validate={[{
                      regex: /\S+/,
                      error: 'This field is required.'
                    }, {
                      regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                      error: 'This field must only contain upper and lowercase ' +
                        'letters, numbers, and hyphens. It must not start or ' +
                        'end with a hyphen.'
                    }]} />
                  <juju.components.GenericButton
                    action={instance.createAndSwitch}
                    type='inline-neutral second'
                    title='Submit' />
                </form>
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
                entity={models[0]}
                expanded={false}
                key="env1"
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
          <juju.components.AgreementList
            getAgreements={getAgreements}
            user={user} />
          <juju.components.BudgetList
            listBudgets={listBudgets}
            user={user} />
        </div>
      </div>);
    assert.deepEqual(content, expected);
  });

  it('can render models that are being destroyed', () => {
    models[0].isAlive = false;
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        switchModel={sinon.stub()}
        interactiveLogin={true}
        changeState={sinon.stub()}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var content = output.props.children.props.children.props.children[1]
      .props.children[0].props.children[1].props.children[1][0];
    var expected = (
      <li className="user-profile__entity user-profile__list-row"
        key="env1">
        {'spinach/sandbox'} is being destroyed.
      </li>);
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
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        charmstore={{}}
        switchModel={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        changeState={sinon.stub()}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={false}
        pluralize={pluralize}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    var expected = (
      <juju.components.UserProfileHeader
        users={users}
        avatar=""
        interactiveLogin={undefined}
        links={links}
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
        addNotification={sinon.stub()}
        switchModel={sinon.stub()}
        users={users}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
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
        addNotification={sinon.stub()}
        switchModel={sinon.stub()}
        users={{}}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />, true);
    assert.equal(list.callCount, 0);
    component.render(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        switchModel={sinon.stub()}
        users={users}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(list.callCount, 2);
  });

  it('switches env when calling switchModel method passed to list', () => {
    // This method is passed down to child components and called from there.
    // We are just calling it directly here to unit test the method.
    var switchModel = sinon.stub();
    var listModels = sinon.stub().callsArgWith(0, null, {models: models});
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        switchModel={switchModel}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={{}}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        listBudgets={sinon.stub()}
        showConnectingMask={sinon.stub()}
        pluralize={sinon.stub()}
        storeUser={sinon.stub()}
        user={users.charmstore}
        listModels={listModels} />, true);
    var instance = component.getMountedInstance();
    // Call the method that's passed down. We test that this method is
    // correctly passed down in the initial 'happy path' full rendering test.
    instance.switchModel('abc123', 'modelname');
    // We need to call to generate the proper socket URL.
    // Check that switchModel is called with the proper values.
    assert.equal(switchModel.callCount, 1, 'switchModel not called');
    assert.deepEqual(switchModel.args[0], ['abc123', [{
      uuid: 'env1',
      name: 'spinach/sandbox',
      lastConnection: 'today',
      ownerTag: 'test-owner',
      isAlive: true,
      owner: 'test-owner'
    }], 'modelname', undefined]);
  });

  it('requests entities and updates state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
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
    var listModelsAbort = sinon.stub();
    var listModels = sinon.stub().returns({abort: listModelsAbort});
    charmstore.list = sinon.stub().returns({abort: charmstoreAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        listBudgets={sinon.stub()}
        listModels={listModels}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        switchModel={utilsSwitchModel}
        users={users}
        listBudgets={sinon.stub()}
        listModels={sinon.stub()}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={{}}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        interactiveLogin={true}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
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
  });

  it('can hide the create new model button', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={false}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.isUndefined(output.props.children.props.children.props.children[1]
      .props.children[0].props.children[0].props.children[2]);
  });

  it('creates then switches to newly created models', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    var showConnectingMask = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={showConnectingMask}
        storeUser={sinon.stub()}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => true,
        getValue: _ => 'newmodelname'
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children.props.children.props.children[1].props.children[0]
      .props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    assert.equal(preventable.preventDefault.callCount, 1, 'default not prevented');
    assert.equal(showConnectingMask.callCount, 1, 'mask not shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 1, 'model not switched to');
    assert.equal(switchModel.args[0][0], 'abc123', 'uuid not passed through');
    assert.equal(switchModel.args[0][2], 'newmodelname', 'model name not set');
  });

  it('does not submit to create new if name does not validate', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    var showConnectingMask = sinon.stub();
    var switchModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={showConnectingMask}
        storeUser={sinon.stub()}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => false
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children.props.children.props.children[1].props.children[0]
      .props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    assert.equal(
      preventable.preventDefault.callCount, 1, 'default not prevented');
    assert.equal(showConnectingMask.callCount, 0, 'mask shown');
    // Make sure that it switches to the model after it's created.
    assert.equal(switchModel.callCount, 0, 'model should not be switched to');
  });

  it('gracefully handles errors when creating new model', () => {
    // This test doesn't check the user interactions and animations, that
    // will need to be done with the uitest suite.
    env.createModel = (modelName, userName, callback) => {
      assert.equal(modelName, 'newmodelname', 'model name not set properly');
      assert.equal(userName, 'test-owner', 'user name not set properly');
      // Simulate the model being created.
      callback({
        err: 'this is an error',
        uuid: 'abc123',
        name: modelName
      });
    };
    var hideConnectingMask = sinon.stub();
    var addNotification = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={addNotification}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        pluralize={sinon.stub()}
        hideConnectingMask={hideConnectingMask}
        showConnectingMask={sinon.stub()}
        storeUser={sinon.stub()}
        switchModel={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var instance = component.getMountedInstance();
    // Set up the component to simulate user action.
    instance.refs = {
      modelName: {
        validate: _ => true,
        getValue: _ => 'newmodelname'
      }
    };
    var preventable = { preventDefault: sinon.stub() };
    // Call the action method in the proper element.
    output.props.children.props.children.props.children[1].props.children[0]
      .props.children[0].props.children[2].props.children.props.children[2]
      .props.action(preventable);
    // Make sure that the mask is hidden and that a notification was added
    // with the error message.
    assert.equal(hideConnectingMask.callCount, 1, 'mask not hidden');
    assert.equal(addNotification.callCount, 1, 'notification not added');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Failed to create new Model',
      message: 'this is an error',
      level: 'error'
    });
  });

  it('swtches models by switching to disconnected with JIMM', () => {
    var switchModel = sinon.stub();
    var showConnectingMask = sinon.stub();
    env.createModel = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={sinon.stub()}
        users={users}
        canCreateNew={true}
        changeState={sinon.stub()}
        charmstore={charmstore}
        env={env}
        getAgreements={sinon.stub()}
        getDiagramURL={sinon.stub()}
        listBudgets={sinon.stub()}
        listModels={sinon.stub().callsArgWith(0, null, {models: models})}
        jem={{}}
        pluralize={sinon.stub()}
        hideConnectingMask={sinon.stub()}
        showConnectingMask={showConnectingMask}
        storeUser={sinon.stub()}
        switchModel={switchModel}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    // Click the button.
    output.props.children.props.children.props.children[1].props.children[0]
      .props.children[0].props.children[2].props.children.props.children[0]
      .props.action();
    // It should not try to create a model.
    assert.equal(showConnectingMask.callCount, 0, 'should not show mask');
    assert.equal(env.createModel.callCount, 0, 'it should not create model');
    // Switching models.
    assert.equal(switchModel.callCount, 1, 'it should have called switchModel');
    assert.deepEqual(
      switchModel.args[0], [
        undefined,
        [{
          uuid: 'env1',
          name: 'spinach/sandbox',
          lastConnection: 'today',
          ownerTag: 'test-owner',
          isAlive: true,
          owner: 'test-owner'
        }],
        undefined,
        undefined
      ]);
  });
});
