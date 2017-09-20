/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

const React = require('react');

class VanillaCard extends React.Component {
  _generateHeader() {
    if (this.props.headerContent) {
      return (<header className="p-card__header">
        {this.props.headerContent}
      </header>);
    }
  }

  _generateTitle() {
    if (this.props.title) {
      return (<h3 className="p-card__title">{this.props.title}</h3>);
    }
  }

  render() {
    return (
      <div className="p-card">
        {this._generateHeader()}
        {this._generateTitle()}
        <div className="p-card__content">{this.props.children}</div>
      </div>
    );
  }
}

VanillaCard.propTypes = {
  children: React.PropTypes.node,
  headerContent: React.PropTypes.node,
  title: React.PropTypes.node
};

module.exports = VanillaCard;
