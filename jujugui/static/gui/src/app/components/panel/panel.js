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

class Panel extends React.Component {
  componentDidMount() {
    // Set the keyboard focus on the component so it can be scrolled with the
    // keyboard. Requires tabIndex to be set on the element.
    if (this.props.focus) {
      this.refs.content.focus();
    }
  }

  /**
    Returns the supplied classes with the 'active' class applied if the
    component is the one which is active.

    @method _generateClasses
    @param {String} section The section you want to check if it needs to be
      active.
    @returns {String} The collection of class names.
  */
  _genClasses(section) {
    return classNames(
      'panel-component',
      this.props.instanceName,
      this.props.extraClasses || null,
      {
        hidden: !this.props.visible
      }
    );
  }

  /**
    Call a click action if it exists.

    @method _handleClick
  */
  _handleClick() {
    var clickAction = this.props.clickAction;
    if (clickAction) {
      clickAction();
    }
  }

  /**
    Don't bubble the click event to the parent.

    @method _stopBubble
    @param {Object} The click event.
  */
  _stopBubble(e) {
    if (this.props.clickAction) {
      e.stopPropagation();
    }
  }

  render() {
    return (
      <div className={this._genClasses()}
        onClick={this._handleClick.bind(this)}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={this._stopBubble.bind(this)}>
          {this.props.children}
        </div>
      </div>
    );
  }
};

Panel.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  clickAction: PropTypes.func,
  extraClasses: PropTypes.string,
  focus: PropTypes.bool,
  instanceName: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
};

Panel.defaultProps = {
  focus: true
};

YUI.add('panel-component', function() {
  juju.components.Panel = Panel;
}, '0.1.0', { requires: []});
