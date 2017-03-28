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
    mockEntity.set('resources', [{resource: 'one'}]);
    const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl={apiUrl}
          changeState={changeState}
          entityModel={mockEntity}
          getFile={getFile}
          hasPlans={false}
          pluralize={pluralize}
          renderMarkdown={renderMarkdown} />, true);
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
        <div className="row row--grey entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <div className="intro"
                dangerouslySetInnerHTML={{__html: description}}/>
            </div>
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
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
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
    assert.deepEqual(output, expected);
  });

  it('can display a charm with actions', function() {
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl="http://example.com"
          changeState={sinon.stub()}
          entityModel={mockEntity}
          getFile={sinon.stub()}
          hasPlans={false}
          pluralize={sinon.stub()}
          renderMarkdown={sinon.stub()} />, true);
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
    assert.deepEqual(parent.props.children[0], expected);
  });

  it('can display a charm with no options', function() {
    mockEntity.set('options', null);
    const description = mockEntity.get('description');
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.stub().returns(description);
    const getFile = sinon.spy();
    const pluralize = sinon.spy();
    const changeState = sinon.spy();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={false}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="entity-content">
        <div className="row row--grey entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <div className="intro"
                dangerouslySetInnerHTML={{__html: description}}/>
            </div>
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
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
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
            </div>
          </div>
        </div>
        {undefined}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can display a bundle for Juju 2', function() {
    const apiUrl = 'http://example.com';
    const renderMarkdown = sinon.spy();
    const getFile = sinon.spy();
    const changeState = sinon.spy();
    const pluralize = sinon.spy();
    const mockEntity = jsTestUtils.makeEntity(true, null, false);
    const output = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl={apiUrl}
          changeState={changeState}
          entityModel={mockEntity}
          getFile={getFile}
          hasPlans={false}
          pluralize={pluralize}
          renderMarkdown={renderMarkdown} />);
    const expected = (
      <div className="entity-content">
        {undefined}
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
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
    assert.deepEqual(output, expected);
  });

  it('can display a bundle with actions', function() {
    mockEntity = jsTestUtils.makeEntity(true, null, false);
    mockEntity.set('bugUrl', 'http://example.com/bugs');
    mockEntity.set('homepage', 'http://example.com/');
    const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl="http://example.com"
          changeState={sinon.stub()}
          entityModel={mockEntity}
          getFile={sinon.stub()}
          hasPlans={false}
          pluralize={sinon.stub()}
          renderMarkdown={sinon.stub()} />, true);
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
    assert.deepEqual(parent.props.children[0], expected);
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
          apiUrl={apiUrl}
          changeState={changeState}
          entityModel={mockEntity}
          getFile={getFile}
          hasPlans={false}
          pluralize={pluralize}
          renderMarkdown={renderMarkdown} />, true);
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
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        plans={plans}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown} />, true);
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
    assert.deepEqual(output.props.children[1], expected);
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
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        plans={null}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Spinner />);
    assert.deepEqual(output.props.children[1], expected);
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
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        hasPlans={true}
        plans={[]}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown} />, true);
    const output = renderer.getRenderOutput();
    const expected = (undefined);
    assert.deepEqual(output.props.children[1], expected);
  });

  it('can render markdown in the description', function() {
    // Note that this functional test is just a sanity check, not a
    // comprehensive test of the markdown syntax.
    mockEntity.set('description', 'A simple [link](http://google.com/).');
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        apiUrl='http://example.com'
        changeState={sinon.stub()}
        entityModel={mockEntity}
        getFile={sinon.stub()}
        hasPlans={false}
        pluralize={sinon.stub()}
        renderMarkdown={marked} />);
    const description = output.props.children[0].props.children.props
      .children[0].props.children;
    const markupObject = description.props.dangerouslySetInnerHTML;
    assert.equal(markupObject.__html,
      '<p>A simple <a href="http://google.com/">link</a>.</p>\n');
  });
});
