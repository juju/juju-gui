'use strict';

YUI.add('juju-topology-service', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * @module topology-service
   * @class Service
   * @namespace juju.views
   **/
  var ServiceModule = Y.Base.create('ServiceModule', d3ns.Module, [], {
    subordinate_margin: {
      top: 0.05,
      bottom: 0.1,
      left: 0.084848,
      right: 0.084848},

    service_margin: {
      top: 0,
      bottom: 0.1667,
      left: 0.086758,
      right: 0.086758},

    initializer: function(options) {
      ServiceModule.superclass.constructor.apply(this, arguments);
      // Mapping of serviceId to BoundingBox of service.
      this.service_boxes = {};

    },

    componentBound: function() {
      var component = this.get('component');
      //component.on('sizeChange', this._scaleLayout);
      this._scaleLayout();
      this._buildDrag();
    },

    _scaleLayout: function() {
      this.layout = d3.layout.pack()
         .size(this.get('component').get('size'))
         .value(function(d) {return d.unit_count;})
         .padding(300);
    },

    _buildDrag: function() {
      var container = this.get('component'),
          self = this;

      this.drag = d3.behavior.drag()
     .on('dragstart', function(d) {
            d.oldX = d.x;
            d.oldY = d.y;
            Y.one(container).all('.environment-menu.active')
       .removeClass('active');
          })
     .on('drag', function(d, i) {
            if (self.longClickTimer) {
              self.longClickTimer.cancel();
            }
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            d3.select(this).attr('transform', function(d, i) {
              return d.translateStr();
            });
            Y.one(container).all('.environment-menu.active')
        .removeClass('active');
          });
    },

    render: function() {
      var topology = this.get('component');

      ServiceModule.superclass.render.apply(this, arguments);

      // Enter
      this.serviceSelection
      .enter().append('g')
      .call(this.drag)
      .attr('class', function(d) {
            return (d.subordinate ? 'subordinate ' : '') + 'service';
          })
      .attr('transform', function(d) { return d.translateStr();});

      // Update.
      this.drawService(this.serviceSelection);

      // Exit.
      this.serviceSelection.exit()
      .remove();

      return this;
    },

    update: function() {
      ServiceModule.superclass.update.apply(this, arguments);

      var topology = this.get('component'),
          db = topology.get('db'),
          services = db.services.map(views.toBoundingBox),
          new_services = Y.Object.values(this.service_boxes)
            .filter(function(boundingBox) {
            return !Y.Lang.isNumber(boundingBox.x);
          });

      // Layout new nodes.
      this.layout
          .nodes({children: new_services});

      Y.each(services, function(service_box) {
        var existing = this.service_boxes[service_box.id];
        if (existing) {
          service_box.pos = existing.pos;
        }
        service_box.margins(service_box.subordinate ?
                                this.subordinate_margin :
                                this.service_margin);

        this.service_boxes[service_box.id] = service_box;
      }, this);

      this.serviceSelection = topology.vis.selectAll('.service')
          .data(services, function(d) {
            return d.modelId();});

      return this;
    },

    drawService: function(node) {
      var self = this,
          topology = this.get('component'),
          service_scale = topology.service_scale,
          service_scale_width = topology.service_scale_width,
          service_scale_height = topology.service_scale_height;

      // Size the node for drawing.
      node
      .attr('width', function(d) {
            // NB: if a service has zero units, as is possible with
            // subordinates, then default to 1 for proper scaling, as
            // a value of 0 will return a scale of 0 (this does not
            // affect the unit count, just the scale of the service).
            var w = service_scale(d.unit_count || 1);
            d.w = w;
            return w;
          })
      .attr('height', function(d) {
            var h = service_scale(d.unit_count || 1);
            d.h = h;
            return h;
          });

      // Draw subordinate services.
      node.filter(function(d) { return d.subordinate; })
     .append('image')
     .attr('xlink:href', '/juju-ui/assets/svgs/sub_module.svg')
     .attr('width', function(d) { return d.w; })
     .attr('height', function(d) { return d.h; });

      // Draw a subordinate relation indicator.
      var sub_relation = node.filter(function(d) {
        return d.subordinate;
      })
     .append('g')
     .attr('class', 'sub-rel-block')
     .attr('transform', function(d) {
            // Position the block so that the relation indicator will
            // appear at the right connector.
            return 'translate(' + [d.w, d.h / 2 - 26] + ')';
          });

      sub_relation.append('image')
     .attr('xlink:href', '/juju-ui/assets/svgs/sub_relation.svg')
     .attr('width', 87)
     .attr('height', 47);
      sub_relation.append('text').append('tspan')
     .attr('class', 'sub-rel-count')
     .attr('x', 64)
     .attr('y', 47 * 0.8)
     .text(function(d) {
            return views.subordinateRelationsForService(
                d, self.modules.relations.rel_pairs).length;
          });
      // Draw non-subordinate services services
      node.filter(function(d) {
        return !d.subordinate;
      })
     .append('image')
     .attr('xlink:href', '/juju-ui/assets/svgs/service_module.svg')
     .attr('width', function(d) {
            return d.w;
          })
     .attr('height', function(d) {
            return d.h;
          });

      // The following are sizes in pixels of the SVG assets used to
      // render a service, and are used to in calculating the vertical
      // positioning of text down along the service block.
      var service_height = 224,
          name_size = 22,
          charm_label_size = 16,
          name_padding = 26,
          charm_label_padding = 118;

      var service_labels = node.append('text').append('tspan')
     .attr('class', 'name')
     .attr('style', function(d) {
            // Programmatically size the font.
            // Number derived from service assets:
            // font-size 22px when asset is 224px.
            return 'font-size:' + d.h *
                (name_size / service_height) + 'px';
          })
     .attr('x', function(d) {
            return d.w / 2;
          })
     .attr('y', function(d) {
            // Number derived from service assets:
            // padding-top 26px when asset is 224px.
            return d.h * (name_padding / service_height) + d.h *
                (name_size / service_height) / 2;
          })
     .text(function(d) {return d.id; });

      var charm_labels = node.append('text').append('tspan')
     .attr('class', 'charm-label')
     .attr('style', function(d) {
            // Programmatically size the font.
            // Number derived from service assets:
            // font-size 16px when asset is 224px.
            return 'font-size:' + d.h *
                (charm_label_size / service_height) + 'px';
          })
     .attr('x', function(d) {
            return d.w / 2;
          })
     .attr('y', function(d) {
            // Number derived from service assets:
            // padding-top: 118px when asset is 224px.
            return d.h * (charm_label_padding / service_height) - d.h *
                (charm_label_size / service_height) / 2;
          })
     .attr('dy', '3em')
     .text(function(d) { return d.charm; });

      // Show whether or not the service is exposed using an
      // indicator (currently a simple circle).
      // TODO this will likely change to an image with UI uodates.
      var exposed_indicator = node.filter(function(d) {
        return d.exposed;
      })
     .append('image')
     .attr('xlink:href', '/juju-ui/assets/svgs/exposed.svg')
     .attr('width', function(d) {
            return d.w / 6;
          })
     .attr('height', function(d) {
            return d.w / 6;
          })
     .attr('x', function(d) {
            return d.w / 10 * 7;
          })
     .attr('y', function(d) {
            return d.getRelativeCenter()[1] - (d.w / 6) / 2;
          })
     .attr('class', 'exposed-indicator on');
      exposed_indicator.append('title')
     .text(function(d) {
            return d.exposed ? 'Exposed' : '';
          });

      // Add the relative health of a service in the form of a pie chart
      // comprised of units styled appropriately.
      var status_chart_arc = d3.svg.arc()
     .innerRadius(0)
     .outerRadius(function(d) {
            // Make sure it's exactly as wide as the mask
            return parseInt(
                d3.select(this.parentNode)
         .select('image')
         .attr('width'), 10) / 2;
          });

      var status_chart_layout = d3.layout.pie()
     .value(function(d) { return (d.value ? d.value : 1); })
     .sort(function(a, b) {
            // Ensure that the service health graphs will be renders in
            // the correct order: error - pending - running.
            var states = {error: 0, pending: 1, running: 2};
            return states[a.name] - states[b.name];
          });

      // Append to status charts to non-subordinate services
      var status_chart = node.append('g')
     .attr('class', 'service-status')
     .attr('transform', function(d) {
            return 'translate(' + d.getRelativeCenter() + ')';
          });

      // Add a mask svg
      status_chart.append('image')
     .attr('xlink:href', '/juju-ui/assets/svgs/service_health_mask.svg')
     .attr('width', function(d) {
            return d.w / 3;
          })
     .attr('height', function(d) {
            return d.h / 3;
          })
     .attr('x', function() {
            return -d3.select(this).attr('width') / 2;
          })
     .attr('y', function() {
            return -d3.select(this).attr('height') / 2;
          });

      // Add the path after the mask image (since it requires the mask's
      // width to set its own).
      var status_arcs = status_chart.selectAll('path')
     .data(function(d) {
            var aggregate_map = d.aggregated_status,
                aggregate_list = [];
            Y.Object.each(aggregate_map, function(count, state) {
              aggregate_list.push({name: state, value: count});
            });

            return status_chart_layout(aggregate_list);
          }).enter().insert('path', 'image')
     .attr('d', status_chart_arc)
     .attr('class', function(d) { return 'status-' + d.data.name; })
     .attr('fill-rule', 'evenodd')
     .append('title').text(function(d) {
            return d.data.name;
          });

      // Add the unit counts, visible only on hover.
      var unit_count = status_chart.append('text')
     .attr('class', 'unit-count hide-count')
     .text(function(d) {
            return views.humanizeNumber(d.unit_count);
          });
    }



  }, {
    ATTRS: {}

  });
  views.ServiceModule = ServiceModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-models',
    'juju-env'
  ]
});
