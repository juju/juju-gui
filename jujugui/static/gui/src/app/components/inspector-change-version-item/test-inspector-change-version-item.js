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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-change-version-item', function() { done(); });
  });

  it('can display the version item with a short name', function() {
    var buttonAction = sinon.stub();
    var itemAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersionItem
          key="cs:django-5"
          downgrade={false}
          itemAction={itemAction}
          buttonAction={buttonAction}
          id="cs:django-5" />);
    assert.deepEqual(output,
        <li className="inspector-current-version__item"
          role="button" tabIndex="0"
          onClick={itemAction}>
          <span title="cs:django-5"
            className="inspector-current-version__title">
            django-5
          </span>
          <juju.components.GenericButton
            key="cs:django-5"
            type="inline-neutral"
            title="Upgrade"
            action={buttonAction} />
        </li>);
  });

  it('can shorten a long name', function() {
    var buttonAction = sinon.stub();
    var itemAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersionItem
          key="cs:django-django-pango-pongo-5"
          downgrade={false}
          itemAction={itemAction}
          buttonAction={buttonAction}
          id="cs:django-django-pango-pongo-5" />);
    assert.deepEqual(output,
        <li className="inspector-current-version__item"
          role="button" tabIndex="0"
          onClick={itemAction}>
          <span title="cs:django-django-pango-pongo-5"
            className="inspector-current-version__title">
            djan...o-pongo-5
          </span>
          <juju.components.GenericButton
            key="cs:django-django-pango-pongo-5"
            type="inline-neutral"
            title="Upgrade"
            action={buttonAction} />
        </li>);
  });

  it('can show a downgrade label', function() {
    var buttonAction = sinon.stub();
    var itemAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersionItem
          key="cs:django-5"
          downgrade={true}
          itemAction={itemAction}
          buttonAction={buttonAction}
          id="cs:django-5" />);
    assert.deepEqual(output,
        <li className="inspector-current-version__item"
          role="button" tabIndex="0"
          onClick={itemAction}>
          <span title="cs:django-5"
            className="inspector-current-version__title">
            django-5
          </span>
          <juju.components.GenericButton
            key="cs:django-5"
            type="inline-neutral"
            title="Downgrade"
            action={buttonAction} />
        </li>);
  });
});
