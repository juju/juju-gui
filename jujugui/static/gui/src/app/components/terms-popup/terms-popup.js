/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../spinner/spinner');
const Popup = require('../popup/popup');

class TermsPopup extends React.Component {
  render() {
    let content;
    const terms = this.props.terms;
    if (terms.length === 0) {
      content = <Spinner />;
    } else {
      const termsList = terms.map(term => {
        return (
          <li key={term.name}>
            <pre>{term.content}</pre>
          </li>
        );
      });
      content = (
        <div className="terms-popup__container">
          <ul className="terms-popup__terms">
            {termsList}
          </ul>
        </div>);
    }
    return (
      <Popup
        close={this.props.close}
        type="wide">
        {content}
      </Popup>);
  }
};

TermsPopup.propTypes = {
  close: PropTypes.func.isRequired,
  terms: PropTypes.array.isRequired
};

module.exports = TermsPopup;
