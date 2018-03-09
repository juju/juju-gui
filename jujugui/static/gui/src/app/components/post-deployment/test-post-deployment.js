/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');

const PostDeployment = require('./post-deployment');
const Panel = require('../panel/panel');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('PostDeployment', () => {

  function renderComponent(props) {
    props = props || {};
    const defaultParsedMarkdown =
      '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>';
    let marked = sinon.stub().returns(defaultParsedMarkdown);
    Object.defineProperty(marked, 'Renderer', {value: sinon.stub()});

    const _props = {
      changeState: props.changeState || sinon.stub(),
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
      marked: props.marked || marked,
      showEntityDetails: props.showEntityDetails || sinon.stub()
    };

    const renderer = jsTestUtils.shallowRender(
      <PostDeployment
        changeState={_props.changeState}
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

  it('renders with getstarted.md', () => {
    const rendered = renderComponent();
    const instance = rendered.instance;

    instance._getEntityCallback(null, [{id: 'test', files: ['getstarted.md']}]);

    const output = rendered.renderer.getRenderOutput();

    expect(output).toEqualJSX(
      <Panel
        extraClasses="post-deployment"
        instanceName="post-deployment"
        visible={true}>
        <span className="close" onClick={instance._closePostDeployment} role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
        <div dangerouslySetInnerHTML={
          {
            __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
          }
        } onClick={instance._handleContentClick.bind(instance)} />
      </Panel>
    );
  });

  it('is not case sensitive on getstarted.md', () => {
    const rendered = renderComponent();
    const instance = rendered.instance;
    instance._getEntityCallback(null, [{id: 'test', files: ['gEtstArteD.md']}]);
    const output = rendered.renderer.getRenderOutput();
    expect(output).toEqualJSX(
      <Panel
        extraClasses="post-deployment"
        instanceName="post-deployment"
        visible={true}>
        <span className="close" onClick={instance._closePostDeployment} role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
        <div dangerouslySetInnerHTML={
          {
            __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
          }
        } onClick={instance._handleContentClick.bind(instance)} />
      </Panel>
    );
    // When requesting the file it should request the actual name as
    // charmstore is case sensitive
    assert.equal(instance.props.getFile.args[0][1], 'gEtstArteD.md');
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
