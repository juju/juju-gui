/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

describe('InspectorChangeVersionItem', function() {
  let acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-change-version-item', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display the version item', function() {
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/xenial/5');
    const output = jsTestUtils.shallowRender(
      <juju.components.InspectorChangeVersionItem
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
        <juju.components.GenericButton
          disabled={false}
          key="django/xenial/5"
          type="inline-neutral"
          title="Upgrade"
          action={buttonAction} />
      </li>);
  });

  it('can show a downgrade label', function() {
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/trusty/42');
    const output = jsTestUtils.shallowRender(
      <juju.components.InspectorChangeVersionItem
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
        <juju.components.GenericButton
          disabled={false}
          key="django/trusty/42"
          type="inline-neutral"
          title="Downgrade"
          action={buttonAction} />
      </li>);
  });

  it('can disable the button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const buttonAction = sinon.stub();
    const itemAction = sinon.stub();
    const url = window.jujulib.URL.fromString('django/47');
    const output = jsTestUtils.shallowRender(
      <juju.components.InspectorChangeVersionItem
        acl={acl}
        key="django/47"
        downgrade={false}
        itemAction={itemAction}
        buttonAction={buttonAction}
        url={url}
      />);
    const expected = (
      <juju.components.GenericButton
        disabled={true}
        key="django/47"
        type="inline-neutral"
        title="Upgrade"
        action={buttonAction}
      />);
    assert.deepEqual(output.props.children[1], expected);
  });
});
