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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentSummary', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary', function() { done(); });
  });

  it('can display a list of changes', function() {
    var closeButtonAction = sinon.stub();
    var deployButtonAction = sinon.stub();
    var changes = [{
        icon: 'my-icon.svg',
        description: 'Django was added',
        time: '10:12 am'
      }, {
        icon: 'another-icon.svg',
        description: 'Apache2 was added',
        time: '10:13 am'
    }];
    var generateAllChangeDescriptions = sinon.stub().returns(changes);
    var changeItems = [
    <juju.components.DeploymentSummaryChangeItem
      key={0}
      change={changes[0]} />,
    <juju.components.DeploymentSummaryChangeItem
      key={1}
      change={changes[1]} />];
    var className = 'deployment-summary-change-item ' +
        'deployment-summary__list-header';
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        generateAllChangeDescriptions={generateAllChangeDescriptions}
        deployButtonAction={deployButtonAction}
        closeButtonAction={closeButtonAction} />);
    assert.deepEqual(output,
      <juju.components.Panel
        instanceName="deployment-summary-panel"
        visible={true}>
        <div className="deployment-summary">
          <div className="deployment-summary__header">
            <span className="deployment-summary__close"
              tabIndex="0" role="button"
              onClick={closeButtonAction}>
              <i className="sprite close_16"></i>
            </span>
            <h2 className="deployment-summary__title">
              Deployment summary
            </h2>
          </div>
          <div className="deployment-summary__content">
            <ul className="deployment-summary__list">
              <li className={className}>
                <span className="deployment-summary-change-item__change">
                  Change
                </span>
                <span className="deployment-summary-change-item__time">
                  Time
                </span>
              </li>
              {changeItems}
            </ul>
          </div>
          <div className="deployment-summary__footer">
            <button className="deployment-summary__deploy-button"
              onClick={deployButtonAction}>
              Deploy
            </button>
          </div>
        </div>
      </juju.components.Panel>);
  });
});
