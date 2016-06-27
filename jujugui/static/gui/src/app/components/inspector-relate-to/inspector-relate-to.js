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

YUI.add('inspector-relate-to', function() {

  juju.components.InspectorRelateTo = React.createClass({

    propTypes: {
      application: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      relatableApplications: React.PropTypes.array.isRequired,
    },

    /**
      The callable to be passed to the relate to items for navigating to the
      relation type list.

      @method _relateToItemAction
      @param {Object} e The click event.
    */
    _relateToItemAction: function(e) {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            // Application from Id
            id: this.props.application.get('id'),
            // Application to Id
            spouse: e.currentTarget.getAttribute('data-id'),
            activeComponent: 'relate-to'
          }
        }
      });
    },

    /**
      Generate the list items from a set of services

      @method generateItemList
      @param {Object} services Relatable services.
    */
    generateItemList: function() {
      var applications = this.props.relatableApplications;
      if (applications.length === 0) {
        return (
          <div className="unit-list__message">
            No relatable endpoints available.
          </div>);
      }
      return applications.map((application, index) => {
        var data = application.getAttrs();
        return (
          <li className="inspector-view__list-item"
            data-id={data.id}
            key={data.id + index}
            onClick={this._relateToItemAction} tabIndex="0" role="button">
            <img src={data.icon} className="inspector-view__item-icon" />
            {data.name}
          </li>);
      });
    },

    render: function() {
      return (
        <div className="inspector-relate-to">
            <ul className="inspector-view__list">
              {this.generateItemList()}
            </ul>
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
