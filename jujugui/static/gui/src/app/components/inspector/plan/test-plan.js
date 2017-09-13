/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorPlan = require('./plan');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorPlan', () => {
  var acl;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render correctly with a selected plan', () => {
    var currentPlan = {
      description: 'best description ever',
      price: 'price/goes/here',
      url: 'canonical-landscape/24-7'
    };
    var output = jsTestUtils.shallowRender(
      <InspectorPlan
        acl={acl}
        changeState={sinon.stub()}
        currentPlan={currentPlan}
        service={{}} />);
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__details">
          <div className="inspector-plan__title">{currentPlan.url}</div>
          <div className="inspector-plan__price">{currentPlan.price}</div>
          <div className="inspector-plan__description">
            {currentPlan.description}
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render correctly without a selected plan', () => {
    var output = jsTestUtils.shallowRender(
      <InspectorPlan
        acl={acl}
        changeState={sinon.stub()}
        currentPlan={null}
        service={{}} />);
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__no-plan">
          You have no active plan
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

});
