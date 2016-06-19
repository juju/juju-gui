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

describe('ImportExport', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('import-export', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render and pass the correct props', function() {
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        hasEntities={true}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="import-export">
        <span className="import-export__export link"
          onClick={instance._handleExport}
          role="button"
          title="Export"
          tabIndex="0">
          <juju.components.SvgIcon name="export_16"
            className="import-export__icon"
            size="16" />
        </span>
        <span className="import-export__import link"
          onClick={instance._handleImportClick}
          role="button"
          title="Import"
          tabIndex="0">
          <juju.components.SvgIcon name="import_16"
            className="import-export__icon"
            size="16" />
        </span>
        <input className="import-export__file"
          type="file"
          onChange={instance._handleImportFile}
          accept=".zip,.yaml,.yml"
          ref="file-input" />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('sets the initial class if there are no changes or entites', function() {
    var currentChangeSet = {};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        hasEntities={false}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    assert.equal(output.props.className,
      'import-export import-export--initial');
  });

  it('does not set the initial class if there are entites', function() {
    var currentChangeSet = {};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        hasEntities={true}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    assert.equal(output.props.className,
      'import-export');
  });

  it('can export the env', function() {
    var currentChangeSet = {one: 1, two: 2};
    var exportEnvironmentFile = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={exportEnvironmentFile}
        hasEntities={false}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()} />);
    output.props.children[0].props.onClick();
    assert.equal(exportEnvironmentFile.callCount, 1);
  });

  it('can open the file dialog when import is clicked', function() {
    var currentChangeSet = {one: 1, two: 2};
    var fileClick = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        hasEntities={false}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        currentChangeSet={currentChangeSet} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {'file-input': {click: fileClick}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.onClick();
    assert.equal(fileClick.callCount, 1);
  });

  it('can get a file when a file is selected', function() {
    var currentChangeSet = {one: 1, two: 2};
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        currentChangeSet={currentChangeSet} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      'file-input': {files: ['apache2.yaml']},
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[2].props.onChange();
    assert.equal(importBundleFile.callCount, 1);
    assert.equal(importBundleFile.args[0][0], 'apache2.yaml');
  });

  it('can disable importing when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ImportExport
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        hasEntities={true}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="import-export">
        <span className="import-export__export link"
          onClick={instance._handleExport}
          role="button"
          title="Export"
          tabIndex="0">
          <juju.components.SvgIcon name="export_16"
            className="import-export__icon"
            size="16" />
        </span>
        <span className="import-export__import link"
          onClick={false}
          role="button"
          title="Import"
          tabIndex="0">
          <juju.components.SvgIcon name="import_16"
            className="import-export__icon"
            size="16" />
        </span>
        <input className="import-export__file"
          type="file"
          onChange={null}
          accept=".zip,.yaml,.yml"
          ref="file-input" />
      </div>);
    assert.deepEqual(output, expected);
  });
});
