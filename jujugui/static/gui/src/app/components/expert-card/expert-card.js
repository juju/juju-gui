/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

class ExpertCard extends React.Component {
  render() {
    const { expert } = this.props;
    const logo = `${this.props.staticURL}/static/gui/build/app/assets/images/` +
      `non-sprites/experts/${expert.logo}`;
    const classes = classNames('expert-card', this.props.classes);
    return (
      <div className={classes}>
        <div className="expert-card__top-title">
          Juju expert partners
        </div>
        <div className="expert-card__logo">
          <img alt={expert.logo}
            className="expert-card__logo-image"
            src={logo} />
        </div>
        {this.props.children}
      </div>
    );
  }
};

ExpertCard.propTypes = {
  children: PropTypes.any.isRequired,
  classes: PropTypes.array,
  expert: PropTypes.object.isRequired,
  staticURL: PropTypes.string
};

module.exports = ExpertCard;
