/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Popup = require('../popup/popup');
const Spinner = require('../spinner/spinner');
const TermsPopup = require('./terms-popup');

const jsTestUtils = require('../../utils/component-test-utils');

describe('TermsPopup', function() {

  it('can render', function() {
    const close = sinon.stub();
    const terms = [
      {content: 'Landscape terms.', name: 'landscape'},
      {content: 'Apache2 terms.', name: 'apache2'}
    ];
    const renderer = jsTestUtils.shallowRender(
      <TermsPopup
        close={close}
        terms={terms} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Popup
        close={close}
        type="wide">
        <div className="terms-popup__container">
          <ul className="terms-popup__terms">
            <li key="landscape">
              <pre>
                Landscape terms.
              </pre>
            </li>
            <li key="apache2">
              <pre>
                Apache2 terms.
              </pre>
            </li>
          </ul>
        </div>
      </Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <TermsPopup
        close={sinon.stub()}
        terms={[]} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Popup
        close={close}
        type="wide">
        <Spinner />
      </Popup>);
    expect(output).toEqualJSX(expected);
  });

  it('can close the popup', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <TermsPopup
        close={close}
        terms={[]} />, true);
    const output = renderer.getRenderOutput();
    output.props.close();
    assert.equal(close.callCount, 1);
  });
});
