/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('CanvasInfo', () => {

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('canvas-info', function() { done(); });
  });

  function render(props) {
    props = props || {};
    const defaultParsedMarkdown =
      '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>';
    const _props = {
      closeCanvasInfo: props.closeCanvasInfo || sinon.stub(),
      entity: props.entity || {id: 'test', files: []},
      getFile: props.getFile || sinon.stub(),
      makeEntityModel: props.makeEntityModel || sinon.stub().returns({
        toEntity: sinon.stub().returns({
          displayName: 'Test Name'
        })
      }),
      marked: props.marked || sinon.stub().returns(defaultParsedMarkdown),
      showEntityDetails: props.showEntityDetails || sinon.stub()
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.CanvasInfo
        closeCanvasInfo={_props.closeCanvasInfo}
        entity={_props.entity}
        getFile={_props.getFile}
        makeEntityModel={_props.makeEntityModel}
        marked={_props.marked}
        showEntityDetails={_props.showEntityDetails} />
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
      'canvas-info',
      'canvas-info--simple'
    ];

    instance.componentDidMount();

    const output = rendered.renderer.getRenderOutput();

    expect(output).toEqualJSX(
      <juju.components.Modal
        closeModal={props.closeCanvasInfo}
        extraClasses={classes.join(' ')}>
        <p>
          Test Name
        </p>
        <span className="link" onClick={instance._handleViewDetails.bind(instance)}
          role="button">View details</span>
      </juju.components.Modal>
    );
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
        closeModal={props.closeCanvasInfo}
        extraClasses="modal--right modal--auto-height canvas-info">
        <div dangerouslySetInnerHTML={{__html: rendered.defaultParsedMarkdown}}
          onClick={instance._handleContentClick.bind(instance)} />
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

  it('doesn\'t extract bad metadata in markdown head', () => {
    const rendered = render();
    const instance = rendered.instance;

    const rawMetadata = '---\n' +
      'stop hammertime\n' +
      'jump_up: and_get_down\n' +
      '---\n';

    const parsedMetadata = instance.parseMarkdownMetadata(rawMetadata);
    assert.deepEqual(parsedMetadata, {
      jump_up: 'and_get_down'
    });
  });

  it('replaces templateTags in markdown', () => {
    const rendered = render();
    const instance = rendered.instance;

    const rawMarkdown = '{details_link} A WORD {requires_cli_link}';
    const replaceTemplateTags = instance.replaceTemplateTags(rawMarkdown);

    assert.deepEqual(replaceTemplateTags, '<span role="button" \
class="link" \
data-templatetag="details_link">View details</span> A WORD <a \
href="https://jujucharms.com/docs/stable/reference-install" \
target="_blank">Juju CLI client</a>');
  });
});
