/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../../svg-icon/svg-icon');

class EntityContentDiagram extends React.PureComponent {
  /**
    If expandable, open image in lightbox.
  */
  _handleExpand() {
    this.props.displayLightbox(
      <object data={this.props.diagramUrl} type="image/svg+xml" />,
      this.props.title
    );
  }

  /**
    If expandable, generate the expand button with icon.

    @return {Button} The expand button.
  */
  _generateExpandButton() {
    if (this.props.isExpandable) {
      return (
        <button
          className="entity-content__diagram-expand"
          onClick={this._handleExpand.bind(this)}
          role="button">
          <SvgIcon name="fullscreen-grey_16" size="12" />
        </button>
      );
    }
    return null;
  }

  render() {
    const classes = classNames(
      'entity-content__diagram',
      {'row row--grey': this.props.isRow}
    );
    return (
      <div className={classes}>
        <object className="entity-content__diagram-image" data={this.props.diagramUrl}
          title={this.props.title}
          type="image/svg+xml" />
        {this._generateExpandButton()}
      </div>
    );
  }
};

EntityContentDiagram.propTypes = {
  clearLightbox: PropTypes.func,
  diagramUrl: PropTypes.string.isRequired,
  displayLightbox: PropTypes.func,
  isExpandable: PropTypes.bool,
  isRow: PropTypes.bool,
  title: PropTypes.string
};

module.exports = EntityContentDiagram;
