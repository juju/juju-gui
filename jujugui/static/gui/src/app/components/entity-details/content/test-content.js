/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const CopyToClipboard = require('../../copy-to-clipboard/copy-to-clipboard');
const EntityContent = require('./content');
const EntityContentConfigOption = require('./config-option/config-option');
const EntityContentDescription = require('./description/description');
const EntityContentReadme = require('./readme/readme');
const EntityContentRelations = require('./relations/relations');
const EntityFiles = require('./files/files');
const EntityResources = require('./resources/resources');
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
    '<div class="juju-card" ' + dataDD + ' data-id="' + id + '"></div>';
}

describe('EntityContent', function() {
  let charmstore, mockEntity;

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContent
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      charmstore={options.charmstore || charmstore}
      clearLightbox={options.clearLightbox || sinon.stub()}
      displayLightbox={options.displayLightbox || sinon.stub()}
      entityModel={options.entityModel || mockEntity}
      flags={options.flags}
      hash={options.hash || 'readme'}
      hasPlans={options.hasPlans === undefined ? false : options.hasPlans}
      plans={options.plans}
      scrollCharmbrowser={options.scrollCharmbrowser || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      showTerms={options.showTerms || sinon.stub()}
      staticURL={options.staticURL || 'http://example.com'} />
  );

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
    charmstore = {
      getDiagramURL: sinon.stub().returns('testRef'),
      getFile: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      url: 'http://example.com'
    };
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can display a charm', function() {
    const description = mockEntity.get('description');
    const script = generateScript();
    mockEntity.set('resources', [{resource: 'one'}]);
    const wrapper = renderComponent();
    const expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              <EntityContentDescription
                changeState={sinon.stub()}
                description={description}
                includeHeading={true} />
              <div className="entity-content__terms">
                <div className="entity-content__metadata">
                  <h4 className="entity-content__metadata-title">
                    Tags:
                  </h4>&nbsp;
                  <a
                    className="link link--cold"
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
                scrollCharmbrowser={sinon.stub()} />
              <div
                className="entity-content__configuration"
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
                    <a
                      className="link link--cold"
                      href="https://bugs.launchpad.net/charms/+source/django"
                      target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  {undefined}
                </ul>
              </div>
              <EntityResources
                apiUrl={charmstore.url}
                entityId={mockEntity.get('id')}
                resources={[{resource: 'one'}]} />
              <EntityContentRelations
                changeState={sinon.stub()}
                relations={mockEntity.get('relations')} />
              <EntityFiles
                apiUrl={charmstore.url}
                entityModel={mockEntity} />
              <div className="entity-content__card section clearfix">
                <h3 className="section__title">
                  Embed this charm
                </h3>
                <p>
                  Add this card to your website by copying the code below.&nbsp;
                  <a
                    className="entity-content__card-cta"
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
        <a
          className="link link--cold"
          key="terms1"
          onClick={links.at(0).prop('onClick')}>
          terms1
        </a>{', '}
        <a
          className="link link--cold"
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
            <a
              className="link link--cold"
              href="http://example.com/bugs"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li className="section__list-item">
            <a
              className="link link--cold"
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
    const wrapper = renderComponent({
      entityModel: jsTestUtils.makeEntity(true)
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can display a bundle with actions', function() {
    mockEntity = jsTestUtils.makeEntity(true);
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
            <a
              className="link link--cold"
              href="http://example.com/bugs"
              target="_blank">
              Submit a bug
            </a>
          </li>
          <li className="section__list-item">
            <a
              className="link link--cold"
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
    expect(wrapper).toMatchSnapshot();
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
