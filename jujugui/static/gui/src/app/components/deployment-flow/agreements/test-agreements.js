/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentAgreements = require('./agreements');

describe('DeploymentAgreements', function() {
  let acl, terms;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentAgreements
      acl={options.acl || acl}
      disabled={options.disabled === undefined ? false : options.disabled}
      onCheckboxChange={options.onCheckboxChange || sinon.stub()}
      showTerms={options.showTerms === undefined ? false : options.showTerms}
      terms={options.terms === undefined ? terms : options.terms} />
  );

  beforeEach(() => {
    acl = { isReadOnly: sinon.stub().returns(false) };
    terms = [];
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-flow-agreements deployment-flow__deploy-option">
        <input className="deployment-flow__deploy-checkbox"
          disabled={false}
          id="terms"
          onChange={sinon.stub()}
          type="checkbox" />
        <label className="deployment-flow__deploy-label"
          htmlFor="terms">
          I agree to all terms.
        </label>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display as disabled', function() {
    const wrapper = renderComponent({ disabled: true });
    assert.strictEqual(wrapper.find('input').prop('disabled'), true);
  });

  it('can display as disabled when read only', function() {
    acl.isReadOnly.returns(true);
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('input').prop('disabled'), true);
  });
});
