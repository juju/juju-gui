/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

function _generateTagItem(tag, fn) {
  return [
    <li key={tag + 0}>
      <a data-id={tag} className="link" onClick={fn}>{tag}</a>
    </li>
  ];
}

function generateScript(isBundle, isDD) {
  let id = 'trusty/django-123';
  if (isBundle) {
    id = 'django-cluster';
  }
  const dataDD = isDD ? 'data-dd' : '';
  return '<script ' +
    'src="https://assets.ubuntu.com/v1/juju-cards-v1.6.0.js"></script>\n' +
    '<div class="juju-card" '+dataDD+' data-id="'+id+'"></div>';
}

describe('EntityContent', function() {
  let mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can display a charm', function() {
    const apiUrl = 'http://example.com';
    const description = mockEntity.get('description');
    const renderMarkdown = sinon.stub().returns(description);
    const getFile = sinon.spy();
    const changeState = sinon.spy();
    const pluralize = sinon.spy();
    const script = generateScript();
    const scrollCharmbrowser = sinon.stub();
    const addNotification = sinon.stub();
    mockEntity.set('resources', [{resource: 'one'}]);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={false}
        hash="readme"
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const option1 = {
      description: 'Your username',
      type: 'string',
      default: 'spinach',
      name: 'username'
    };
    const option2 = {
      description: 'Your password',
      type: 'string',
      default: 'abc123',
      name: 'password'
    };
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content">
        <div className="row row--grey entity-content__terms">
          <div className="inner-wrapper">
            <div className="four-col entity-content__metadata">
              <h4>Tags</h4>
              <ul>
                {_generateTagItem('database', instance._handleTagClick)}
              </ul>
            </div>
          </div>
        </div>
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <juju.components.EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
            </div>
            <div className="four-col">
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__links">
                  <li>
                    <a href="https://bugs.launchpad.net/charms/+source/django"
                      className="link"
                      target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  {undefined}
                </ul>
              </div>
              <juju.components.EntityResources
                apiUrl={apiUrl}
                entityId={mockEntity.get('id')}
                pluralize={pluralize}
                resources={[{resource: 'one'}]} />
              <juju.components.EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <juju.components.EntityContentRevisions
                revisions={mockEntity.get('revisions')} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>Add this card to your website by copying the code below.
                  <a className="link"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <textarea className="twelve-col" cols="70"
                  defaultValue={script} readOnly="readonly"
                  rows="2" wrap="off" />
                <h4>Preview</h4>
                <div className="juju-card" data-id="trusty/django-123"></div>
              </div>
            </div>
          </div>
        </div>
        <div id="configuration"
          className="row row--grey entity-content__configuration">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <h2 className="entity-content__header">Configuration</h2>
              <dl>
                <juju.components.EntityContentConfigOption
                  key={option1.name}
                  option={option1} />
                <juju.components.EntityContentConfigOption
                  key={option2.name}
                  option={option2} />
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can display a direct deploy card', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        flags={{'test.ddeploy': true}}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />);
    const script = output.props.children[2].props.children.props.children[1].
      props.children[5].props.children[2];
    const card = output.props.children[2].props.children.props.children[1].
      props.children[5].props.children[4];
    const expected = (
      <div className="juju-card" data-dd data-id="trusty/django-123"></div>);
    const scriptExpected = (
      <textarea
        rows="2" cols="70" readOnly="readonly" wrap="off"
        className="twelve-col" defaultValue={generateScript(false, true)}></textarea>);
    expect(card).toEqualJSX(expected);
    expect(script).toEqualJSX(scriptExpected);
  });

  it('can display a charm with terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub();
    showTerms.onFirstCall().callsArgWith(2, null, {
      name: 'terms1',
      revision: 5
    });
    showTerms.onSecondCall().callsArgWith(2, null, {
      name: 'terms2',
      revision: 10
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const terms = output.props.children[0].props.children.props.children[1];
    const links = terms.props.children[1].props.children;
    const expected = (
      <div className="four-col entity-content__metadata">
        <h4>Terms</h4>
        <ul>
          {[<li className="link"
            key="terms1"
            onClick={links[0].props.onClick}>
              terms1
          </li>,
          <li className="link"
            key="terms2"
            onClick={links[1].props.onClick}>
              terms2
          </li>]}
        </ul>
      </div>);
    expect(terms).toEqualJSX(expected);
  });

  it('can display the terms popup', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub();
    showTerms.onFirstCall().callsArgWith(2, null, {
      name: 'terms1',
      revision: 5
    });
    showTerms.onSecondCall().callsArgWith(2, null, {
      name: 'terms2',
      revision: 10
    });
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    const terms = output.props.children[0].props.children.props.children[1];
    terms.props.children[1].props.children[1].props.onClick();
    output = renderer.getRenderOutput();
    const expected = (
      <juju.components.TermsPopup
        close={instance._toggleTerms}
        terms={[{
          name: 'terms2',
          revision: 10
        }]} />);
    expect(output.props.children[4]).toEqualJSX(expected);
  });

  it('can display a spinner when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub();
    showTerms.onFirstCall();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="four-col entity-content__metadata">
        <h4>Terms</h4>
        <juju.components.Spinner />
      </div>);
    const terms = output.props.children[0].props.children.props.children[1];
    expect(terms).toEqualJSX(expected);
  });

  it('can handle errors when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub().onFirstCall().callsArgWith(2, 'Uh oh', null);
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={addNotification}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    renderer.getRenderOutput();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Failed to load terms for term1',
      message: 'Failed to load terms for term1: Uh oh',
      level: 'error'
    });
  });

  it('can abort requests when unmounting', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const abort = sinon.stub();
    const showTerms = sinon.stub().returns({abort: abort});
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 2);
  });

  it('can display a charm with actions', function() {
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="section">
        <h3 className="section__title">
          Contribute
        </h3>
        <ul className="section__links">
          <li>
            <a href="http://example.com/bugs"
              className="link"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li>
            <a href="http://example.com/"
              className="link"
              target="_blank">
              Project homepage
            </a>
          </li>
        </ul>
      </div>);
    const parent = output.props.children[2].props.children.props.children[1];
    expect(parent.props.children[0]).toEqualJSX(expected);
  });

  it('can display a charm with no options', function() {
    mockEntity.set('options', null);
    const description = mockEntity.get('description');
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.stub().returns(description);
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const script = generateScript();
    const scrollCharmbrowser = sinon.stub();
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={false}
        hash="readme"
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content">
        <div className="row row--grey entity-content__terms">
          <div className="inner-wrapper">
            <div className="four-col entity-content__metadata">
              <h4>Tags</h4>
              <ul>
                {_generateTagItem('database', instance._handleTagClick)}
              </ul>
            </div>
          </div>
        </div>
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <juju.components.EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
            </div>
            <div className="four-col">
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__links">
                  <li>
                    <a href="https://bugs.launchpad.net/charms/+source/django"
                      className="link"
                      target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  {undefined}
                </ul>
              </div>
              <juju.components.EntityResources
                apiUrl={apiUrl}
                entityId={mockEntity.get('id')}
                pluralize={pluralize}
                resources={undefined} />
              <juju.components.EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <juju.components.EntityContentRevisions
                revisions={mockEntity.get('revisions')} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>Add this card to your website by copying the code below.
                  <a className="link"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <textarea className="twelve-col" cols="70"
                  defaultValue={script} readOnly="readonly"
                  rows="2" wrap="off" />
                <h4>Preview</h4>
                <div className="juju-card" data-id="trusty/django-123"></div>
              </div>
            </div>
          </div>
        </div>
        {undefined}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can display a bundle for Juju 2', function() {
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const changeState = sinon.spy();
    const pluralize = sinon.spy();
    const mockEntity = jsTestUtils.makeEntity(true);
    const script = generateScript(true);
    const scrollCharmbrowser = sinon.stub();
    const addNotification = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={false}
        hash="readme"
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />);
    const expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <juju.components.EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
            </div>
            <div className="four-col">
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__links">
                  {undefined}
                  <li>
                    <a href={'https://code.launchpad.net/~charmers/charms/' +
                      'bundles/django-cluster/bundle'}
                    className="link"
                    target="_blank">
                      Project homepage
                    </a>
                  </li>
                </ul>
              </div>
              {undefined}
              {undefined}
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <juju.components.EntityContentRevisions
                revisions={mockEntity.get('revisions')} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>Add this card to your website by copying the code below.
                  <a className="link"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <textarea className="twelve-col" cols="70"
                  defaultValue={script} readOnly="readonly"
                  rows="2" wrap="off" />
                <h4>Preview</h4>
                <div className="juju-card" data-id="django-cluster"></div>
              </div>
            </div>
          </div>
        </div>
        <div id="configuration"
          className="row row--grey entity-content__configuration">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <h2 className="entity-content__header">Configuration</h2>
              <ul>
                <juju.components.ExpandingRow
                  classes={{
                    'entity-content__bundle-config': true
                  }}
                  key="gunicorn">
                  <div className="entity-content__bundle-config-title">
                    gunicorn
                    <div className="entity-content__bundle-config-chevron">
                      <div className="entity-content__bundle-config-expand">
                        <juju.components.SvgIcon
                          name="chevron_down_16"
                          size="16" />
                      </div>
                      <div className="entity-content__bundle-config-contract">
                        <juju.components.SvgIcon
                          name="chevron_up_16"
                          size="16" />
                      </div>
                    </div>
                  </div>
                  <dl className="entity-content__bundle-config-options">
                    {[
                      <div className="entity-content__config-option"
                        key="name0">
                        <dt className="entity-content__config-name">
                          name
                        </dt>
                        <dd className="entity-content__config-description">
                          <p>
                            title
                          </p>
                        </dd>
                      </div>,
                      <div className="entity-content__config-option"
                        key="active1">
                        <dt className="entity-content__config-name">
                          active
                        </dt>
                        <dd className="entity-content__config-description">
                          <p>
                            {true}
                          </p>
                        </dd>
                      </div>
                    ]}
                  </dl>
                </juju.components.ExpandingRow>
                <juju.components.ExpandingRow
                  classes={{
                    'entity-content__bundle-config': true
                  }}
                  key="django">
                  <div className="entity-content__bundle-config-title">
                    django
                    <div className="entity-content__bundle-config-chevron">
                      <div className="entity-content__bundle-config-expand">
                        <juju.components.SvgIcon
                          name="chevron_down_16"
                          size="16" />
                      </div>
                      <div className="entity-content__bundle-config-contract">
                        <juju.components.SvgIcon
                          name="chevron_up_16"
                          size="16" />
                      </div>
                    </div>
                  </div>
                  <dl className="entity-content__bundle-config-options">
                    {[<div key="none">
                      Config options not modified in this bundle.
                    </div>]}
                  </dl>
                </juju.components.ExpandingRow>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can display a bundle with actions', function() {
    mockEntity = jsTestUtils.makeEntity(true);
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="section">
        <h3 className="section__title">
          Contribute
        </h3>
        <ul className="section__links">
          <li>
            <a href="http://example.com/bugs"
              className="link"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li>
            <a href="http://example.com/"
              className="link"
              target="_blank">
              Project homepage
            </a>
          </li>
        </ul>
      </div>);
    const parent = output.props.children[2].props.children.props.children[1];
    expect(parent.props.children[0]).toEqualJSX(expected);
  });

  it('doesn\'t show relations when they don\'t exist', function() {
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const changeState = sinon.spy();
    const pluralize = sinon.spy();
    mockEntity.set('relations', {requires: {}, provides: {}});
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const parent = output.props.children[2].props.children.props.children[1];
    const relationsComponent = parent.props.children[2];
    assert.equal(relationsComponent, undefined);
  });

  it('can display plans', function() {
    const plans = [{
      url: 'plan1',
      price: 'test/price1',
      description: 'description1'
    }, {
      url: 'plan2',
      price: 'price2;',
      description: 'description2'
    }, {
      url: 'plan3',
      price: 'test/price3;price3b',
      description: 'description3'
    }];
    mockEntity.set('options', null);
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        plans={plans}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div id="plans"
        className="row entity-content__plans">
        <div className="inner-wrapper">
          <div className="twelve-col">
            <h2 className="entity-content__header">Plans</h2>
            <div className="equal-height">
              {[
                <div className="entity-content__plan four-col"
                  key="plan10">
                  <div className="entity-content__plan-content">
                    <h3 className="entity-content__plan-title">
                      plan1
                    </h3>
                    <ul className="entity-content__plan-price">
                      {[<li className="entity-content__plan-price-item"
                        key="testprice10">
                        <span className="entity-content__plan-price-amount">
                          test
                        </span>
                        <span className="entity-content__plan-price-quantity">
                          / {'price1'}
                        </span>
                      </li>]}
                    </ul>
                    <p className="entity-content__plan-description">
                      description1
                    </p>
                  </div>
                </div>,
                <div className="entity-content__plan four-col"
                  key="plan21">
                  <div className="entity-content__plan-content">
                    <h3 className="entity-content__plan-title">
                      plan2
                    </h3>
                    <ul className="entity-content__plan-price">
                      {[<li className="entity-content__plan-price-item"
                        key="price20">
                        <span className="entity-content__plan-price-amount">
                          price2
                        </span>
                        {undefined}
                      </li>]}
                    </ul>
                    <p className="entity-content__plan-description">
                      description2
                    </p>
                  </div>
                </div>,
                <div className="entity-content__plan four-col last-col"
                  key="plan32">
                  <div className="entity-content__plan-content">
                    <h3 className="entity-content__plan-title">
                      plan3
                    </h3>
                    <ul className="entity-content__plan-price">
                      <li className="entity-content__plan-price-item"
                        key="testprice30">
                        <span className="entity-content__plan-price-amount">
                          test
                        </span>
                        <span className="entity-content__plan-price-quantity">
                          / {'price3'}
                        </span>
                      </li>
                      <li className="entity-content__plan-price-item"
                        key="price3b1">
                        <span className="entity-content__plan-price-amount">
                          price3b
                        </span>
                        {undefined}
                      </li>
                    </ul>
                    <p className="entity-content__plan-description">
                      description3
                    </p>
                  </div>
                </div>
              ]}
            </div>
          </div>
        </div>
      </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can display loading plans', function() {
    mockEntity.set('options', null);
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        plans={null}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Spinner />);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can remove plans when none exist', function() {
    mockEntity.set('options', null);
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        hash="readme"
        plans={[]}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[1], undefined);
  });
});
