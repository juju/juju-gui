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

YUI.add('added-services-list', function() {

  juju.components.AddedServicesList = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      getUnitStatusCounts: React.PropTypes.func.isRequired,
      services: React.PropTypes.object.isRequired,
      updateUnitFlags: React.PropTypes.func.isRequired,
      findRelatedServices: React.PropTypes.func.isRequired,
      findUnrelatedServices: React.PropTypes.func.isRequired,
      setMVVisibility: React.PropTypes.func.isRequired
    },

    generateItemList: function(services) {
      var items = [];
      services.each((service) => {
        items.push(
            <juju.components.AddedServicesListItem
              // We use the 'name' instead of the 'id' here because when a
              // ghost service is added it uses the ghost id structure instead
              // of the final deployed service id structure and we want react
              // to treat them as the same record instead of re-rendering
              // when they key changes.
              key={service.get('name')}
              hovered={service.get('id') === this.props.hoveredId}
              changeState={this.props.changeState}
              getUnitStatusCounts={this.props.getUnitStatusCounts}
              focusService={this.focusService}
              unfocusService={this.unfocusService}
              fadeService={this.fadeService}
              unfadeService={this.unfadeService}
              ref={'AddedServicesListItem-' + service.get('id')}
              hoverService={this.props.hoverService}
              service={service} />);
      });
      return items;
    },

    /**
      Executes the appropriate methods on the db to focus the specified
      service icon.

      @method focusService
      @param {String} serviceId The id for the service to focus.
    */
    focusService: function(serviceId) {
      var props = this.props;
      var service = props.services.getById(serviceId);
      service.setAttrs({
        highlight: true,
        hide: false
      });
      props.updateUnitFlags(service, 'highlight');
      // find related services and update them
      var related = props.findRelatedServices(service);
      related.each(function(model) {
        model.set('hide', false);
      });
      var unrelated = props.findUnrelatedServices(service);
      unrelated.each(function(model) {
        model.set('hide', true);
      });
      // Turn off any highlights on any services but the passed in id.
      this.props.services.each(function(model) {
        if (model.get('id') !== service.get('id')) {
          model.set('highlight', false);
        }
      });
      props.setMVVisibility(serviceId, true);
      this.disableFocusStateOnChildren(serviceId);
    },

    /**
      Executes the appropriate methods on the db to unfocus the specified
      service icon.

      @method unfocusService
      @param {String} serviceId The id for the service to unfocus.
    */
    unfocusService: function(serviceId) {
      var props = this.props;
      var service = props.services.getById(serviceId);
      service.set('highlight', false);
      props.updateUnitFlags(service, 'highlight');
      // Unrelated services need to be unfaded.
      var unrelated = props.findUnrelatedServices(service);
      unrelated.each(function(model) {
        model.set('hide', false);
      });
      props.setMVVisibility(serviceId, false);
    },

    /**
      Sets the fade attribute on the supplied service id to true.

      @method fadeService
      @param {String} serviceId The service Id to fade.
    */
    fadeService: function(serviceId) {
      var service = this.props.services.getById(serviceId);
      service.set('fade', true);
    },

    /**
      Sets the fade attribute on the supplied service id to false.

      @method unfadeService
      @param {String} serviceId The service Id to unfade.
    */
    unfadeService: function(serviceId) {
      var service = this.props.services.getById(serviceId);
      service.set('fade', false);
    },

    /**
      Sets the focus state on the added-services-list-item components to
      false skipping the one matching the serviceId provided.

      @method disableFocusStateOnChildren
      @param {String} serviceId The service Id for the list item to skip.
    */
    disableFocusStateOnChildren: function(serviceId) {
      Object.keys(this.refs).forEach((key) => {
        // Only modify the refs for the components matching this ref.
        if (key.indexOf('AddedServicesListItem-') === 0) {
          // Skip the component for the provided serviceId.
          if (serviceId && key !== 'AddedServicesListItem-' + serviceId) {
            this.refs[key].setState({focus: false});
          }
        }
      });
    },

    render: function() {
      return (
        <div className="inspector-view">
          <ul className="added-services-list inspector-view__list">
            {this.generateItemList(this.props.services)}
          </ul>
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'added-services-list-item'
]});
