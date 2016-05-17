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

describe('DeploymentPanelContent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-panel-content', function() { done(); });
  });

  it('can render', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanelContent
        title="Title">
        <span>Content</span>
      </juju.components.DeploymentPanelContent>);
    var expected = (
      <div className="deployment-panel__content ">
        <div className="twelve-col">
          <div className="inner-wrapper">
            <div className="deployment-panel__content-inner">
              <h2 className="deployment-panel__title">
                Title
              </h2>
              <span>Content</span>
            </div>
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can be passed a custom class', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanelContent
        className='testclass'
        title="Title">
        <span>Content</span>
      </juju.components.DeploymentPanelContent>);
    var expected = (
      <div className="deployment-panel__content testclass">
        <div className="twelve-col">
          <div className="inner-wrapper">
            <div className="deployment-panel__content-inner">
              <h2 className="deployment-panel__title">
                Title
              </h2>
              <span>Content</span>
            </div>
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });
});
