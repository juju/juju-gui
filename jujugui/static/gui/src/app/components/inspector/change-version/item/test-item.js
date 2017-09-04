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
        key="cs:django-5"
        downgrade={false}
        itemAction={itemAction}
        buttonAction={buttonAction}
        url={url}
      />);
    assert.deepEqual(output,
      <li className="inspector-current-version__item"
        role="button" tabIndex="0"
        onClick={itemAction}>
        <span title="django/xenial/5"
          className="inspector-current-version__title">
          version {5}
        </span>
        <GenericButton
          disabled={false}
          key="django/xenial/5"
          type="inline-neutral"
          action={buttonAction}>
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
        key="django/trusty/42"
        downgrade={true}
        itemAction={itemAction}
        buttonAction={buttonAction}
        url={url}
      />);
    assert.deepEqual(output,
      <li className="inspector-current-version__item"
        role="button" tabIndex="0"
        onClick={itemAction}>
        <span title="django/trusty/42"
          className="inspector-current-version__title">
          version {42}
        </span>
        <GenericButton
          disabled={false}
          key="django/trusty/42"
          type="inline-neutral"
          action={buttonAction}>
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
        key="django/47"
        downgrade={false}
        itemAction={itemAction}
        buttonAction={buttonAction}
        url={url}
      />);
    const expected = (
      <GenericButton
        disabled={true}
        key="django/47"
        type="inline-neutral"
        action={buttonAction}>
        Upgrade
      </GenericButton>);
    assert.deepEqual(output.props.children[1], expected);
  });
});
