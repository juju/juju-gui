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

describe('CardForm', function() {
  let acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('card-form', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="card-form">
        <juju.components.GenericInput
          disabled={false}
          label="Name on card"
          ref="name"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]} />
        <div className="card-form__card"
          ref="cardNode"></div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('mounts the card elements', function() {
    const mount = sinon.stub();
    const createCardElement = sinon.stub().callsArgWith(0, {
      mount: mount
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        createCardElement={createCardElement}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {cardNode: {}};
    instance.componentDidMount();
    assert.equal(mount.callCount, 1);
  });

  it('can validate the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.isFalse(instance.validate());
  });

  it('can return the field values', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      name: {
        getValue: sinon.stub().returns('Mr Geoffrey Spinach')
      }
    };
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      card: instance.card,
      name: 'Mr Geoffrey Spinach',
    });
  });
});
