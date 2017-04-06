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
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="card-form">
        <juju.components.GenericInput
          disabled={false}
          label="Card number"
          onChange={instance._handleNumberChange}
          ref="number"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            regex: /^[a-zA-Z0-9_-\s]{16,}/,
            error: 'The card number is too short.'
          }, {
            regex: /^[a-zA-Z0-9_-\s]{0,23}$/,
            error: 'The card number is too long.'
          }, {
            regex: /^[0-9\s]+$/,
            error: 'The card number can only contain numbers.'
          }]} />
        <div className="twelve-col no-margin-bottom">
          <div className="six-col no-margin-bottom">
            <juju.components.GenericInput
              disabled={false}
              label="Expiry MM/YY"
              ref="expiry"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /[\d]{2}\/[\d]{2}/,
                error: 'The expiry must be in the format MM/YY'
              }]} />
          </div>
          <div className="six-col last-col no-margin-bottom">
            <juju.components.GenericInput
              disabled={false}
              label="Security number (CVC)"
              ref="cvc"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[0-9]{3}$/,
                error: 'The CVC must be three characters long.'
              }, {
                regex: /^[0-9]+$/,
                error: 'The CVC can only contain numbers.'
              }]} />
          </div>
        </div>
        <div className="twelve-col">
          <juju.components.GenericInput
            disabled={false}
            label="Name on card"
            ref="name"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can valdate the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.isFalse(instance.validate());
  });

  it('can return the field values', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CardForm
        acl={acl}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      expiry: {
        getValue: sinon.stub().returns('03/17')
      },
      number: {
        getValue: sinon.stub().returns('1234 5678 1234 5678')
      },
      cvc: {
        getValue: sinon.stub().returns('123')
      },
      name: {
        getValue: sinon.stub().returns('Mr Geoffrey Spinach')
      }
    };
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      number: '1234567812345678',
      cvc: '123',
      expMonth: '03',
      expYear: '17',
      name: 'Mr Geoffrey Spinach',
    });
  });

  describe('_formatNumber', function() {
    let instance;

    beforeEach(function() {
      const renderer = jsTestUtils.shallowRender(
        <juju.components.CardForm
          acl={acl}
          validateForm={sinon.stub()} />, true);
      instance = renderer.getMountedInstance();
    });

    it('can format the number for American Express', function() {
      assert.equal(
        instance._formatNumber('373412345612345'),
        '3734 123456 12345');
    });

    it('can format the number for Visa', function() {
      assert.equal(
        instance._formatNumber('4534223432344234'),
        '4534 2234 3234 4234');
    });

    it('can format the number for MasterCard', function() {
      assert.equal(
        instance._formatNumber('5334223432344234'),
        '5334 2234 3234 4234');
    });

    it('can format the number for Discover', function() {
      assert.equal(
        instance._formatNumber('6011223432344234'),
        '6011 2234 3234 4234');
      assert.equal(
        instance._formatNumber('6221273432344234'),
        '6221 2734 3234 4234');
      assert.equal(
        instance._formatNumber('6461273432344234'),
        '6461 2734 3234 4234');
      assert.equal(
        instance._formatNumber('6561273432344234'),
        '6561 2734 3234 4234');
    });

    it('can format the number for Diners Club', function() {
      assert.equal(
        instance._formatNumber('3034223432344234'),
        '3034 2234 3234 4234');
      assert.equal(
        instance._formatNumber('3094223432344234'),
        '3094 2234 3234 4234');
      assert.equal(
        instance._formatNumber('3694223432344234'),
        '3694 2234 3234 4234');
      assert.equal(
        instance._formatNumber('3894223432344234'),
        '3894 2234 3234 4234');
    });

    it('can format the number for JCB', function() {
      assert.equal(
        instance._formatNumber('3533223432344234'),
        '3533 2234 3234 4234');
    });
  });
});
