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
      startOpen: false,
      title: 'My title!',
      children: <span>Hello</span>
    });
    expect(comp.output).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          role="button"
          onClick={comp.instance._toggle.bind(comp.instance)}>
          <span className="accordion-section__title-content">My title!</span>
          <juju.components.SvgIcon className="right" name="chevron_down_16"
            size="16" />
        </div>
        <div className="accordion-section__content" ref={sinon.stub()}
          style={{maxHeight: 0}}><span>Hello</span></div>
      </div>);
  });

  it('toggles open and closed when the heading is clicked', () => {
    const comp = render({
      startOpen: false,
      title: 'My title!',
      children: <span>Hello</span>
    });
    const instance = comp.renderer.getMountedInstance();
    instance['accordion-section-content'] = {scrollHeight: 100};
    instance._toggle();
    let output = comp.renderer.getRenderOutput();
    expect(output).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          role="button"
          onClick={instance._toggle.bind(instance)}>
          <span className="accordion-section__title-content">My title!</span>
          <juju.components.SvgIcon className="right" name="chevron_up_16"
            size="16" />
        </div>
        <div className="accordion-section__content" ref={sinon.stub()}
          style={{maxHeight: 100}}><span>Hello</span></div>
      </div>);
  });

  it('does not show chevron or content when there are no children', () => {
    const comp = render({
      startOpen: false,
      title: 'My title!'
    });
    expect(comp.output).toEqualJSX(
      <div className="accordion-section">
        <div className="accordion-section__title"
          role="button"
          onClick={comp.instance._toggle.bind(comp.instance)}>
          <span className="accordion-section__title-content">My title!</span>
        </div>
        <div className="accordion-section__content" ref={sinon.stub()}
          style={{maxHeight: 0}}></div>
      </div>
    );
  });
});
