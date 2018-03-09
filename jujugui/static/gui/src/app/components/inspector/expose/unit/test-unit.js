/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorExposeUnit = require('./unit');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('InspectorExposeUnit', function() {

  it('can render the unit', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      public_address: '20.20.20.199'
    };
    var action = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <InspectorExposeUnit
        action={action}
        unit={unit} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className="inspector-expose__unit" data-id="django/1" onClick={action}
        role="button"
        tabIndex="0">
        <div className="inspector-expose__unit-detail">
              django/1
        </div>
        <ul className="inspector-expose__unit-list">
          <li className="inspector-expose__item"
            key="20.20.20.199:9000-10000/udp">
            <span>{'20.20.20.199:9000-10000/udp'}</span>
          </li>
          <li className="inspector-expose__item"
            key="https://20.20.20.199:443">
            <a href="https://20.20.20.199:443"
              onClick={instance._stopBubble}
              target="_blank">
              {'20.20.20.199:443'}
            </a>
          </li>
          <li className="inspector-expose__item"
            key="http://20.20.20.199:8080">
            <a href="http://20.20.20.199:8080"
              onClick={instance._stopBubble}
              target="_blank">
              {'20.20.20.199:8080'}
            </a>
          </li>
        </ul>
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can render the unit without a public address', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1'
    };
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <InspectorExposeUnit
        action={action}
        unit={unit} />);
    var expected = (
      <li className="inspector-expose__unit"
        data-id="django/1"
        onClick={action}
        role="button"
        tabIndex="0">
        <div className="inspector-expose__unit-detail">
              django/1
        </div>
        <div className="inspector-expose__unit-detail">
              No public address
        </div>
      </li>);
    expect(output).toEqualJSX(expected);
  });
});
