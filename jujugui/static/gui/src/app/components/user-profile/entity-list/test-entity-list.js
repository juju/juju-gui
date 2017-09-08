/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UserProfileEntityList = require('./entity-list');
const Spinner = require('../../spinner/spinner');
const UserProfileEntity = require('../entity/entity');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UserProfileEntityList', () => {
  var charmstore, charms, bundles;

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
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={{}}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='charm'
        user='who' />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinners for charms and bundles', () => {
    charmstore.list = sinon.stub();
    var type = 'charm';
    var component = jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type={type}
        user='who' />, true);
    var output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__charm-list twelve-col">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders a list of charms', () => {
    const addNotification = sinon.stub();
    const changeState = sinon.stub();
    const getKpiMetrics = sinon.stub();
    const type = 'charm';
    let component = jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={addNotification}
        changeState={changeState}
        charmstore={charmstore}
        d3={{}}
        entities={charms}
        getDiagramURL={sinon.stub()}
        getKpiMetrics={getKpiMetrics}
        setEntities={sinon.stub()}
        type={type}
        user='who' />, true);
    const output = component.getRenderOutput();
    const expected = (
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
          {[<UserProfileEntity
            addNotification={addNotification}
            changeState={changeState}
            d3={{}}
            entity={charms[0]}
            getKpiMetrics={getKpiMetrics}
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
          </UserProfileEntity>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders a list of bundles', () => {
    const addNotification = sinon.stub();
    var changeState = sinon.stub();
    var getDiagramURL = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={addNotification}
        changeState={changeState}
        charmstore={charmstore}
        entities={bundles}
        getDiagramURL={getDiagramURL}
        setEntities={sinon.stub()}
        type='bundle'
        user='who' />, true);
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
          {[<UserProfileEntity
            addNotification={addNotification}
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
          </UserProfileEntity>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('requests charms and updates state', () => {
    const setEntities = sinon.stub();
    jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={setEntities}
        type='charm'
        user='who' />, true);
    assert.equal(charmstore.list.callCount, 1,
      'charmstore list not called');
    assert.equal(charmstore.list.args[0][0], 'who',
      'username not passed to list request');
    assert.equal(setEntities.callCount, 1);
    assert.deepEqual(setEntities.args[0][0], charms,
      'callback does not properly set entity state');
  });

  it('requests bundles and updates state', () => {
    const setEntities = sinon.stub();
    jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={bundles}
        getDiagramURL={sinon.stub()}
        setEntities={setEntities}
        type='bundle'
        user='who' />, true);
    assert.equal(charmstore.list.callCount, 1,
      'charmstore list not called');
    assert.equal(charmstore.list.args[0][0], 'who',
      'username not passed to list request');
    assert.equal(setEntities.callCount, 1);
    assert.deepEqual(setEntities.args[0][0], bundles,
      'callback does not properly set entities');
  });

  it('will abort the requests when unmounting', function() {
    var charmstoreAbort = sinon.stub();
    charmstore.list = sinon.stub().returns({abort: charmstoreAbort});
    var renderer = jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='charm'
        user='who' />, true);
    renderer.unmount();
    assert.equal(charmstoreAbort.callCount, 1);
  });

  it('gets the entity data when the user authenticates', () => {
    var list = sinon.stub();
    var charmstore = {list: list};
    var component = jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='charm'
        user={null} />, true);
    assert.equal(list.callCount, 0);
    component.render(
      <UserProfileEntityList
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(list.callCount, 1);
  });

  it('handles errors when getting charms', function() {
    charmstore.list = sinon.stub().callsArgWith(1, 'error', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={addNotification}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='charm'
        user='who' />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot retrieve charms',
      message: 'Cannot retrieve charms: error',
      level: 'error'
    });
  });

  it('handles errors when getting bundles', function() {
    charmstore.list = sinon.stub().callsArgWith(1, 'error', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <UserProfileEntityList
        addNotification={addNotification}
        changeState={sinon.stub()}
        charmstore={charmstore}
        entities={[]}
        getDiagramURL={sinon.stub()}
        setEntities={sinon.stub()}
        type='bundle'
        user='who' />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot retrieve bundles',
      message: 'Cannot retrieve bundles: error',
      level: 'error'
    });
  });
});
