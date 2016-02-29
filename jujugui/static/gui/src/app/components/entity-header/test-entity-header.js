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
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EntityHeader', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-header', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders an entity properly', function() {
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityHeader
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity}
          scrollPosition={0} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="row-hero"
        ref="headerWrapper"
        style={{}}>
        <header className="entity-header">
          <div className="inner-wrapper">
            <div className="eight-col no-margin-bottom">
              <img src="data:image/gif;base64," alt="django"
                   width="96" className="entity-header__icon"/>
              <h1
                className="entity-header__title"
                itemProp="name"
                ref="entityHeaderTitle">
                django
              </h1>
              <ul className="bullets inline entity-header__properties">
                <li className="entity-header__by">
                  By{' '}
                  <a href="https://launchpad.net/~test-owner"
                    target="_blank">test-owner</a>
                </li>
                <li className="entity-header__series">
                  trusty
                </li>
              </ul>
              <ul className="entity-header__social-list">
                <li>
                  <a id="item-twitter"
                    target="_blank"
                    href={'https://twitter.com/intent/tweet?text=django%20' +
                      'charm&via=ubuntu_cloud&url=https%3A%2F%2Fjujucharms' +
                      '.com%2Fdjango%2Ftrusty%2F'}>
                    <juju.components.SvgIcon
                      name="icon-social-twitter"
                      size="35"/>
                  </a>
                </li>
                <li>
                  <a id="item-googleplus"
                    target="_blank"
                    href={'https://plus.google.com/share?url=https%3A%2F%2F' +
                      'jujucharms.com%2Fdjango%2Ftrusty%2F'}>
                    <juju.components.SvgIcon
                      name="icon-social-google"
                      size="35"/>
                  </a>
                </li>
              </ul>
            </div>
            <div className="four-col last-col no-margin-bottom">
              <juju.components.CopyToClipboard
                value="juju deploy cs:django" />
              <juju.components.GenericButton
                ref="deployAction"
                action={instance._handleDeployClick}
                type="confirm"
                title="Add to canvas" />
            </div>
          </div>
        </header>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('displays an add to canvas button', function() {
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    assert.equal(deployAction.props.type, 'confirm');
    assert.equal(deployAction.props.title, 'Add to canvas');
  });

  it('displays an unsupported message for multi-series charms', function() {
    mockEntity.set('series', undefined);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()}
        scrollPosition={0} />);
    var textContent = output.refs.deployAction.innerText;
    assert.equal(textContent, 'This type of charm can only be deployed from ' +
      'the command line.');
  });

  it('adds a charm when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity}
        scrollPosition={0}/>);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
  });

  it('adds a bundle when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    var importBundleYAML = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.deepEqual(importBundleYAML.args[0][0], 'mock yaml');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        addNotification={addNotification}
        scrollPosition={0} />);
    var deployAction = output.refs.deployAction;
    // Simulate a click.
    deployAction.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(
      addNotification.args[0][0].title, 'Bundle failed to deploy');
  });

  it('can display as sticky', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        addNotification={addNotification}
        scrollPosition={100} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      headerWrapper: {
        clientHeight: 99
      }
    };
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    assert.deepEqual(
      output,
        <div className="row-hero"
          ref="headerWrapper"
          style={{height: '99px'}}>
          <header className="entity-header entity-header--sticky">
            {output.props.children.props.children}
          </header>
        </div>);
  });
});
