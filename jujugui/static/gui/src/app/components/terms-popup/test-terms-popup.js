/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Popup = require('../popup/popup');
const TermsPopup = require('./terms-popup');

describe('TermsPopup', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <TermsPopup
      close={options.close || sinon.stub()}
      terms={options.terms || [
        {content: 'Landscape terms.', name: 'landscape'},
        {content: 'Apache2 terms.', name: 'apache2'}
      ]} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div>
        <Popup
          close={sinon.stub()}
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
        </Popup>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display the loading spinner', function() {
    const wrapper = renderComponent({ terms: [] });
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can close the popup', function() {
    const close = sinon.stub();
    const wrapper = renderComponent({ close });
    wrapper.find('Popup').props().close();
    assert.equal(close.callCount, 1);
  });
});
