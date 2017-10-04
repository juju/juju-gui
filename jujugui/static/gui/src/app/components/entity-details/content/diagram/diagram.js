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
      <object type="image/svg+xml" data={this.props.diagramUrl} />,
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
        <button role="button" className="entity-content__diagram-expand"
          onClick={this._handleExpand.bind(this)}>
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
        <object type="image/svg+xml" data={this.props.diagramUrl}
          title={this.props.title}
          className="entity-content__diagram-image" />
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
