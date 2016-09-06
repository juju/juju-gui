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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentCredential', function() {
  var acl, clouds, credentials, regions, tags, users;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-credential', function() { done(); });
  });

  beforeEach(function() {
    credentials = {
      'cloudcred-lxd_admin@local_default': {
        name: 'cloudcred-lxd_admin@local_default'
      }
    };
    regions = ['test-region'];
    tags = [{tags: ['cloudcred-lxd_admin@local_default']}];
    users = {jem: {user: 'admin'}};
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    clouds = {
      google: {
        id: 'google',
        showLogo: true,
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        showLogo: true,
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      aws: {
        id: 'aws',
        showLogo: true,
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      local: {
        id: 'local',
        showLogo: false,
        title: 'Local'
      }
    };
  });

  it('can display a loader when loading regions and credentials', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={sinon.stub()}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub()}
        getTagsForCloudCredentials={sinon.stub()}
        listRegions={sinon.stub()}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={users}
        validateForm={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <div className="deployment-credential__loading">
          <juju.components.Spinner />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with a cloud', function() {
    var addTemplate = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var setTemplate = sinon.stub();
    var validateForm = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={addTemplate}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, [])}
        getTagsForCloudCredentials={
          sinon.stub().callsArgWith(1, null, tags)}
        listRegions={sinon.stub().callsArgWith(1, null, [])}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={setTemplate}
        users={users}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <juju.components.DeploymentCredentialAdd
            acl={acl}
            addTemplate={addTemplate}
            close={instance._toggleAdd}
            cloud="azure"
            clouds={clouds}
            regions={[]}
            setCredential={setCredential}
            setRegion={setRegion}
            setTemplate={setTemplate}
            users={users}
            validateForm={validateForm}/>
        </juju.components.ExpandingRow>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render without a cloud', function() {
    var addTemplate = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var setTemplate = sinon.stub();
    var validateForm = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={addTemplate}
        cloud={null}
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, {})}
        getTagsForCloudCredentials={
          sinon.stub().callsArgWith(1, null, [])}
        listRegions={sinon.stub().callsArgWith(1, null, [])}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={setTemplate}
        users={users}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <juju.components.DeploymentCredentialAdd
            acl={acl}
            addTemplate={addTemplate}
            close={instance._toggleAdd}
            cloud={null}
            clouds={clouds}
            regions={[]}
            setCredential={setCredential}
            setRegion={setRegion}
            setTemplate={setTemplate}
            users={users}
            validateForm={validateForm} />
        </juju.components.ExpandingRow>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can show existing credentials', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={sinon.stub()}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getTagsForCloudCredentials={
          sinon.stub().callsArgWith(1, null, tags)}
        listRegions={sinon.stub().callsArgWith(1, null, regions)}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={sinon.stub()}
        users={users}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <form className="deployment-credential__form">
            <div className="prepend-two four-col">
              <juju.components.InsetSelect
                disabled={false}
                label="Credential"
                onChange={instance._handleCredentialChange}
                options={[{
                  label: 'cloudcred-lxd_admin@local_default',
                  value: 'cloudcred-lxd_admin@local_default'
                }, {
                  label: 'Add credential...',
                  value: 'add-credential'
                }]} />
            </div>
            <div className="four-col">
              <juju.components.InsetSelect
                disabled={false}
                label="Region"
                onChange={setRegion}
                options={[{
                  label: 'test-region',
                  value: 'test-region'
                }]} />
            </div>
          </form>
          {undefined}
        </juju.components.ExpandingRow>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('selects an initial credential', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={sinon.stub()}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getTagsForCloudCredentials={
          sinon.stub().callsArgWith(1, null, tags)}
        listRegions={sinon.stub().callsArgWith(1, null, regions)}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={sinon.stub()}
        users={users}
        validateForm={sinon.stub()} />, true);
    assert.equal(setCredential.callCount, 1);
    assert.equal(setCredential.args[0][0], 'cloudcred-lxd_admin@local_default');
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={sinon.stub()}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getTagsForCloudCredentials={sinon.stub().callsArgWith(1, null, tags)}
        listRegions={sinon.stub().callsArgWith(1, null, regions)}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={sinon.stub()}
        users={users}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <form className="deployment-credential__form">
            <div className="prepend-two four-col">
              <juju.components.InsetSelect
                disabled={true}
                label="Credential"
                onChange={instance._handleCredentialChange}
                options={[{
                  label: 'cloudcred-lxd_admin@local_default',
                  value: 'cloudcred-lxd_admin@local_default'
                }, {
                  label: 'Add credential...',
                  value: 'add-credential'
                }]} />
            </div>
            <div className="four-col">
              <juju.components.InsetSelect
                disabled={true}
                label="Region"
                onChange={setRegion}
                options={[{
                  label: 'test-region',
                  value: 'test-region'
                }]} />
            </div>
          </form>
          {undefined}
        </juju.components.ExpandingRow>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    var listRegions = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={sinon.stub()}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub()}
        getTagsForCloudCredentials={sinon.stub()}
        listRegions={listRegions}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={users}
        validateForm={sinon.stub()} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can navigate to the add credentials form', function() {
    var addTemplate = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var setTemplate = sinon.stub();
    var validateForm = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        addTemplate={addTemplate}
        cloud="azure"
        clouds={clouds}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getTagsForCloudCredentials={
          sinon.stub().callsArgWith(1, null, tags)}
        listRegions={sinon.stub().callsArgWith(1, null, regions)}
        setCredential={setCredential}
        setRegion={setRegion}
        setTemplate={setTemplate}
        users={users}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleCredentialChange('add-credential');
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <juju.components.ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <juju.components.DeploymentCredentialAdd
            acl={acl}
            addTemplate={addTemplate}
            close={instance._toggleAdd}
            cloud="azure"
            clouds={clouds}
            regions={regions}
            setCredential={setCredential}
            setRegion={setRegion}
            setTemplate={setTemplate}
            users={users}
            validateForm={validateForm}/>
        </juju.components.ExpandingRow>
      </div>);
    assert.deepEqual(output, expected);
  });
});
