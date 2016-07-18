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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentSection', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-section', function() { done(); });
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSection
        disabled={false}
        title="Services to be deployed">
        <span>content</span>
      </juju.components.DeploymentSection>, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-section twelve-col deployment-section--active">
        {undefined}
        {undefined}
        <h3 className="deployment-section__title">
          {undefined}
          Services to be deployed
        </h3>
        <span>content</span>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with extra props', function() {
    var buttons = [{
      action: sinon.stub(),
      title: 'Add credential',
      type: 'neutral'
    }];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSection
        buttons={buttons}
        completed={true}
        disabled={true}
        extra={<span>extra</span>}
        instance="section-instance"
        showCheck={true}
        title="Services to be deployed">
        <span>content</span>
      </juju.components.DeploymentSection>, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className={
        'deployment-section twelve-col deployment-section--completed ' +
        'section-instance'}>
        <div className="deployment-section__mask"></div>
        <div className="deployment-section__actions">
          <div className="deployment-section__extra">
            <span>extra</span>
          </div>
          <juju.components.ButtonRow
            buttons={buttons} />
        </div>
        <h3 className="deployment-section__title">
          <juju.components.SvgIcon
            className="deployment-section__title-checkmark"
            name="complete"
            size="24" />
          Services to be deployed
        </h3>
        <span>content</span>
      </div>);
    assert.deepEqual(output, expected);
  });
});
