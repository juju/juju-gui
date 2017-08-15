/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('PostDeployment', () => {

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('post-deployment', function() { done(); });
  });

  function render(props) {
    props = props || {};
    const defaultParsedMarkdown =
      '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>';
    const _props = {
      changeState: props.changeState || sinon.stub(),
      closePostDeployment: props.closePostDeployment || sinon.stub(),
      displayName: props.displayName || 'Test Name',
      entityId: props.entityId || 'test-name',
      entityUrl: props.entityUrl || {
        path: sinon.stub()
      },
      getFile: props.getFile || sinon.stub(),
      marked: props.marked || sinon.stub().returns(defaultParsedMarkdown)
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.PostDeployment
        changeState={_props.changeState}
        closePostDeployment={_props.closePostDeployment}
        displayName={_props.displayName}
        entityId={_props.entityId}
        getFile={_props.getFile}
        marked={_props.marked}
        entityUrl={_props.entityUrl} />
      , true);

    return {
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance(),
      renderer: renderer,
      props: _props,
      defaultParsedMarkdown: defaultParsedMarkdown
    };
  };

  it('renders without usage.md', () => {
    const rendered = render();
    const instance = rendered.instance;
    const props = rendered.props;

    const classes = [
      'modal--right',
      'modal--auto-height',
      'post-deployment',
      'post-deployment--simple'
    ];

    expect(rendered.output).toEqualJSX(
      <juju.components.Modal
        closeModal={props.closePostDeployment}
        extraClasses={classes.join(' ')}>
        <p>
          Test Name
        </p>
        <span className="link" onClick={instance._handleViewDetails.bind(instance)}
          role="button">View details</span>
      </juju.components.Modal>
    );
  });

  it('extracts metadata in markdown head', () => {
    const rendered = render();
    const instance = rendered.instance;

    const rawMetadata = '---\n' +
      'stop: hammertime\n' +
      'jump_up: and_get_down\n' +
      '---\n';

    const parsedMetadata = instance.parseMarkdownMetadata(rawMetadata);
    assert.deepEqual(parsedMetadata, {
      stop: 'hammertime',
      jump_up: 'and_get_down'
    });
  });

  it('replaces vars in markdown', () => {
    const rendered = render();
    const instance = rendered.instance;

    const rawMarkdown = '{details_link} A WORD {requires_cli_link}';
    const replaceVars = instance.replaceVars(rawMarkdown);

    assert.deepEqual(replaceVars, '<span role="button" \
class="link" \
data-variable="details_link">View details</span> A WORD <a \
href="https://jujucharms.com/docs/stable/reference-install" \
target="_blank">Juju CLI client</a>');
  });

  it('renders with usage.md', () => {
    const rendered = render();
    const props = rendered.props;
    const instance = rendered.instance;
    instance._getUsageCallback.call(instance, null, `# Test Name

{details_link}{requires_cli_link}`);
    assert.deepEqual(
      instance.state.content,
      rendered.defaultParsedMarkdown);

    const output = rendered.renderer.getRenderOutput();

    expect(output).toEqualJSX(
      <juju.components.Modal
        closeModal={props.closePostDeployment}
        extraClasses="modal--right modal--auto-height post-deployment">
        <div dangerouslySetInnerHTML={{__html: rendered.defaultParsedMarkdown}}
          onClick={instance._handleContentClick.bind(instance)} />
      </juju.components.Modal>
    );
  });
});
