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

describe('TermsPopup', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('terms-popup', function() { done(); });
  });

  it('can render', function() {
    const close = sinon.stub();
    const terms = [
      {content: 'Landscape terms.', name: 'landscape'},
      {content: 'Apache2 terms.', name: 'apache2'}
    ];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.TermsPopup
        close={close}
        terms={terms} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Popup
        close={close}
        type="wide">
        <div className="terms-popup__container">
          <ul className="terms-popup__terms">
            <li key="landscape">
              <pre>
                Landscape terms.
              </pre>
            </li>
            <li key="apache2">
              <pre>
                Apache2 terms.
              </pre>
            </li>
          </ul>
        </div>
      </juju.components.Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.TermsPopup
        close={sinon.stub()}
        terms={[]} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Popup
        close={close}
        type="wide">
        <juju.components.Spinner />
      </juju.components.Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can close the popup', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.TermsPopup
        close={close}
        terms={[]} />, true);
    const output = renderer.getRenderOutput();
    output.props.close();
    assert.equal(close.callCount, 1);
  });
});
