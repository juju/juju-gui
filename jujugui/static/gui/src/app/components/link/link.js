/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

/**
  A component to anchors that correctly change state.
*/
class Link extends React.Component {
  /**
    Change the internale state.
    @param state {String} The new state to update to.
    @param evt {Object} The click event.
  */
  _handleRowClick(state, evt) {
    evt.preventDefault();
    this.props.changeState(state);
  }

  render() {
    const classes = classNames(this.props.classes, 'link');
    const clickState = this.props.clickState;
    // By providing both a href and an onClick method it handles
    // both changing the internal state (without refreshing the gui) and
    // right-click-open-in-new-tab cases.
    return (
      <a className={classes}
        href={this.props.generatePath(clickState)}
        onClick={this._handleRowClick.bind(this, clickState)}>
        {this.props.children}
      </a>
    );
  }
};

Link.propTypes = {
  changeState: PropTypes.func.isRequired,
  children: PropTypes.any.isRequired,
  classes: PropTypes.array,
  clickState: PropTypes.object.isRequired,
  generatePath: PropTypes.func.isRequired
};

Link.defaultProps = {
  classes: []
};

module.exports = Link;
