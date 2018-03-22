/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const LocalInspector = require('./local-inspector');
const ButtonRow = require('../button-row/button-row');
const InspectorHeader = require('../inspector/header/header');

describe('LocalInspector', function() {
  var acl, file, series, services;

  const renderComponent = (options = {}) => enzyme.shallow(
    <LocalInspector
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      file={options.file || file}
      localType={options.localType || 'new'}
      series={options.series || series}
      services={options.services || services}
      upgradeServiceUsingLocalCharm={
        options.upgradeServiceUsingLocalCharm || sinon.stub()}
      uploadLocalCharm={options.uploadLocalCharm || sinon.stub()} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    series = {
      vivid: {name: 'Vivid Vervet 15.04'},
      wily: {name: 'Wily Werewolf 15.10'}
    };
    file = {
      name: 'apache2.zip',
      size: '2048'
    };
    const getById = sinon.stub();
    getById.withArgs('mysql').returns({id: 'mysql'});
    getById.withArgs('apache2').returns({id: 'apache2'});
    getById.withArgs('gui-test').returns({id: 'gui-test'});
    var serviceStubs = [
      {get: sinon.stub()},
      {get: sinon.stub()}
    ];
    serviceStubs[0].get.withArgs('id').returns('apache2-2');
    serviceStubs[0].get.withArgs('name').returns('apache2');
    serviceStubs[1].get.withArgs('id').returns('mysql-1');
    serviceStubs[1].get.withArgs('name').returns('mysql');
    services = {
      toArray: sinon.stub().returns(serviceStubs),
      getById: getById
    };
  });

  it('can display the new service view', function() {
    const wrapper = renderComponent();
    const buttonList = wrapper.find('ButtonRow').prop('buttons');
    var buttons = [{
      title: 'Cancel',
      action: buttonList[0].action,
      type: 'base'
    }, {
      title: 'Upload',
      action: buttonList[1].action,
      disabled: false,
      type: 'neutral'
    }];
    var inputs = wrapper.find('input');
    var expected = (
      <div className="inspector-view local-inspector">
        <InspectorHeader
          backCallback={wrapper.find('InspectorHeader').prop('backCallback')}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <div className="local-inspector__file">
            <p>File: {'apache2.zip'}</p>
            <p>Size: {'2.00'}kb</p>
          </div>
          <ul className="local-inspector__list">
            <li>
              <label>
                <input defaultChecked={true} disabled={false}
                  name="action"
                  onChange={inputs.at(0).prop('onChange')}
                  type="radio" />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input defaultChecked={false} disabled={false}
                  name="action"
                  onChange={inputs.at(1).prop('onChange')}
                  type="radio" />
                Upgrade local
              </label>
            </li>
          </ul>
          <div className="local-inspector__content-new">
            <p>Choose a series to deploy this charm</p>
            <select className="local-inspector__series" defaultValue="trusty"
              disabled={false}
              ref="series">
              <option key="vivid" value="vivid">Vivid Vervet 15.04</option>
              <option key="wily" value="wily">Wily Werewolf 15.10</option>
            </select>
          </div>
        </div>
        <ButtonRow
          buttons={buttons} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display the update service view', function() {
    const wrapper = renderComponent({ localType: 'update' });
    var expected = (
      <div className="local-inspector__content-update">
        <p className="local-inspector__label">Choose applications to upgrade:</p>
        <ul className="local-inspector__list">
          <li key="apache2-2">
            <label>
              <input data-id="apache2-2" disabled={false}
                ref="service-apache2-2"
                type="checkbox" />
              apache2
            </label>
          </li>
          <li key="mysql-1">
            <label>
              <input data-id="mysql-1" disabled={false}
                ref="service-mysql-1"
                type="checkbox" />
              mysql
            </label>
          </li>
        </ul>
      </div>);
    assert.compareJSX(wrapper.find('.local-inspector__content-update'), expected);
  });

  it('can switch between views', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.local-inspector__content-new').length, 1);
    assert.equal(wrapper.find('.local-inspector__content-update').length, 0);
    wrapper.find('input').at(1).props().onChange();
    wrapper.update();
    assert.equal(wrapper.find('.local-inspector__content-new').length, 0);
    assert.equal(wrapper.find('.local-inspector__content-update').length, 1);
  });

  it('can handle deploying a new charm', function() {
    var uploadLocalCharm = sinon.spy();
    const wrapper = renderComponent({ uploadLocalCharm });
    const instance = wrapper.instance();
    instance.refs = {series: {value: 'wily'}};
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    assert.equal(uploadLocalCharm.callCount, 1);
    assert.equal(uploadLocalCharm.args[0][0], 'wily');
    assert.equal(uploadLocalCharm.args[0][1], file);
  });

  it('can handle updating charms', function() {
    const upgradeServiceUsingLocalCharm = sinon.spy();
    const changeState = sinon.spy();
    const wrapper = renderComponent({
      changeState,
      localType: 'update',
      upgradeServiceUsingLocalCharm
    });
    const instance = wrapper.instance();
    instance.refs = {
      'service-mysql': {checked: true},
      'service-django': {checked: false},
      'service-apache2': {checked: true},
      'service-gui-test': {checked: true}
    };
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    assert.equal(upgradeServiceUsingLocalCharm.callCount, 1);
    assert.deepEqual(upgradeServiceUsingLocalCharm.args[0][0],
      [{id: 'mysql'}, {id: 'apache2'}, {id: 'gui-test'}]);
    assert.equal(upgradeServiceUsingLocalCharm.args[0][1], file);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: null
      }});
  });

  it('can cancel the upload', function() {
    var changeState = sinon.spy();
    const wrapper = renderComponent({ changeState });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: null
      }});
  });

  it('disables the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[1].disabled, true);
    wrapper.find('input').forEach(input => {
      assert.equal(input.prop('disabled'), true);
    });
    assert.equal(wrapper.find('select').prop('disabled'), true);
  });
});
