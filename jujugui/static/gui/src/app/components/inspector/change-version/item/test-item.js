/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorChangeVersionItem = require('./item');
const GenericButton = require('../../../generic-button/generic-button');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('InspectorChangeVersionItem', function() {
  let acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display the version item', function() {
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/xenial/5');
    const output = jsTestUtils.shallowRender(
      <InspectorChangeVersionItem
        acl={acl}
        buttonAction={buttonAction}
        downgrade={false}
        itemAction={itemAction}
        key="cs:django-5"
        url={url} />);
    assert.deepEqual(output,
      <li className="inspector-current-version__item"
        onClick={itemAction} role="button"
        tabIndex="0">
        <span className="inspector-current-version__title"
          title="django/xenial/5">
          version {5}
        </span>
        <GenericButton
          action={buttonAction}
          disabled={false}
          key="django/xenial/5"
          type="inline-neutral">
          Upgrade
        </GenericButton>
      </li>);
  });

  it('can show a downgrade label', function() {
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/trusty/42');
    const output = jsTestUtils.shallowRender(
      <InspectorChangeVersionItem
        acl={acl}
        buttonAction={buttonAction}
        downgrade={true}
        itemAction={itemAction}
        key="django/trusty/42"
        url={url} />);
    assert.deepEqual(output,
      <li className="inspector-current-version__item"
        onClick={itemAction} role="button"
        tabIndex="0">
        <span className="inspector-current-version__title"
          title="django/trusty/42">
          version {42}
        </span>
        <GenericButton
          action={buttonAction}
          disabled={false}
          key="django/trusty/42"
          type="inline-neutral">
          Downgrade
        </GenericButton>
      </li>);
  });

  it('can disable the button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/47');
    const output = jsTestUtils.shallowRender(
      <InspectorChangeVersionItem
        acl={acl}
        buttonAction={buttonAction}
        downgrade={false}
        itemAction={itemAction}
        key="django/47"
        url={url} />);
    const expected = (
      <GenericButton
        action={buttonAction}
        disabled={true}
        key="django/47"
        type="inline-neutral">
        Upgrade
      </GenericButton>);
    assert.deepEqual(output.props.children[1], expected);
  });
});
