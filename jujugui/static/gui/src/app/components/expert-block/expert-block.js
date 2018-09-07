'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

const ExpertBlock = props => (
  <div className={classNames('expert-block', props.classes)}>
    <div className="expert-block__top-title">
      {props.title}
    </div>
    {props.children}
  </div>);

ExpertBlock.propTypes = {
  children: PropTypes.any.isRequired,
  classes: PropTypes.array,
  title: PropTypes.string.isRequired
};

module.exports = ExpertBlock;
