/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

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

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContent
      addNotification={options.addNotification || sinon.stub()}
      apiUrl={options.apiUrl || 'http://example.com'}
      changeState={options.changeState || sinon.stub()}
      clearLightbox={options.clearLightbox || sinon.stub()}
      displayLightbox={options.displayLightbox || sinon.stub()}
      entityModel={options.entityModel || mockEntity}
      flags={options.flags}
      getDiagramURL={options.getDiagramURL || sinon.stub()}
      getFile={options.getFile || sinon.stub()}
      hash={options.hash || 'readme'}
      hasPlans={options.hasPlans === undefined ? false : options.hasPlans}
      plans={options.plans}
      pluralize={options.pluralize || sinon.stub()}
      renderMarkdown={options.renderMarkdown || sinon.stub()}
      scrollCharmbrowser={options.scrollCharmbrowser || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      staticURL={options.staticURL || 'http://example.com'} />
  );

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
    const script = generateScript();
    mockEntity.set('resources', [{resource: 'one'}]);
    const wrapper = renderComponent({
      renderMarkdown
    });
    const expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={sinon.stub()}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={sinon.stub()} />
              <div className="entity-content__terms">
                <div className="entity-content__metadata">
                  <h4 className="entity-content__metadata-title">
                    Tags:
                  </h4>&nbsp;
                  <a className="link"
                    data-id="database"
                    onClick={wrapper.find('.link').at(0).prop('onClick')}>
                    database
                  </a>
                </div>
              </div>
              <EntityContentReadme
                addNotification={sinon.stub()}
                changeState={sinon.stub()}
                entityModel={mockEntity}
                getFile={sinon.stub()}
                hash="readme"
                renderMarkdown={renderMarkdown}
                scrollCharmbrowser={sinon.stub()} />
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
              <div className="section section__contribute">
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
                pluralize={sinon.stub()}
                resources={[{resource: 'one'}]} />
              <EntityContentRelations
                changeState={sinon.stub()}
                relations={mockEntity.get('relations')} />
              <EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={sinon.stub()} />
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
    assert.compareJSX(wrapper, expected);
  });

  it('can display a direct deploy card', function() {
    const wrapper = renderComponent({
      flags: {'test.ddeploy': true}
    });
    assert.equal(wrapper.find('.juju-card').prop('data-dd'), true);
    assert.equal(
      wrapper.find('.copy-to-clipboard').prop('value').includes('data-dd'),
      true);
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
    const wrapper = renderComponent({
      showTerms
    });
    const terms = wrapper.find('.entity-content__metadata').at(1);
    const links = terms.find('.link');
    const expected = (
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Terms:</h4>&nbsp;
        <a className="link"
          key="terms1"
          onClick={links.at(0).prop('onClick')}>
            terms1
        </a>{', '}
        <a className="link"
          key="terms2"
          onClick={links.at(1).prop('onClick')}>
            terms2
        </a>
      </div>);
    assert.compareJSX(terms, expected);
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
    const wrapper = renderComponent({
      showTerms
    });
    wrapper.find('.entity-content__metadata').at(1).find('.link').at(1).simulate('click');
    wrapper.update();
    const popup = wrapper.find('TermsPopup');
    assert.equal(popup.length, 1);
    assert.deepEqual(popup.prop('terms'), [{
      name: 'terms2',
      revision: 10
    }]);
  });

  it('can display a spinner when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub();
    showTerms.onFirstCall();
    const wrapper = renderComponent({
      showTerms
    });
    const expected = (
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Terms:</h4>&nbsp;
        <Spinner />
      </div>);
    assert.compareJSX(wrapper.find('.entity-content__metadata').at(1), expected);
  });

  it('can handle errors when loading terms', function() {
    mockEntity.set('terms', ['term1', 'term2']);
    const showTerms = sinon.stub().onFirstCall().callsArgWith(2, 'Uh oh', null);
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      showTerms
    });
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
    const wrapper = renderComponent({
      showTerms
    });
    wrapper.unmount();
    assert.equal(abort.callCount, 2);
  });

  it('can display a charm with actions', function() {
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const wrapper = renderComponent();
    const expected = (
      <div className="section section__contribute">
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
    assert.compareJSX(wrapper.find('.section__contribute'), expected);
  });

  it('can display a charm with no options', function() {
    mockEntity.set('options', null);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.entity-content__configuration').length, 0);
  });

  it('can display a bundle for Juju 2', function() {
    const apiUrl = 'http://example.com';
    const getDiagramURL = sinon.stub().returns('testRef');
    const mockEntity = jsTestUtils.makeEntity(true);
    const script = generateScript(true);
    const wrapper = renderComponent({
      entityModel: mockEntity,
      getDiagramURL
    });
    const expected = (
      <div className="entity-content">
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={sinon.stub()}
                entityModel={mockEntity}
                includeHeading={true}
                renderMarkdown={sinon.stub()} />
              <EntityContentDiagram
                clearLightbox={sinon.stub()}
                diagramUrl="testRef"
                displayLightbox={sinon.stub()}
                isExpandable={true}
                isRow={false}
                title="django cluster" />
              <EntityContentReadme
                addNotification={sinon.stub()}
                changeState={sinon.stub()}
                entityModel={mockEntity}
                getFile={sinon.stub()}
                hash="readme"
                renderMarkdown={sinon.stub()}
                scrollCharmbrowser={sinon.stub()} />
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
                          <p><undefined /></p>
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
              <div className="section section__contribute">
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
                pluralize={sinon.stub()} />
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
    assert.compareJSX(wrapper, expected);
  });

  it('can display a bundle with actions', function() {
    mockEntity = jsTestUtils.makeEntity(true);
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const wrapper = renderComponent({
      getDiagramURL: sinon.stub().returns('testRef')
    });
    const expected = (
      <div className="section section__contribute">
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
    assert.compareJSX(wrapper.find('.section__contribute'), expected);
  });

  it('doesn\'t show relations when they don\'t exist', function() {
    mockEntity.set('relations', {requires: {}, provides: {}});
    const wrapper = renderComponent();
    assert.equal(wrapper.find('EntityContentRelations').length, 0);
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
    const wrapper = renderComponent({
      hasPlans: true,
      plans
    });
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
    assert.compareJSX(wrapper.find('.entity-content__plans'), expected);
  });

  it('can display loading plans', function() {
    mockEntity.set('options', null);
    const wrapper = renderComponent({
      hasPlans: true,
      plans: null
    });
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can remove plans when none exist', function() {
    mockEntity.set('options', null);
    const wrapper = renderComponent({
      hasPlans: true,
      plans: []
    });
    assert.equal(wrapper.find('.entity-content__plans').length, 0);
  });

  it('can display an expert card for a bundle', () => {
    mockEntity = jsTestUtils.makeEntity(true);
    const wrapper = renderComponent({
      getDiagramURL: sinon.stub().returns('testRef'),
      entityModel: mockEntity
    });
    const card = wrapper.find('ExpertContactCard');
    assert.equal(card.length, 1);
    assert.equal(card.prop('expert'), 'test-owner');
  });

  it('can display an expert card for a charm with plans', () => {
    const wrapper = renderComponent({
      hasPlans: true
    });
    const card = wrapper.find('ExpertContactCard');
    assert.equal(card.length, 1);
    assert.equal(card.prop('expert'), 'test-owner');
  });

  it('does not display an expert card for a charm with no plans', () => {
    const wrapper = renderComponent({
      hasPlans: false
    });
    assert.equal(wrapper.find('ExpertContactCard').length, 0);
  });
});
