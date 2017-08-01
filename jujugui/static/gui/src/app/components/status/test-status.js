/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Status', function() {
  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('status', function() {
      done();
    });
  });

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
      <window.juju.components.Status
        addNotification={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Panel
        instanceName="status-view"
        visible={true}>
        <div className="status-view__content">
          Status
        </div>
      </juju.components.Panel>
    );
    expect(output).toEqualJSX(expected);
  });

});
