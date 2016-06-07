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

YUI.add('expanding-row', function() {

  juju.components.ExpandingRow = React.createClass({

    propTypes: {
      children: React.PropTypes.object.isRequired,
      classes: React.PropTypes.object,
      expanded: React.PropTypes.bool
    },

    /**
      Generate the initial state for the component.

      @method getInitialState
    */
    getInitialState: function() {
      return {
        expanded: false,
        styles: {
          height: '0px',
          opacity: 0
        }
      };
    },

    /**
      Called once the component has initially mounted.

      @method componentDidMount
    */
    componentDidMount: function() {
      // If the component should initially be shown as expanded then animate it
      // open.
      if (this.props.expanded) {
        this._toggle();
      }
    },

    /**
      Generate the base class names for the component.

      @method _generateClasses
      @returns {Object} The collection of class names.
    */
    _generateClasses: function() {
      var classes = this.props.classes || {};
      classes['expanding-row--expanded'] = this.state.expanded;
      return classNames(
        'expanding-row',
        'twelve-col',
        classes);
    },

    /**
      Toggle between the expanded and closed states.

      @method _toggle
    */
    _toggle: function() {
      var expanded = this.state.expanded;
      this.setState({expanded: !expanded}, () => {
        var newHeight = expanded ? '0px' : this.refs.inner.offsetHeight + 'px';
        this.setState({styles: {
          height: newHeight,
          opacity: expanded ? 0 : 1
        }});
      });
    },

    render: function() {
      return (
        <li className={this._generateClasses()}
          onClick={this._toggle}>
          <div className="expanding-row__initial twelve-col no-margin-bottom">
            {this.props.children[0]}
          </div>
          <div className="expanding-row__expanded twelve-col"
            style={this.state.styles}>
            <div className="twelve-col no-margin-bottom"
              ref="inner">
              {this.props.children[1]}
            </div>
          </div>
        </li>);
    }
  });

}, '', {
  requires: [
  ]
});
