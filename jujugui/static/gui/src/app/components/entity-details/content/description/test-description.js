/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityContentDescription = require('./description');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentDescription', function() {
  let marked = function(val) { return val; };
  let mockEntity;

  it('can render markdown in the description', () => {
    let mockEntity = jsTestUtils.makeEntity();
    const description = 'A simple [link](http://google.com/).';
    mockEntity.set('description', description);
    const output = jsTestUtils.shallowRender(
      <EntityContentDescription
        changeState={sinon.stub()}
        entityModel={mockEntity}
        renderMarkdown={marked} />);
    const markupObject = output.props.children[1].props.dangerouslySetInnerHTML;
    assert.equal(markupObject.__html, description);
  });

  describe('bundle', () => {
    beforeEach(function() {
      mockEntity = jsTestUtils.makeEntity(true);
    });

    afterEach(function() {
      mockEntity = undefined;
    });

    it('can render without description', () => {
      mockEntity.set('description', null);
      const output = jsTestUtils.shallowRender(
        <EntityContentDescription
          changeState={sinon.stub()}
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      assert.equal(output, null);
    });

    it('can render with a description', () => {
      const output = jsTestUtils.shallowRender(
        <EntityContentDescription
          changeState={sinon.stub()}
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      expect(output).toEqualJSX(
        <div className="entity-content__description">
          <div className="entity-content__description-content"
            dangerouslySetInnerHTML={{__html:'HA Django cluster.'}} />
        </div>
      );
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
      mockEntity.set('description', null);
      const output = jsTestUtils.shallowRender(
        <EntityContentDescription
          changeState={sinon.stub()}
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      assert.equal(output, null);
    });

    it('can render with a description', () => {

      const output = jsTestUtils.shallowRender(
        <EntityContentDescription
          changeState={sinon.stub()}
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      expect(output).toEqualJSX(
        <div className="entity-content__description">
          <div className="entity-content__description-content"
            dangerouslySetInnerHTML={{__html: 'Django framework.'}} />
        </div>
      );
    });
  });
});
