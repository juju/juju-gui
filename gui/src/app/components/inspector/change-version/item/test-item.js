/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const {urls} = require('jaaslib');

const InspectorChangeVersionItem = require('./item');
const Button = require('../../../shared/button/button');

describe('InspectorChangeVersionItem', function() {
  let acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorChangeVersionItem
      acl={options.acl || acl}
      buttonAction={options.buttonAction || sinon.stub()}
      downgrade={options.downgrade === undefined ? false : options.downgrade}
      itemAction={options.itemAction || sinon.stub()}
      url={options.url || urls.URL.fromString('django/xenial/5')} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display the version item', function() {
    const wrapper = renderComponent();
    const expected = (
      <li
        className="inspector-current-version__item"
        onClick={wrapper.prop('onClick')}
        role="button"
        tabIndex="0">
        <span
          className="inspector-current-version__title"
          title="django/xenial/5">
          version {5}
        </span>
        <Button
          action={wrapper.find('Button').prop('action')}
          disabled={false}
          key="django/xenial/5"
          type="inline-neutral">
          Upgrade
        </Button>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show a downgrade label', function() {
    const wrapper = renderComponent({downgrade: true});
    assert.equal(wrapper.find('Button').children().text(), 'Downgrade');
  });

  it('can disable the button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Button').prop('disabled'), true);
  });
});
