/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


YUI.add('unit-details-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = views.Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  /**
    Updates a node with a display of the given address and ports.

    @method updateAddress
    @param {Y.Node} node The node to be updated.
    @param {String} ipAddress The IP address.
    @param {Array} openPorts An array of the ports exposed.
    @return {undefined} Mutates the node.
  */
  var updateAddress = function(node, ipAddress, openPorts) {
    node.empty();
    if (!ipAddress) {
      return;
    }
    var ports = utils.normalizeUnitPorts(openPorts);
    var parsed = utils.parseUnitPorts(ipAddress, ports);
    var ipAddressData = parsed[0];
    var portDataList = parsed[1];
    // Render the IP address fragment.
    var ipAddressNode;
    if (ipAddressData.href) {
      ipAddressNode = Y.Node.create('<a></a>').setAttrs({
        href: ipAddressData.href,
        target: '_blank',
        text: ipAddressData.text
      });
    } else {
      ipAddressNode = Y.Node.create(ipAddressData.text);
    }
    node.append(ipAddressNode);
    // Render the ports fragment.
    if (portDataList.length) {
      // YUI 3 trims HTML because IE (<10?) does it. :-/
      node.append('&nbsp;| Ports&nbsp;');
      Y.Array.each(portDataList, function(portData, index) {
        if (index) {
          node.append(',&nbsp;');
        }
        var portNode;
        if (portData.href) {
          portNode = Y.Node.create('<a></a>').setAttrs({
            href: portData.href,
            target: '_blank',
            text: portData.text
          });
        } else {
          portNode = Y.Node.create(portData.text);
        }
        node.append(portNode);
      });
    }
  };
  ns.updateUnitAddress = updateAddress;

  var name = 'unit-details';

  ns.UnitDetails = Y.Base.create(name, Y.View, [ns.ViewletBaseView], {

    templateWrapper: templates['left-breakout-panel'],
    template: templates.unitOverview,
    slot: 'left-hand-panel',
    bindings: {
      agent_state_info: {
        'update': function(node, value) {
          if (value) {
            node.one('span').set('text', value);
            node.show();
          } else {
            node.hide();
          }
        }
      },
      agent_state_data: {
        'update': function(node, value) {
          if (value && Object.keys(value).length > 0) {
            var data = '';
            Object.keys(value).forEach(function(key) {
              data += '<li>' + key + ': ' + value[key] + '</li>';
            });
            node.one('ul').setHTML(data);
            node.show();
          } else {
            node.hide();
          }
        }
      },
      'annotations.landscape-computer': {
        'update': function(node, value) {
          if (value) {
            var unit = this.viewlet.model;
            var environment = this.viewlet.options.db.environment;
            node.one('a').set(
                'href', utils.getLandscapeURL(environment, unit));
            node.show();
          } else {
            node.hide();
          }
        }
      },
      private_address: {
        depends: ['open_ports'],
        'update': function(node, value) {
          updateAddress(node, value, this.viewlet.model.get('open_ports'));
        }
      },
      public_address: {
        depends: ['open_ports'],
        'update': function(node, value) {
          updateAddress(node, value, this.viewlet.model.get('open_ports'));
        }
      }
    },
    /**
      Return the template context for the unit detail view.
      @method getContext
    */
    getContext: function(db, service, unit) {
      // This should be handled with bindings, once per-unit relation
      // information is actually sanely available from Juju Core.
      // Of course, that might be tricky unless we also keep track of
      // relation errors on the db's unit models....
      // Ignore relations errors.
      var relation_errors = unit.relation_errors || {},
          relations = utils.getRelationDataForService(db, service);
      Y.each(relations, function(rel) {
        var match = relation_errors[rel.near.name],
            far = rel.far || rel.near;
        rel.has_error = !!(match && match.indexOf(far.service) > -1);
      });
      return {
        unit: unit,
        relations: relations
      };
    },

    /**
      Renders the details view into it's container
      @method render
    */
    render: function(unit, viewletManagerAttrs) {
      var db = viewletManagerAttrs.db;
      var service = db.services.getById(unit.get('service'));
      var context = this.getContext(db, service, unit);
      var template = Y.Node.create(this.templateWrapper({}));
      template.one('.content').setHTML(this.template(context));
      // Target the charm details div for the inspector popout content.
      var container = this.get('container');
      container.setHTML(template);
      container.show();
      container.delegate('click', function(ev) {
        ev.halt();
        this.fire('changeState', { sectionA: { metadata: { unit: null }}});
        this.viewletManager.hideSlot(ev);
        container.hide();
      }, '.close-slot', this);
    }
  });

}, '0.0.1', {
  requires: [
    'node',
    'viewlet-view-base',
    'juju-charm-models',
    'juju-templates',
    'juju-view'
  ]
});
