/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
          <juju.components.SvgIcon name="fullscreen-grey_16" size="12" />
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

YUI.add('entity-content-diagram', function() {
  juju.components.EntityContentDiagram = EntityContentDiagram;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
