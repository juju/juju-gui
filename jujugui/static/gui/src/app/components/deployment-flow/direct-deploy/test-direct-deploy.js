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

  it('renders the Direct deploy for a charm', () => {
    const id = 'cs:apache-21';
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: id}}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div className="six-col last-col deployment-direct-deploy__image">
          {null}
          <div className="deployment-direct-deploy__edit-model">
            <juju.components.GenericButton
              action={instance._handleClose}
              type="inline-neutral">
              Edit model
            </juju.components.GenericButton>
          </div>
        </div>
      </juju.components.DeploymentSection>);
    expect(output).toEqualJSX(expected);

    const finalRenderer = jsTestUtils.shallowRender(expected, true);
    const finalOutput = finalRenderer.getRenderOutput();
    const finalExpected = (
      <div className="deployment-section
        twelve-col
        deployment-section--active
        deployment-direct-deploy">
        <h3 className="deployment-section__title" />
        <div className="six-col last-col deployment-direct-deploy__image">
          {null}
          <div className="deployment-direct-deploy__edit-model">
            <juju.components.GenericButton
              action={instance._handleClose}
              type="inline-neutral">
              Edit model
            </juju.components.GenericButton>
          </div>
        </div>
      </div>);
    expect(finalOutput).toEqualJSX(finalExpected);
  });

  it('renders the Direct Deploy for a bundle', () => {
    const id = 'cs:bundles/kubernetes-core-8';
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        changeState={sinon.stub()}
        ddData={{id: id}}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-direct-deploy">
        <div className="six-col last-col deployment-direct-deploy__image">
          <juju.components.EntityContentDiagram
            getDiagramURL={instance.props.getDiagramURL}
            id={id} />
          <div className="deployment-direct-deploy__edit-model">
            <juju.components.GenericButton
              action={instance._handleClose}
              type="inline-neutral">
              Edit model
            </juju.components.GenericButton>
          </div>
        </div>
      </juju.components.DeploymentSection>
    );
    expect(output).toEqualJSX(expected);

    const finalRenderer = jsTestUtils.shallowRender(expected, true);
    const finalOutput = finalRenderer.getRenderOutput();
    const finalExpected = (
      <div className="deployment-section
        twelve-col
        deployment-section--active
        deployment-direct-deploy">
        <h3 className="deployment-section__title" />
        <div className="six-col last-col deployment-direct-deploy__image">
          <juju.components.EntityContentDiagram
            getDiagramURL={instance.props.getDiagramURL}
            id={id} />
          <div className="deployment-direct-deploy__edit-model">
            <juju.components.GenericButton
              action={instance._handleClose}
              type="inline-neutral">
              Edit model
            </juju.components.GenericButton>
          </div>
        </div>
      </div>
    );
    expect(finalOutput).toEqualJSX(finalExpected);
  });
});
