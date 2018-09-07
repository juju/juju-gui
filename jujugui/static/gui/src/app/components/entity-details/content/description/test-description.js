'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentDescription = require('./description');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentDescription', function() {
  let mockEntity;

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContentDescription
      changeState={options.changeState || sinon.stub()}
      description={options.description || mockEntity.get('description')}
      includeHeading={options.includeHeading} />
  );

  it('can render markdown in the description', () => {
    const description = 'A simple [link](http://google.com/).';
    const wrapper = renderComponent({ description });
    assert.deepEqual(
      wrapper.find('.entity-content__description-content').prop('dangerouslySetInnerHTML'),
      { __html: '<p>A simple <a href="http://google.com/">link</a>.</p>\n' });
  });

  describe('bundle', () => {
    beforeEach(function() {
      mockEntity = jsTestUtils.makeEntity(true);
    });

    afterEach(function() {
      mockEntity = undefined;
    });

    it('can render without description', () => {
      const wrapper = renderComponent({ description: null });
      assert.equal(wrapper.text(), false);
    });

    it('can render with a description', () => {
      const wrapper = renderComponent();
      const expected = (
        <div className="entity-content__description">
          <div className="entity-content__description-content"
            dangerouslySetInnerHTML={{__html: 'HA Django cluster.'}} />
        </div>
      );
      assert.compareJSX(wrapper, expected);
    });
  });

  describe('charm', () => {
    beforeEach(function() {
      mockEntity = jsTestUtils.makeEntity();
    });

    afterEach(function() {
      mockEntity = undefined;
    });

    it('can render without description', () => {
      const wrapper = renderComponent({ description: null });
      assert.equal(wrapper.text(), false);
    });

    it('can render with a description', () => {
      const wrapper = renderComponent();
      const expected = (
        <div className="entity-content__description">
          <div className="entity-content__description-content"
            dangerouslySetInnerHTML={{__html: 'Django framework.'}} />
        </div>
      );
      assert.compareJSX(wrapper, expected);
    });
  });
});
