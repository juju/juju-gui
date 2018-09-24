/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');
const enzyme = require('enzyme');

const PostDeployment = require('./post-deployment');

describe('PostDeployment', () => {
  let charmstore;

  const renderComponent = (options = {}) => {
    return enzyme.shallow(
      <PostDeployment
        changeState={options.changeState || sinon.stub()}
        charmstore={options.charmstore || charmstore}
        entityURLs={options.entityURLs || ['test']} />
    );
  };

  beforeEach(() => {
    charmstore = {
      getFile: sinon.stub()
    };
  });

  it('renders with getstarted.md', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._handleFileResponse(
      'content', null, '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>');
    wrapper.update();
    const expected = (
      <div
        dangerouslySetInnerHTML={
          {
            __html: '<h1>Test Name</h1><p>{details_link}{requires_cli_link}</p>'
          }
        }
        onClick={wrapper.find('div').prop('onClick')} />
    );
    assert.compareJSX(wrapper.find('div'), expected);
  });

  it('gracefully handles no getstarted.md available', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._handleFileResponse('getstarted.md', null, '{}');
    wrapper.update();
    const content = wrapper.find('div').prop('dangerouslySetInnerHTML').__html;
    assert.equal(content, 'The bundle author has not provided a getstarted.md file.');
  });

  it('supports local bundle paths', () => {
    // If the fix is not implemented in _fetchFiles this will fail by throwing
    // on render so no assertions are necessary.
    renderComponent({entityURLs: ['local-bundle (1)']});
  });

  it('correctly updates when the entityURLs prop changes', () => {
    const getFileStub = sinon.stub();
    const wrapper = renderComponent({
      charmstore: {
        getFile: getFileStub
      }});
    wrapper.setProps({entityURLs: ['elasticsearch-cluster/bundle/17']});
    assert.equal(getFileStub.callCount, 4);
    assert.equal(getFileStub.args[2][0], 'cs:bundle/elasticsearch-cluster-17');
    assert.equal(getFileStub.args[2][1], 'getstarted.md');
    assert.equal(getFileStub.args[3][0], 'cs:bundle/elasticsearch-cluster-17');
    assert.equal(getFileStub.args[3][1], 'post-deployment.sh');
  });

  it('renders a post-deployment script button', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._handleFileResponse('getstarted.md', null, 'markdown');
    instance._handleFileResponse('post-deployment.sh', null, 'markdown');
    wrapper.update();
    const expected = 'Execute post-deployment script';
    assert.equal(wrapper.find('Button').props().children, expected);
  });

  it('sends the post-deployment script to the terminal', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({script: true, changeState: changeState});
    const instance = wrapper.instance();
    instance._handleFileResponse('getstarted.md', null, 'markdown');
    instance._handleFileResponse('post-deployment.sh', null, `commands
    on multiple
    lines`);
    wrapper.update();
    wrapper.find('Button').props().action();
    // sinon.callsArgWith passes the same file each time it's called, so we
    // expect the markdown content, here.
    assert.deepEqual(changeState.args[0][0], {
      terminal: [ 'commands', '    on multiple', '    lines']
    });
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

  it('replaces templateTags in markdown', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({changeState});
    const instance = wrapper.instance();
    instance._handleContentClick({
      target: {
        getAttribute: sinon.stub().withArgs('data-templatetag').returns('details_link')
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      search: null,
      store: 'test'
    });
  });
});
