/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const LocalInspector = require('./local-inspector');
const ButtonRow = require('../button-row/button-row');
const InspectorHeader = require('../inspector/header/header');

const jsTestUtils = require('../../utils/component-test-utils');

describe('LocalInspector', function() {
  var acl, series;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    series = {
      vivid: {name: 'Vivid Vervet 15.04'},
      wily: {name: 'Wily Werewolf 15.10'}
    };
  });

  it('can display the new service view', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var services = {};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="new"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: instance._close,
      type: 'base'
    }, {
      title: 'Upload',
      action: instance._handleUpload,
      disabled: false,
      type: 'neutral'
    }];
    var options = output.props.children[1].props.children[1].props.children;
    var expected = (
      <div className="inspector-view local-inspector">
        <InspectorHeader
          backCallback={instance._close}
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
                  onChange={
                    options[0].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input defaultChecked={false} disabled={false}
                  name="action"
                  onChange={
                    options[1].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Upgrade local
              </label>
            </li>
          </ul>
          <div>
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
    expect(output).toEqualJSX(expected);
  });

  it('can display the update service view', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var serviceStubs = [
      {get: sinon.stub()},
      {get: sinon.stub()}
    ];
    serviceStubs[0].get.withArgs('id').returns('apache2-2');
    serviceStubs[0].get.withArgs('name').returns('apache2');
    serviceStubs[1].get.withArgs('id').returns('mysql-1');
    serviceStubs[1].get.withArgs('name').returns('mysql');
    var services = {toArray: sinon.stub().returns(serviceStubs)};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="update"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: instance._close,
      type: 'base'
    }, {
      title: 'Upload',
      action: instance._handleUpdate,
      disabled: false,
      type: 'neutral'
    }];
    var options = output.props.children[1].props.children[1].props.children;
    var expected = (
      <div className="inspector-view local-inspector">
        <InspectorHeader
          backCallback={instance._close}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <div className="local-inspector__file">
            <p>File: {'apache2.zip'}</p>
            <p>Size: {'2.00'}kb</p>
          </div>
          <ul className="local-inspector__list">
            <li>
              <label>
                <input defaultChecked={false} disabled={false}
                  name="action"
                  onChange={
                    options[0].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input defaultChecked={true} disabled={false}
                  name="action"
                  onChange={
                    options[1].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Upgrade local
              </label>
            </li>
          </ul>
          <div>
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
          </div>
        </div>
        <ButtonRow
          buttons={buttons} />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can switch between views', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var serviceStubs = [
      {get: sinon.stub()},
      {get: sinon.stub()}
    ];
    serviceStubs[0].get.withArgs('id').returns('apache2-2');
    serviceStubs[0].get.withArgs('name').returns('apache2');
    serviceStubs[1].get.withArgs('id').returns('mysql-1');
    serviceStubs[1].get.withArgs('name').returns('mysql');
    var services = {toArray: sinon.stub().returns(serviceStubs)};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="new"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var output = shallowRenderer.getRenderOutput();
    var options = output.props.children[1].props.children[1].props.children;
    options[1].props.children.props.children[0].props.onChange();
    output = shallowRenderer.getRenderOutput();
    var expected = (
      <div className="inspector-view local-inspector">
        {output.props.children[0]}
        <div className="inspector-content local-inspector__section">
          {output.props.children[1].props.children[0]}
          {output.props.children[1].props.children[1]}
          <div>
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
          </div>
        </div>
        {output.props.children[2]}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle deploying a new charm', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var services = {toArray: sinon.stub().returns([])};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="new"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    instance.refs = {series: {value: 'wily'}};
    output.props.children[2].props.buttons[1].action();
    assert.equal(uploadLocalCharm.callCount, 1);
    assert.equal(uploadLocalCharm.args[0][0], 'wily');
    assert.equal(uploadLocalCharm.args[0][1], file);
  });

  it('can handle updating charms', function() {
    const file = {
      name: 'apache2.zip',
      size: '2048'
    };
    const getById = sinon.stub();
    getById.withArgs('mysql').returns({id: 'mysql'});
    getById.withArgs('apache2').returns({id: 'apache2'});
    getById.withArgs('gui-test').returns({id: 'gui-test'});
    const services = {
      toArray: sinon.stub().returns([]),
      getById: getById
    };
    const uploadLocalCharm = sinon.spy();
    const upgradeServiceUsingLocalCharm = sinon.spy();
    const changeState = sinon.spy();
    const shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="update"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    const instance = shallowRenderer.getMountedInstance();
    const output = shallowRenderer.getRenderOutput();
    instance.refs = {
      'service-mysql': {checked: true},
      'service-django': {checked: false},
      'service-apache2': {checked: true},
      'service-gui-test': {checked: true}
    };
    output.props.children[2].props.buttons[1].action();
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
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var services = {
      toArray: sinon.stub().returns([])};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="new"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[2].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: null
      }});
  });

  it('disables the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var services = {};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <LocalInspector
        acl={acl}
        changeState={changeState}
        file={file}
        localType="new"
        series={series}
        services={services}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        uploadLocalCharm={uploadLocalCharm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: instance._close,
      type: 'base'
    }, {
      title: 'Upload',
      action: instance._handleUpload,
      disabled: true,
      type: 'neutral'
    }];
    var options = output.props.children[1].props.children[1].props.children;
    var expected = (
      <div className="inspector-view local-inspector">
        <InspectorHeader
          backCallback={instance._close}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <div className="local-inspector__file">
            <p>File: {'apache2.zip'}</p>
            <p>Size: {'2.00'}kb</p>
          </div>
          <ul className="local-inspector__list">
            <li>
              <label>
                <input defaultChecked={true} disabled={true}
                  name="action"
                  onChange={
                    options[0].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Deploy local
              </label>
            </li>
            <li>
              <label>
                <input defaultChecked={false} disabled={true}
                  name="action"
                  onChange={
                    options[1].props.children.props.children[0]
                      .props.onChange}
                  type="radio" />
                Upgrade local
              </label>
            </li>
          </ul>
          <div>
            <p>Choose a series to deploy this charm</p>
            <select className="local-inspector__series" defaultValue="trusty"
              disabled={true}
              ref="series">
              <option key="vivid" value="vivid">Vivid Vervet 15.04</option>
              <option key="wily" value="wily">Wily Werewolf 15.10</option>
            </select>
          </div>
        </div>
        <ButtonRow
          buttons={buttons} />
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
