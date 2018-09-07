'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ExpertBlock = require('../expert-block/expert-block');

class ExpertCard extends React.Component {
  render() {
    const { expert } = this.props;
    const logo = `${this.props.staticURL}/static/gui/build/app/assets/images/` +
      `non-sprites/experts/${expert.logo}`;
    return (
      <ExpertBlock
        classes={this.props.classes}
        title="Juju expert partners">
        <div className="expert-card__logo">
          <img alt={expert.logo}
            className="expert-card__logo-image"
            src={logo} />
        </div>
        {this.props.children}
      </ExpertBlock>
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
