/* Copyright (C) 2017 Canonical Ltd. */

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

  function render(props) {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccordionSection
        openHeight={props.openHeight}
        startOpen={props.startOpen}
        title={props.title}>
        {props.children}
      </juju.components.AccordionSection>
      , true);

    return {
      renderer: renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('can render', () => {
    const comp = render({
      openHeight: 100,
      startOpen: false,
      title: 'My title!',
      children: <span>Hello</span>
    });
    expect(comp.output).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          onClick={comp.instance._toggle.bind(comp.instance)}>
          My title!
          <juju.components.SvgIcon className="right" name="chevron_down_16"
            size="16" />
        </div>
        <div className="accordion-section__content"
          style={{maxHeight: 0}}><span>Hello</span></div>
      </div>);
  });

  it('toggles open and closed when the heading is clicked', () => {
    const comp = render({
      openHeight:100,
      startOpen: false,
      title: 'My title!',
      children: <span>Hello</span>
    });
    const instance = comp.renderer.getMountedInstance();
    instance._toggle();
    let output = comp.renderer.getRenderOutput();
    expect(output).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          onClick={instance._toggle.bind(instance)}>
          My title!
          <juju.components.SvgIcon className="right" name="chevron_up_16"
            size="16" />
        </div>
        <div className="accordion-section__content"
          style={{maxHeight: 100}}><span>Hello</span></div>
      </div>);

    instance._toggle();
    output = comp.renderer.getRenderOutput();
    expect(output).toEqualJSX(
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
