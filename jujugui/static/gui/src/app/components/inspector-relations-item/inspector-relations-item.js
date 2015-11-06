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

YUI.add('inspector-relations-item', function() {

  juju.components.InspectorRelationsItem = React.createClass({
    icons: {
      uncommitted: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16.000017 16.000017"><g transform="translate(-952 -156.362)"><path color="#000" overflow="visible" fill="none" d="M952 156.362h16v16h-16z"/><circle r="7.25" cy="164.362" cx="960" color="#000" overflow="visible" fill="none" stroke="#2ab7ec" stroke-width="1.5" stroke-dashoffset=".8"/><path style="line-height:125%;-inkscape-font-specification:Ubuntu;text-align:center" d="M961 160.3q0 .93-.178 1.797-.156.844-.334 1.754.8-.443 1.577-.864.777-.422 1.687-.733l.134-.045.62 1.866-.176.066q-.888.333-1.777.444-.888.09-1.82.156.732.62 1.376 1.22.643.578 1.198 1.355l.11.156-1.62 1.133-.088-.133q-.533-.8-.933-1.577-.377-.8-.777-1.643-.4.844-.8 1.643-.377.778-.91 1.577l-.09.133-1.62-1.132.112-.155q.555-.777 1.2-1.354.643-.6 1.375-1.22-.932-.067-1.82-.156-.89-.11-1.777-.444l-.177-.066.62-1.866.135.045q.91.31 1.687.733.777.42 1.577.865-.178-.91-.356-1.753-.155-.866-.155-1.798v-.18h2v.18z" font-family="Ubuntu" letter-spacing="0" word-spacing="0" text-anchor="middle" fill="#2ab7ec"/></g></svg>', // eslint-disable-line max-len
      ok: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16.000017 16.000017"><g transform="translate(-952 -108.362)" color="#000"><path overflow="visible" fill="none" d="M952 108.362h16v16h-16z"/><circle cx="960" cy="116.362" r="7.25" overflow="visible" fill="#38b44a" stroke="#38b44a" stroke-width="1.5" stroke-dashoffset=".8"/><path d="M958 120.362v-8l6 4z" overflow="visible" fill="#fff"/></g></svg>' // eslint-disable-line max-len
    },

    /**
      Handle navigating to a service when it is clicked.

      @method _handleServiceClick
    */
    _handleServiceClick: function() {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.relation.far.service,
            activeComponent: undefined
          }}});
    },

    /**
      Get the correct icon for the status.

      @method _getIcon
      @param {Boolean} pending The pending status.
      @returns {String} The html string for the icon.
    */
    _getIcon: function(pending) {
      var icons = this.icons;
      return pending ? icons.uncommitted : icons.ok;
    },

    render: function() {
      var relation = this.props.relation;
      var service = relation.far.service;
      return (
        <li className="inspector-relations-item">
          <span className="inspector-relations-item__service"
            role="button" tabIndex="0"
            onClick={this._handleServiceClick}>
            <span className="inspector-relations-item__status">
              <span dangerouslySetInnerHTML={{__html:
                  this._getIcon(relation.pending)}} />
            </span>
            {relation.far.serviceName}
          </span>
          <span className="inspector-relations-item__details">
            <p className="inspector-relations-item__property">
              Interface: {relation.interface}
            </p>
            <p className="inspector-relations-item__property">
              Name: {relation.near.name}
            </p>
            <p className="inspector-relations-item__property">
              Role: {relation.near.role || 'None'}
            </p>
            <p className="inspector-relations-item__property">
              Scope: {relation.scope}
            </p>
          </span>
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
