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
    YUI().use(['deployment-direct-deploy','entity-content-description'],
      function() { done(); });
  });

  it('renders the Direct Deploy for a charm with description', () => {
    const entityModel = jsTestUtils.makeEntity();
    entityModel.set('description', 'Hello');
    const id = entityModel.get('id');
    const renderMarkdown = sinon.stub().returns('Hello');
    const getEntity = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        ddData={{id: id}}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        makeEntityModel={entityModel}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({entityModel: entityModel});
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-one-click"
        showCheck={false}
        title="Direct Deploy">
        <p>
          The following steps will guide you through deploying {id}
        </p>
        <juju.components.EntityContentDescription
          entityModel={entityModel}
          renderMarkdown={renderMarkdown}
          />
      </juju.components.DeploymentSection>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct Deploy for a charm without description', () => {
    const entityModel = jsTestUtils.makeEntity();
    const id = entityModel.get('id');
    const renderMarkdown = sinon.stub();
    const getEntity = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        ddData={{id: id}}
        getDiagramURL={sinon.stub()}
        getEntity={getEntity}
        makeEntityModel={entityModel}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({entityModel: entityModel});
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-one-click"
        showCheck={false}
        title="Direct Deploy">
        <p>
          The following steps will guide you through deploying {id}
        </p>
        <juju.components.EntityContentDescription
          entityModel={entityModel}
          renderMarkdown={renderMarkdown}
          />
      </juju.components.DeploymentSection>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct Deploy for a bundle', () => {
    const id = 'cs:bundles/kubernetes-core-8';
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentDirectDeploy
        ddData={{id: id}}
        getDiagramURL={sinon.stub()}
        getEntity={sinon.stub()}
        makeEntityModel={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.DeploymentSection
        instance="deployment-one-click"
        showCheck={false}
        title="Direct Deploy">
        <p>
          The following steps will guide you through deploying {id}
        </p>
        <juju.components.EntityContentDiagram
          getDiagramURL={instance.props.getDiagramURL}
          id={id} />
      </juju.components.DeploymentSection>
    );
    expect(output).toEqualJSX(expected);
  });
});
