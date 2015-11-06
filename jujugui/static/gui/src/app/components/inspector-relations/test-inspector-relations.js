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

describe('InspectorRelations', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relations', function() { done(); });
  });

  it('can render the onboarding', function() {
    var getRelationDataForService = sinon.stub();
    getRelationDataForService.returns([]);
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelations
          getRelationDataForService={getRelationDataForService} />);
    assert.deepEqual(output,
        <div className="inspector-relations">
          <div className="inspector-relations__onboarding">
            <p className="inspector-relations__onboarding-description">
              This service doesn&rsquo;t have any relations. Build
              relationships between services and find out about them here.
            </p>
            <div className="inspector-relations-item">
              <span className="inspector-relations-item__details">
                <p className="inspector-relations-item__property">
                  Interface: mysql
                </p>
                <p className="inspector-relations-item__property">
                  Name: slave
                </p>
                <p className="inspector-relations-item__property">
                  Role: client
                </p>
                <p className="inspector-relations-item__property">
                  Scope: global
                </p>
              </span>
            </div>
          </div>
        </div>);
  });

  it('can render the relations list', function() {
    var changeState = sinon.stub();
    var relations = [
      {id: 'mysql'},
      {id: 'postgresql'}
    ];
    var getRelationDataForService = sinon.stub().returns(relations);
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelations
          changeState={changeState}
          getRelationDataForService={getRelationDataForService} />);
    assert.deepEqual(output,
        <div className="inspector-relations">
          <ul className="inspector-relations__list">
            <juju.components.InspectorRelationsItem
              key={relations[0].id}
              relation={relations[0]}
              changeState={changeState} />
            <juju.components.InspectorRelationsItem
              key={relations[1].id}
              relation={relations[1]}
              changeState={changeState} />
          </ul>
        </div>);
  });
});
