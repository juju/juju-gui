/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AccordionSection = require('../../accordion-section/accordion-section');
const CopyToClipboard = require('../../copy-to-clipboard/copy-to-clipboard');
const EntityContent = require('./content');
const EntityContentConfigOption = require('./config-option/config-option');
const EntityContentDescription = require('./description/description');
const EntityContentDiagram = require('./diagram/diagram');
const EntityContentReadme = require('./readme/readme');
const EntityContentRelations = require('./relations/relations');
const EntityFiles = require('./files/files');
const EntityResources = require('./resources/resources');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const Spinner = require('../../spinner/spinner');
const TermsPopup = require('../../terms-popup/terms-popup');

const jsTestUtils = require('../../../utils/component-test-utils');

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
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const pluralize = sinon.spy();
    const script = generateScript();
    const scrollCharmbrowser = sinon.stub();
    const addNotification = sinon.stub();
    mockEntity.set('resources', [{resource: 'one'}]);
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        displayLightbox={displayLightbox}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hash="readme"
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <div className="entity-content__terms">
                <div className="entity-content__metadata">
                  <h4 className="entity-content__metadata-title">
                    Tags:
                  </h4>
                  <a className="link"
                    data-id="database"
                    onClick={instance._handleTagClick}>database</a>
                </div>
              </div>
              <EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
              <div className="entity-content__configuration"
                id="configuration">
                <h3 className="entity-content__header">
                  Configuration
                </h3>
                <dl>
                  <EntityContentConfigOption
                    option={{
                      default: 'spinach',
                      description: 'Your username',
                      name: 'username',
                      type: 'string'
                    }} />
                  <EntityContentConfigOption
                    option={{
                      default: 'abc123',
                      description: 'Your password',
                      name: 'password',
                      type: 'string'
                    }} />
                </dl>
              </div>
            </div>
            <div className="four-col last-col">
              {null}
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__list">
                  <li className="section__list-item">
                    <a className="link"
                      href="https://bugs.launchpad.net/charms/+source/django"
                      target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  {undefined}
                </ul>
              </div>
              <EntityResources
                apiUrl={apiUrl}
                entityId={mockEntity.get('id')}
                pluralize={pluralize}
                resources={[{resource: 'one'}]} />
              <EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
              <EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>
                  Add this card to your website by copying the code below.&nbsp;
                  <a className="entity-content__card-cta"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <CopyToClipboard
                  className="copy-to-clipboard"
                  value={script} />
                <h4>Preview</h4>
                <div className="juju-card" data-id="trusty/django-123"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can display a direct deploy card', function() {
    const output = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        flags={{'test.ddeploy': true}}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />);
    const innerWrapper = output.props.children[0].props.children;
    const cardWrapper = innerWrapper.props.children[1].props.children[5];
    const script = cardWrapper.props.children[2];
    const card = cardWrapper.props.children[4];
    const expected = (
      <div className="juju-card" data-dd data-id="trusty/django-123"></div>);
    const scriptExpected = (
      <CopyToClipboard
        className="copy-to-clipboard"
        value={script.props.value} />
    );
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
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const terms = innerWrapper
      .props.children[0].props.children[2].props.children[1];
    const links = [terms.props.children[2][0][1], terms.props.children[2][1][1]];
    const expected = (
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Terms:</h4>&nbsp;
        <a className="link"
          key="terms1"
          onClick={links[0].props.onClick}>
            terms1
        </a>,
        <a className="link"
          key="terms2"
          onClick={links[1].props.onClick}>
            terms2
        </a>
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
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const terms = innerWrapper
      .props.children[0].props.children[2].props.children[1];
    terms.props.children[2][1][1].props.onClick();
    output = renderer.getRenderOutput();
    const expected = (
      <TermsPopup
        close={instance._toggleTerms}
        terms={[{
          name: 'terms2',
          revision: 10
        }]} />);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can display a spinner when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub();
    showTerms.onFirstCall();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Terms:</h4>&nbsp;
        <Spinner />
      </div>);
    const innerWrapper = output.props.children[0].props.children;
    const terms = innerWrapper
      .props.children[0].props.children[2].props.children[1];
    expect(terms).toEqualJSX(expected);
  });

  it('can handle errors when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub().onFirstCall().callsArgWith(2, 'Uh oh', null);
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={addNotification}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
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
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={showTerms}
        staticURL="http://example.com" />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 2);
  });

  it('can display a charm with actions', function() {
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="section">
        <h3 className="section__title">
          Contribute
        </h3>
        <ul className="section__list">
          <li className="section__list-item">
            <a className="link"
              href="http://example.com/bugs"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li className="section__list-item">
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Project homepage
            </a>
          </li>
        </ul>
      </div>);
    const innerWrapper = output.props.children[0].props.children;
    const contribute = innerWrapper.props.children[1].props.children[1];
    expect(contribute).toEqualJSX(expected);
  });

  it('can display a charm with no options', function() {
    mockEntity.set('options', null);
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
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
      <EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        displayLightbox={displayLightbox}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hash="readme"
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <div className="entity-content__terms">
                <div className="entity-content__metadata">
                  <h4 className="entity-content__metadata-title">
                    Tags:
                  </h4>&nbsp;
                  <a className="link" data-id="database"
                    onClick={instance._handleTagClick}>database</a>
                </div>
              </div>
              <EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
            </div>
            <div className="four-col last-col">
              {null}
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__list">
                  <li className="section__list-item">
                    <a className="link"
                      href="https://bugs.launchpad.net/charms/+source/django"
                      target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  {undefined}
                </ul>
              </div>
              <EntityResources
                apiUrl={apiUrl}
                entityId={mockEntity.get('id')}
                pluralize={pluralize}
                resources={undefined} />
              <EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
              <EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>
                  Add this card to your website by copying the code below.&nbsp;
                  <a className="entity-content__card-cta"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <CopyToClipboard
                  className="copy-to-clipboard"
                  value={script} />
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
    const getDiagramURL = sinon.stub().returns('testRef');
    const changeState = sinon.spy();
    const clearLightbox = sinon.stub();
    const displayLightbox = sinon.stub();
    const pluralize = sinon.spy();
    const mockEntity = jsTestUtils.makeEntity(true);
    const script = generateScript(true);
    const scrollCharmbrowser = sinon.stub();
    const addNotification = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={addNotification}
        apiUrl={apiUrl}
        changeState={changeState}
        clearLightbox={clearLightbox}
        displayLightbox={displayLightbox}
        entityModel={mockEntity}
        getDiagramURL={getDiagramURL}
        getFile={getFile}
        hash="readme"
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={scrollCharmbrowser}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />);
    const expected = (
      <div className="entity-content">
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={changeState}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={renderMarkdown} />
              <EntityContentDiagram
                clearLightbox={clearLightbox}
                diagramUrl="testRef"
                displayLightbox={displayLightbox}
                isExpandable={true}
                title="django cluster" />
              <EntityContentReadme
                addNotification={addNotification}
                changeState={changeState}
                entityModel={mockEntity}
                getFile={getFile}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={scrollCharmbrowser} />
              <div className="entity-content__configuration"
                id="configuration">
                <h3 className="entity-content__header">
                  Bundle configuration
                </h3>
                <div>
                  <AccordionSection
                    title={<span>
                      <img alt="gunicorn"
                        className="entity-content__config-image"
                        src={undefined} width="26" />
                      gunicorn
                    </span>}>
                    <div className="entity-content__config-description">
                      <div className="entity-content__config-option">
                        <dt className="entity-content__config-name">
                          name
                        </dt>
                        <dd className="entity-content__config-description">
                          <p>title</p>
                        </dd>
                      </div>
                      <div className="entity-content__config-option">
                        <dt className="entity-content__config-name">
                          active
                        </dt>
                        <dd className="entity-content__config-description">
                          <p />
                        </dd>
                      </div>
                    </div>
                  </AccordionSection>
                  <AccordionSection
                    title={<span>
                      <img alt="django"
                        className="entity-content__config-image"
                        src={undefined} width="26" />
                      django
                    </span>} />
                </div>
              </div>
            </div>
            <div className="four-col last-col">
              <ExpertContactCard
                expert="test-owner"
                sendAnalytics={sinon.stub()}
                staticURL="http://example.com" />
              <div className="section">
                <h3 className="section__title">
                  Contribute
                </h3>
                <ul className="section__list">
                  {undefined}
                  <li className="section__list-item">
                    <a className="link"
                      href={'https://code.launchpad.net/~charmers/charms/' +
                      'bundles/django-cluster/bundle'}
                      target="_blank">
                      Project homepage
                    </a>
                  </li>
                </ul>
              </div>
              {undefined}
              {undefined}
              <EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>
                  Add this card to your website by copying the code below.&nbsp;
                  <a className="entity-content__card-cta"
                    href="https://jujucharms.com/community/cards"
                    target="_blank">
                    Learn more
                  </a>.
                </p>
                <CopyToClipboard
                  className="copy-to-clipboard"
                  value={script} />
                <h4>Preview</h4>
                <div className="juju-card" data-id="django-cluster"></div>
              </div>
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
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub().returns('testRef')}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="section">
        <h3 className="section__title">
          Contribute
        </h3>
        <ul className="section__list">
          <li className="section__list-item">
            <a className="link"
              href="http://example.com/bugs"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li className="section__list-item">
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Project homepage
            </a>
          </li>
        </ul>
      </div>);
    const innerWrapper = output.props.children[0].props.children;
    const parent = innerWrapper.props.children[1];
    expect(parent.props.children[1]).toEqualJSX(expected);
  });

  it('doesn\'t show relations when they don\'t exist', function() {
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const changeState = sinon.spy();
    const pluralize = sinon.spy();
    mockEntity.set('relations', {requires: {}, provides: {}});
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const relationsComponent = innerWrapper.props.children[1].props.children[3];
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
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hasPlans={true}
        plans={plans}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const plansOutput = innerWrapper.props.children[0].props.children[3];
    const expected = (
      <div className="row entity-content__plans"
        id="plans">
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
    expect(plansOutput).toEqualJSX(expected);
  });

  it('can display loading plans', function() {
    mockEntity.set('options', null);
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hasPlans={true}
        plans={null}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const plansOutput = innerWrapper.props.children[0].props.children[3];
    const expected = (
      <Spinner />);
    expect(plansOutput).toEqualJSX(expected);
  });

  it('can remove plans when none exist', function() {
    mockEntity.set('options', null);
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub()}
        getFile={getFile}
        hash="readme"
        hasPlans={true}
        plans={[]}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const plansOutput = innerWrapper.props.children[0].props.children[3];
    assert.strictEqual(plansOutput, undefined);
  });

  it('can display an expert card for a bundle', () => {
    mockEntity = jsTestUtils.makeEntity(true);
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub().returns('testRef')}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <ExpertContactCard
        expert="test-owner"
        sendAnalytics={sinon.stub()}
        staticURL="http://example.com" />);
    const innerWrapper = output.props.children[0].props.children;
    const parent = innerWrapper.props.children[1];
    expect(parent.props.children[0]).toEqualJSX(expected);
  });

  it('can display an expert card for a charm with plans', () => {
    mockEntity = jsTestUtils.makeEntity();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub().returns('testRef')}
        getFile={sinon.stub()}
        hasPlans={true}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <ExpertContactCard
        expert="test-owner"
        sendAnalytics={sinon.stub()}
        staticURL="http://example.com" />);
    const innerWrapper = output.props.children[0].props.children;
    const parent = innerWrapper.props.children[1];
    expect(parent.props.children[0]).toEqualJSX(expected);
  });

  it('does not display an expert card for a charm with no plans', () => {
    mockEntity = jsTestUtils.makeEntity();
    const renderer = jsTestUtils.shallowRender(
      <EntityContent
        addNotification={sinon.stub()}
        apiUrl="http://example.com"
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getDiagramURL={sinon.stub().returns('testRef')}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={sinon.stub()}
        scrollCharmbrowser={sinon.stub()}
        sendAnalytics={sinon.stub()}
        showTerms={sinon.stub()}
        staticURL="http://example.com" />, true);
    const output = renderer.getRenderOutput();
    const innerWrapper = output.props.children[0].props.children;
    const parent = innerWrapper.props.children[1];
    assert.strictEqual(parent.props.children[0], null);
  });
});
