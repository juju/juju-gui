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

describe('DeploymentModelName', () => {
  let acl;

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-model-name', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="six-col no-margin-bottom">
        <juju.components.GenericInput
          disabled={false}
          key="modelName"
          label="Model name"
          required={true}
          onBlur={sinon.stub()}
          ref="modelName"
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
            error: 'This field must only contain lowercase ' +
              'letters, numbers, and hyphens. It must not start or ' +
              'end with a hyphen.'
          }]}
          value="mymodel" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="six-col no-margin-bottom">
        <juju.components.GenericInput
          disabled={true}
          key="modelName"
          label="Model name"
          required={true}
          onBlur={sinon.stub()}
          ref="modelName"
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
            error: 'This field must only contain lowercase ' +
              'letters, numbers, and hyphens. It must not start or ' +
              'end with a hyphen.'
          }]}
          value="mymodel" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can derive the model name from the DD entity name', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={{get: sinon.stub().returns('snazzy-bundle')}}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children.props.value, 'snazzy-bundle');
  });

  it('focuses on the model name field when loaded', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {modelName: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(instance.refs.modelName.focus.callCount, 1);
  });

  it('can update the model name on blur', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={setModelName} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.onBlur({
      currentTarget: {
        value: 'snazzy-bundle'
      }
    });
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'snazzy-bundle');
  });

  it('does not update the model name if there is no value', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={setModelName} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.onBlur({
      currentTarget: {
        value: ''
      }
    });
    assert.equal(setModelName.callCount, 0);
  });
});
