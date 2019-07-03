/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');

const Analytics = require('test/fake-analytics');
const DeploymentAgreements = require('./agreements');
const {Button} = require('@canonical/juju-react-components');

describe('DeploymentAgreements', function() {
  let acl, terms;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentAgreements
      acl={options.acl || acl}
      analytics={Analytics}
      disabled={options.disabled === undefined ? false : options.disabled}
      onCheckboxChange={options.onCheckboxChange || sinon.stub()}
      showTerms={options.showTerms === undefined ? false : options.showTerms}
      terms={options.terms === undefined ? terms : options.terms} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    terms = [];
  });

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can display as disabled', function() {
    const wrapper = renderComponent({disabled: true});
    assert.strictEqual(wrapper.find('input').prop('disabled'), true);
  });

  it('can display as disabled when read only', function() {
    acl.isReadOnly.returns(true);
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('input').prop('disabled'), true);
  });

  it('can show the terms link', function() {
    terms = [{}, {}];
    const wrapper = renderComponent({showTerms: true});
    const expected = (
      <Button
        action={wrapper.find('Button').prop('action')}
        extraClasses="is-inline"
        modifier="base">
        View terms
      </Button>);
    assert.compareJSX(wrapper.find('Button'), expected);
  });

  it('can show the terms popup', function() {
    terms = [{}, {}];
    const wrapper = renderComponent({showTerms: true});
    wrapper.find('Button').props().action();
    wrapper.update();
    assert.equal(wrapper.find('TermsPopup').length, 1);
  });
});
