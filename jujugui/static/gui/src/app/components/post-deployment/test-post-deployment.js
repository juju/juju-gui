/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('PostDeployment', () => {

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('post-deployment', function() { done(); });
  });

  function renderComponent(props) {
    props = props || {};
    const defaultParsedMarkdown =
      '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>';
    const _props = {
      closePostDeployment: props.closePostDeployment || sinon.stub(),
      entityId: props.entityId || 'test',
      getEntity: props.getEntity
        || sinon.stub().callsArgWith(1, null, [{id: 'test', files: []}]),
      getFile: props.getFile
        || sinon.stub().callsArgWith(2, null, `# Test Name

    {details_link}{requires_cli_link}`),
      makeEntityModel: props.makeEntityModel || sinon.stub().returns({
        toEntity: sinon.stub().returns({
          displayName: 'Test Name'
        })
      }),
      marked: props.marked || sinon.stub().returns(defaultParsedMarkdown),
      showEntityDetails: props.showEntityDetails || sinon.stub()
    };

    const renderer = jsTestUtils.shallowRender(
      <juju.components.PostDeployment
        closePostDeployment={_props.closePostDeployment}
        entityId={_props.entityId}
        getEntity={_props.getEntity}
        getFile={_props.getFile}
        makeEntityModel={_props.makeEntityModel}
        marked={_props.marked}
        showEntityDetails={_props.showEntityDetails} />,
      true);

    return {
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance(),
      renderer: renderer,
      props: _props,
      defaultParsedMarkdown: defaultParsedMarkdown
    };
  };

  it('renders without onboarding.md', () => {
    const rendered = renderComponent();
    const instance = rendered.instance;
    const output = rendered.output;
    const props = rendered.props;

    const classes = [
      'post-deployment',
      'post-deployment--simple'
    ];

    expect(output).toEqualJSX(
      <juju.components.Panel
        extraClasses={classes.join(' ')}
        instanceName="post-deployment"
        visible={true}>
        <span className="close" tabIndex="0" role="button"
          onClick={props.closePostDeployment}>
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
        <p>
          Test Name
        &nbsp;</p>
        <span
          role="button"
          className="link"
          onClick={instance._handleViewDetails.bind(this)}>View details</span>
      </juju.components.Panel>
    );
  });

  it('renders with onrboarding.md', () => {
    const rendered = renderComponent();
    const props = rendered.props;
    const instance = rendered.instance;

    instance._getEntityCallback(null, [{id: 'test', files: ['onboarding.md']}]);

    const output = rendered.renderer.getRenderOutput();

    expect(output).toEqualJSX(
      <juju.components.Panel
        instanceName="post-deployment"
        extraClasses="post-deployment"
        visible={true}>
        <span className="close" tabIndex="0" role="button"
          onClick={props.closePostDeployment}>
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
        <div dangerouslySetInnerHTML={
          {
            __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
          }
        } onClick={instance._handleContentClick.bind(instance)} />
      </juju.components.Panel>
    );
  });

  it('extracts metadata in markdown head', () => {
    const rendered = renderComponent();
    const instance = rendered.instance;

    const rawMetadata = '---\n' +
      'stop: hammertime\n' +
      'jump_up: and_get_down\n' +
      '---\n';

    const parsedMetadata = instance.extractFrontmatter(rawMetadata);
    assert.deepEqual(parsedMetadata.metadata, {
      stop: 'hammertime',
      jump_up: 'and_get_down'
    });
  });

  it('doesn\'t extract bad metadata in markdown head', () => {
    const rendered = renderComponent();
    const instance = rendered.instance;

    const rawMetadata = '---\n' +
      'stop hammertime\n' +
      'jump_up: and_get_down\n' +
      '---\n';

    const parsedMetadata = instance.extractFrontmatter(rawMetadata);
    assert.deepEqual(parsedMetadata.metadata, {
      jump_up: 'and_get_down'
    });
  });

  it('replaces templateTags in markdown', () => {
    const rendered = renderComponent();
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
