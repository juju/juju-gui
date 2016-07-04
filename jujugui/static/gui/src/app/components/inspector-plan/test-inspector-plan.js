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

describe('InspectorPlans', () => {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-plan', () => { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render correctly with a selected plan', () => {
    var currentPlan = {
      description: 'best description ever',
      price: 'price/goes/here',
      url: 'canonical-landscape/24-7'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorPlan
        acl={acl}
        currentPlan={currentPlan}/>);
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__details">
          <div className="inspector-plan__title">{currentPlan.url}</div>
          <div className="inspector-plan__price">{currentPlan.price}</div>
          <div className="inspector-plan__description">
            {currentPlan.description}
          </div>
        </div>
        <juju.components.ButtonRow
          buttons={[{
            title: 'Change plan',
            action: output.props.children[1].props.buttons[0].action,
            type: 'base'
          }]}/>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render correctly without a selected plan', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorPlan
        acl={acl}
        currentPlan={null}/>);
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__no-plan">
          You have no active plan
        </div>
        <juju.components.ButtonRow
          buttons={[{
            title: 'Choose plan',
            action: output.props.children[1].props.buttons[0].action,
            type: 'neutral'
          }]}/>
      </div>);
    assert.deepEqual(output, expected);
  });

});
