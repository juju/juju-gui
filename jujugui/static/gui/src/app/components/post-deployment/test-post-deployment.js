/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const enzyme = require('enzyme');

const PostDeployment = require('./post-deployment');

describe('PostDeployment', () => {
  let defaultParsedMarkdown, file, getFile;

  const renderComponent = (options = {}) => {
    let marked = sinon.stub().returns(defaultParsedMarkdown);
    Object.defineProperty(marked, 'Renderer', {value: sinon.stub()});
    return enzyme.shallow(
      <PostDeployment
        changeState={options.changeState || sinon.stub()}
        entityId={options.entityId || 'test'}
        getEntity={
          options.getEntity || sinon.stub().callsArgWith(1, null, [{id: 'test', files: []}])}
        getFile={options.getFile || getFile}
        marked={options.marked || marked}
        showEntityDetails={options.showEntityDetails || sinon.stub()} />
    );
  };

  beforeEach(() => {
    defaultParsedMarkdown =
      '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>';
    file = `# Test Name

{details_link}{requires_cli_link}`;
    getFile = sinon.stub().callsArgWith(2, null, file);
  });

  it('renders with getstarted.md', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._getEntityCallback(null, [{id: 'test', files: ['getstarted.md']}]);
    wrapper.update();
    const expected = (
      <div dangerouslySetInnerHTML={
        {
          __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
        }
      }
      onClick={wrapper.find('div').prop('onClick')} />
    );
    assert.compareJSX(wrapper.find('div'), expected);
  });

  it('is not case sensitive on getstarted.md', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._getEntityCallback(null, [{id: 'test', files: ['gEtstArteD.md']}]);
    wrapper.update();
    const expected = (
      <div dangerouslySetInnerHTML={
        {
          __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
        }
      }
      onClick={wrapper.find('div').prop('onClick')} />
    );
    assert.compareJSX(wrapper.find('div'), expected);
    // When requesting the file it should request the actual name as
    // charmstore is case sensitive
    assert.equal(getFile.args[0][1], 'gEtstArteD.md');
  });

  it('extracts metadata in markdown head', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();

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
    const wrapper = renderComponent();
    const instance = wrapper.instance();

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
    const wrapper = renderComponent();
    const instance = wrapper.instance();

    const rawMarkdown = '{details_link} A WORD {requires_cli_link}';
    const replaceTemplateTags = instance.replaceTemplateTags(rawMarkdown);

    assert.deepEqual(replaceTemplateTags, '<span role="button" \
class="link" \
data-templatetag="details_link">View details</span> A WORD <a \
href="https://jujucharms.com/docs/stable/reference-install" \
target="_blank">Juju CLI client</a>');
  });
});
