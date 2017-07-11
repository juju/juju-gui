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

describe('AccordionSection', () => {
  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('accordion-section', () => {
      done();
    });
  });

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccordionSection
        openHeight={100}
        startOpen={false}
        title="My title!">
        <span>Hello</span>
      </juju.components.AccordionSection>,
      true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    expect(renderer.getRenderOutput()).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          onClick={instance._toggle.bind(instance)}>
          My title!
          <juju.components.SvgIcon className="right" name="chevron_down_16"
            size="16" />
        </div>
        <div className="accordion-section__content"
          style={{maxHeight: 0}}><span>Hello</span></div>
      </div>);
  });
});
