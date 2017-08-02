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

class SvgIcon extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this._generateDimensions(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._generateDimensions(nextProps));
  }

  /**
    Generate the width and height based on the supplied props.

    @param {Object} props The component props.
    @returns {Object} The object of dimensions.
  */
  _generateDimensions(props) {
    var size = props.size || this.props.size || 16;
    return {
      width: props.width || this.props.width || size,
      height: props.height || this.props.height || size
    };
  }

  /**
    Generates the classes for the icon based on the supplied props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var className = this.props.className;
    return classNames(
      'svg-icon',
      className ? className : ''
    );
  }

  /**
    Generates the styles for the icon based on the supplied props.

    @method _generateStyles
    @returns {Object} The object of styles.
  */
  _generateStyles() {
    return {
      width: this.state.width + 'px',
      height: this.state.height + 'px'
    };
  }

  /**
    Generates the viewbox for the icon based on the supplied props.

    @method _generateViewbox
    @returns {String} The viewbox.
  */
  _generateViewbox() {
    return '0 0 ' + this.state.width + ' ' + this.state.height;
  }

  render() {
    return (
      <svg className={this._generateClasses()}
        viewBox={this._generateViewbox()}
        style={this._generateStyles()}>
        <use xlinkHref={'#' + this.props.name}/>
      </svg>
    );
  }
};

SvgIcon.propTypes = {
  className: PropTypes.string,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

YUI.add('svg-icon', function() {
  juju.components.SvgIcon = SvgIcon;
}, '0.1.0', { requires: []});
