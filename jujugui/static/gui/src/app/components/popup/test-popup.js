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

describe('Popup', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('popup', () => { done(); });
  });

  it('can render', () => {
    const buttons = ['one', 'two'];
    const close = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.Popup
        buttons={buttons}
        close={close}
        title="A title">
        <span>Content</span>
      </juju.components.Popup>);
    const expected = (
      <juju.components.Panel
        instanceName="popup"
        visible={true}>
        <div className="popup__panel popup__panel--narrow">
          <div className="popup__close">
            <juju.components.GenericButton
               action={close}
               type="base"
               icon="close_16" />
          </div>
          <h3 className="popup__title">
            A title
          </h3>
          <span>Content</span>
          <juju.components.ButtonRow
            buttons={buttons} />
        </div>
      </juju.components.Panel>
    );
    assert.deepEqual(output, expected);
  });

  it('can set a type class', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.Popup
        type="wide">
        <span>Content</span>
      </juju.components.Popup>);
    const expected = (
      <juju.components.Panel
        instanceName="popup"
        visible={true}>
        <div className="popup__panel popup__panel--wide">
          {undefined}
          {undefined}
          <span>Content</span>
          {undefined}
        </div>
      </juju.components.Panel>
    );
    assert.deepEqual(output, expected);
  });
});
