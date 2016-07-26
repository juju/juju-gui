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
  var acl, clouds, credentials, regions;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-credential', function() { done(); });
  });

  beforeEach(function() {
    credentials = [{path: 'owner/test-cred'}];
    regions = ['test-region'];
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
        cloud="azure"
        clouds={clouds}
        listRegions={sinon.stub()}
        listTemplates={sinon.stub()}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-credential"
        showCheck={false}>
        <div className="deployment-credential__loading">
          <juju.components.Spinner />
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can render with a cloud', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        cloud="azure"
        clouds={clouds}
        listRegions={
          sinon.stub().callsArgWith(1, null, [])}
        listTemplates={
          sinon.stub().callsArgWith(0, null, [])}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-credential"
        showCheck={false}>
        <div>
          {undefined}
          <juju.components.DeploymentCredentialAdd
            acl={acl}
            close={instance._toggleAdd}
            cloud="azure"
            clouds={clouds} />
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can render without a cloud', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        cloud={null}
        clouds={clouds}
        listRegions={
          sinon.stub().callsArgWith(1, null, [])}
        listTemplates={
          sinon.stub().callsArgWith(0, null, [])}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={true}
        instance="deployment-credential"
        showCheck={false}>
        <div>
          {undefined}
          <juju.components.DeploymentCredentialAdd
            acl={acl}
            close={instance._toggleAdd}
            cloud={null}
            clouds={clouds} />
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can show existing credentials', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        cloud="azure"
        clouds={clouds}
        listRegions={
          sinon.stub().callsArgWith(1, null, regions)}
        listTemplates={
          sinon.stub().callsArgWith(0, null, credentials)}
        setCredential={setCredential}
        setRegion={setRegion} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-credential"
        showCheck={false}>
        <div>
          <form className="deployment-credential__form">
            <div className="prepend-one four-col">
              <juju.components.InsetSelect
                disabled={false}
                label="Credential"
                onChange={setCredential}
                options={[{
                  label: 'owner/test-cred',
                  value: 'owner/test-cred'
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
            <div className="three-col last-col">
              <juju.components.GenericButton
                action={instance._toggleAdd}
                title="Add credential"
                type="inline-neutral" />
            </div>
          </form>
          {undefined}
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        cloud="azure"
        clouds={clouds}
        listRegions={
          sinon.stub().callsArgWith(1, null, regions)}
        listTemplates={
          sinon.stub().callsArgWith(0, null, credentials)}
        setCredential={setCredential}
        setRegion={setRegion} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-credential"
        showCheck={false}>
        <div>
          <form className="deployment-credential__form">
            <div className="prepend-one four-col">
              <juju.components.InsetSelect
                disabled={true}
                label="Credential"
                onChange={setCredential}
                options={[{
                  label: 'owner/test-cred',
                  value: 'owner/test-cred'
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
            <div className="three-col last-col">
              <juju.components.GenericButton
                action={instance._toggleAdd}
                title="Add credential"
                type="inline-neutral" />
            </div>
          </form>
          {undefined}
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    var listTemplates = sinon.stub().returns({abort: abort});
    var listRegions = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredential
        acl={acl}
        cloud="azure"
        clouds={clouds}
        listRegions={listRegions}
        listTemplates={listTemplates}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 2);
  });
});
