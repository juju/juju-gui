/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Lightbox', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('lightbox', function() { done(); });
  });

  it('renders', () => {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Lightbox
        caption="Test caption"
        close={close}>
        Hi
      </juju.components.Lightbox>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox_close">
          <juju.components.SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__content">
          <div className="lightbox__content-image">
            Hi
          </div>
          <div className="lightbox__content-caption">
            Test caption
          </div>
        </div>
      </div>
    );
  });

  it('renders without a caption', () => {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Lightbox
        close={close}>
        Hi
      </juju.components.Lightbox>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox_close">
          <juju.components.SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__content">
          <div className="lightbox__content-image">
            Hi
          </div>
        </div>
      </div>
    );
  });

});
