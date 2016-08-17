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
  var charmstore, users, env;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile', () => { done(); });
  });

  beforeEach(() => {
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
    env = {
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

  /* eslint-disable max-len */
  /**
   XXX Re-enable after the SectionLoadWatcher component is integrated.
  it('renders the empty state', () => {
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
        listModels={sinon.stub()}
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
    // eslint-disable max-len
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
    // eslint-disable max-len
    assert.deepEqual(output, expected);
  });
  **/
  /* eslint-disable max-len */

  /**
   XXX Re-enable after the SectionLoadWatcher component is integrated.
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
  **/

  it('renders a populated user profile page', () => {
    var links = [];
    var addNotification = sinon.stub();
    var canCreateNew = true;
    var changeState = sinon.stub();
    var getDiagramURL = sinon.stub();
    var hideConnectingMask = sinon.stub();
    var listBudgets = sinon.stub();
    var listModels = sinon.stub();
    var showConnectingMask = sinon.stub();
    var switchModel = sinon.stub();
    var getAgreements = sinon.stub();
    var user = users.charmstore;
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfile
        addNotification={addNotification}
        users={users}
        canCreateNew={canCreateNew}
        charmstore={charmstore}
        env={env}
        getAgreements={getAgreements}
        getDiagramURL={getDiagramURL}
        listBudgets={listBudgets}
        listModels={listModels}
        switchModel={switchModel}
        interactiveLogin={true}
        changeState={changeState}
        pluralize={sinon.stub()}
        hideConnectingMask={hideConnectingMask}
        showConnectingMask={showConnectingMask}
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
          <juju.components.UserProfileModelList
            addNotification={addNotification}
            canCreateNew={canCreateNew}
            currentModel={undefined}
            env={env}
            hideConnectingMask={hideConnectingMask}
            jem={undefined}
            listModels={listModels}
            showConnectingMask={showConnectingMask}
            switchModel={switchModel}
            user={user}
            users={users} />
          <juju.components.UserProfileEntityList
            changeState={changeState}
            charmstore={charmstore}
            getDiagramURL={getDiagramURL}
            type='bundle'
            user={user}
            users={users} />
          <juju.components.UserProfileEntityList
            changeState={changeState}
            charmstore={charmstore}
            getDiagramURL={getDiagramURL}
            type='charm'
            user={user}
            users={users} />
          <juju.components.UserProfileAgreementList
            getAgreements={getAgreements}
            user={user} />
          <juju.components.UserProfileBudgetList
            listBudgets={listBudgets}
            user={user} />
        </div>
      </div>);
    assert.deepEqual(content, expected);
  });

  it('does not pass the charmstore login if interactiveLogin is falsey', () => {
    var pluralize = sinon.stub();
    pluralize.withArgs('model', sinon.match.any).returns('models');
    var links = [];
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
});
