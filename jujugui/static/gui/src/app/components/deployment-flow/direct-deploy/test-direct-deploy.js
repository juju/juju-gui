/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('DirectDeploy', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-direct-deploy', function() { done(); });
  });

  it('can display the loading spinner', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <juju.components.Spinner />
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('can show a message for an invalid bundle', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub().callsArgWith(1, null, null)}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          This {'bundle'} could not be found.
          Visit the&nbsp;
          <span className="link"
            onClick={output.props.children.props.children[3].props.onClick}
            role="button"
            tabIndex="0">
            store
          </span>&nbsp;
          to find more charms and bundles.
        </div>
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('can show a message for an invalid charm', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: 'cs:apache-21'}}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub().callsArgWith(1, null, null)}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          This {'charm'} could not be found.
          Visit the&nbsp;
          <span className="link"
            onClick={output.props.children.props.children[3].props.onClick}
            role="button"
            tabIndex="0">
            store
          </span>&nbsp;
          to find more charms and bundles.
        </div>
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct deploy for a charm', () => {
    const charm = {
      toEntity: sinon.stub().returns({
        displayName: 'Apache 2',
        iconPath: 'http://example.com/icon.svg'
      })
    };
    const renderMarkdown = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: 'cs:apache-21'}}
        generatePath={sinon.stub().returns('http://example.com/')}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub().callsArgWith(1, null, [charm])}
        makeEntityModel={sinon.stub().returns(charm)}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              Apache 2
            </h2>
            <juju.components.EntityContentDescription
              entityModel={charm}
              renderMarkdown={renderMarkdown} />
            <ul>
              <li>
                It will run on {1}&nbsp;
                machine{''} in your cloud.
              </li>
            </ul>
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Learn more about this {'charm'}.
            </a>
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              <div className="deployment-direct-deploy__image-block">
                <img alt="Apache 2"
                  className="deployment-direct-deploy__image-block-icon"
                  src="http://example.com/icon.svg"
                  width="96" />
              </div>
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <juju.components.GenericButton
                action={instance._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </juju.components.GenericButton>
            </div>
          </div>
        </div>
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct Deploy for a bundle', () => {
    const bundle = {
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes core',
        machineCount: 4
      })
    };
    const renderMarkdown = sinon.stub();
    const getDiagramURL = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        generatePath={sinon.stub().returns('http://example.com/')}
        getDiagramURL={getDiagramURL}
        getEntity={sinon.stub().callsArgWith(1, null, [bundle])}
        makeEntityModel={sinon.stub().returns(bundle)}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              Kubernetes core
            </h2>
            <juju.components.EntityContentDescription
              entityModel={bundle}
              renderMarkdown={renderMarkdown} />
            <ul>
              <li>
                It will run on {4}&nbsp;
                machine{'s'} in your cloud.
              </li>
            </ul>
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Learn more about this {'bundle'}.
            </a>
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              <juju.components.EntityContentDiagram
                getDiagramURL={getDiagramURL}
                id="cs:bundle/kubernetes-core-8" />
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <juju.components.GenericButton
                action={instance._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </juju.components.GenericButton>
            </div>
          </div>
        </div>
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });
});
