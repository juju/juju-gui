/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');
/*
  This component can be used to add in-page links to ids e.g. it could be used
  within a readme heading to link to .../#readme.
 */
class HashLink extends React.Component {
  /**
    Update the hash state.
  */
  _handleClick() {
    this.props.changeState({hash: this.props.hash});
  }

  render() {
    return (
      <div className="hash-link"
        onClick={this._handleClick.bind(this)}>
        <SvgIcon
          name="anchor_16"
          size="16" />
      </div>
    );
  }
};

HashLink.propTypes = {
  changeState: PropTypes.func.isRequired,
  hash: PropTypes.string.isRequired
};

module.exports = HashLink;
