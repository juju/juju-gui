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

describe('Deployment', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-component', function() { done(); });
  });

  it('can display nothing', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        activeComponent={null}
        ecsClear={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        services={services}
        showInstall={true} />);
    assert.isFalse(output.props.visible, false);
  });

  it('can display the deployment summary', function() {
    var autoPlaceDefault = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var ecsClear = sinon.stub();
    var ecsCommit = sinon.stub();
    var changeDescriptions = {};
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        activeComponent="summary"
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        currentChangeSet={currentChangeSet}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        changeDescriptions={changeDescriptions}
        exportEnvironmentFile={exportEnvironmentFile}
        autoPlaceDefault={autoPlaceDefault}
        autoPlaceUnits={autoPlaceUnits}
        changeState={changeState}
        getUnplacedUnitCount={getUnplacedUnitCount}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSummary
        autoPlaceDefault={autoPlaceDefault}
        autoPlaceUnits={autoPlaceUnits}
        changeDescriptions={changeDescriptions}
        changeState={changeState}
        ecsClear={ecsClear}
        ecsCommit={ecsCommit}
        getUnplacedUnitCount={getUnplacedUnitCount} />);
    assert.deepEqual(output.props.children, expected);
  });
});
