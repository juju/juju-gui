/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('UserProfileEntityList', () => {
  var charmstore, charms, bundles;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-entity-list', () => { done(); });
  });

  beforeEach(() => {
    var list = sinon.stub();
    var charm = jsTestUtils.makeEntity().toEntity();
    charm.series = [charm.series];
    charms = [charm];
    var bundle = jsTestUtils.makeEntity(true).toEntity();
    bundle.series = [bundle.series];
    bundles = [bundle];
    list.withArgs('who', sinon.match.any, 'charm').callsArgWith(
      1, null, charms);
    list.withArgs('who', sinon.match.any, 'bundle').callsArgWith(
      1, null, bundles);
    charmstore = {
      list: list,
      url: 'example.com/9'
    };
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={{}}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who'
      />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinners for charms and bundles', () => {
    charmstore.list = sinon.stub();
    var type = 'charm';
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type={type}
        user='who'
      />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__charm-list twelve-col">
        <juju.components.Spinner />
      </div>
    ));
  });

  it('renders a list of charms', () => {
    var changeState = sinon.stub();
    var type = 'charm';
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type={type}
        user='who'
      />, true);
    var output = component.getRenderOutput();
    var expected = (
      <div className="user-profile__charm-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Charms
          <span className="user-profile__size">
            ({1})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col eight-col">
              Name
            </span>
            <span className={'user-profile__list-col prepend-one three-col ' +
              'last-col'}>
              Series
            </span>
          </li>
          {[<juju.components.UserProfileEntity
            changeState={changeState}
            entity={charms[0]}
            key="cs:django"
            type="charm">
            <span className={'user-profile__list-col five-col ' +
              'user-profile__list-name'}>
              django
              <ul className="user-profile__list-tags">
                {[<li className="user-profile__comma-item"
                  key="cs:django-database">
                  database
                </li>]}
              </ul>
            </span>
            <span className={'user-profile__list-col three-col ' +
              'user-profile__list-icons'}>
              <img className="user-profile__list-icon"
                src="example.com/9/django/icon.svg"
                title="django" />
            </span>
            <span className={'user-profile__list-col prepend-one three-col ' +
              'last-col'}>
              <ul className="user-profile__list-series">
                {[<li className="user-profile__comma-item"
                  key="cs:django-trusty">
                  trusty
                </li>]}
              </ul>
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('renders a list of bundles', () => {
    var changeState = sinon.stub();
    var getDiagramURL = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={changeState}
        charmstore={charmstore}
        getDiagramURL={getDiagramURL}
        type='bundle'
        user='who'
      />, true);
    var output = component.getRenderOutput();
    var expected = (
      <div className="user-profile__bundle-list">
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
            <span className={
              'user-profile__list-col three-col prepend-one last-col'}>
              Units
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
            <span className={
              'user-profile__list-col three-col prepend-one last-col'}>
              {5}
            </span>
          </juju.components.UserProfileEntity>]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('requests charms and updates state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who'
      />, true);
    var instance = component.getMountedInstance();
    assert.equal(charmstore.list.callCount, 1,
                 'charmstore list not called');
    assert.equal(charmstore.list.args[0][0], 'who',
                 'username not passed to list request');
    assert.deepEqual(instance.state.entityList, charms,
                     'callback does not properly set entity state');
  });

  it('requests bundles and updates state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='bundle'
        user='who'
      />, true);
    var instance = component.getMountedInstance();
    assert.equal(charmstore.list.callCount, 1,
                 'charmstore list not called');
    assert.equal(charmstore.list.args[0][0], 'who',
                 'username not passed to list request');
    assert.deepEqual(instance.state.entityList, bundles,
                     'callback does not properly set entity state');
  });

  it('will abort the requests when unmounting', function() {
    var charmstoreAbort = sinon.stub();
    charmstore.list = sinon.stub().returns({abort: charmstoreAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who'
      />, true);
    renderer.unmount();
    assert.equal(charmstoreAbort.callCount, 1);
  });

  it('gets the entity data when the user authenticates', () => {
    var list = sinon.stub();
    var charmstore = {list: list};
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user={null} />, true);
    assert.equal(list.callCount, 0);
    component.render(
      <juju.components.UserProfileEntityList
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(list.callCount, 1);
  });

  it('broadcasts starting status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        broadcastStatus={broadcastStatus}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(broadcastStatus.args[0][0], 'starting');
  });

  it('broadcasts ok status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        broadcastStatus={broadcastStatus}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(broadcastStatus.args[1][0], 'ok');
  });

  it('broadcasts empty status', function() {
    charmstore.list = sinon.stub().callsArgWith(1, null, []);
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        broadcastStatus={broadcastStatus}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(broadcastStatus.args[1][0], 'empty');
  });

  it('broadcasts error status', function() {
    charmstore.list = sinon.stub().callsArgWith(1, 'error', null);
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileEntityList
        broadcastStatus={broadcastStatus}
        changeState={sinon.stub()}
        charmstore={charmstore}
        getDiagramURL={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(broadcastStatus.args[1][0], 'error');
  });
});
