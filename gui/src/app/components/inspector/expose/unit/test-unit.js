/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorExposeUnit = require('./unit');

describe('InspectorExposeUnit', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorExposeUnit
      action={options.action || sinon.stub()}
      unit={options.unit} />
  );

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
    const wrapper = renderComponent({unit});
    var expected = (
      <li
        className="inspector-expose__unit"
        data-id="django/1"
        onClick={sinon.stub()}
        role="button"
        tabIndex="0">
        <div className="inspector-expose__unit-detail">
              django/1
        </div>
        <ul className="inspector-expose__unit-list">
          <li
            className="inspector-expose__item"
            key="20.20.20.199:9000-10000/udp">
            <span>{'20.20.20.199:9000-10000/udp'}</span>
          </li>
          <li
            className="inspector-expose__item"
            key="https://20.20.20.199:443">
            <a
              href="https://20.20.20.199:443"
              onClick={wrapper.find('a').at(0).prop('onClick')}
              target="_blank">
              {'20.20.20.199:443'}
            </a>
          </li>
          <li
            className="inspector-expose__item"
            key="http://20.20.20.199:8080">
            <a
              href="http://20.20.20.199:8080"
              onClick={wrapper.find('a').at(1).prop('onClick')}
              target="_blank">
              {'20.20.20.199:8080'}
            </a>
          </li>
        </ul>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render the unit without a public address', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1'
    };
    const wrapper = renderComponent({unit});
    assert.equal(
      wrapper.find('.inspector-expose__unit-detail').at(1).text(),
      'No public address');
  });
});
