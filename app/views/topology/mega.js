'use strict';

/**
 * IMPORTANT
 *
 * This module represents a single step in the refactor of the environment
 * view. This module is THROW AWAY CODE.  Each forthcoming branch should
 * begin by moving relevant code to the proper module, binding that
 * module to Topo and removing code from here.
 *
 * Any patch adding code here (minus some initial cross module callback changes)
 * is highly suspect.
 *
 * @module mega
 **/

YUI.add('juju-topology-mega', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      d3ns = Y.namespace('d3'),
      Templates = views.Templates;

  /**
   * @module topology-service
   * @class MegaModule
   * @namespace views
   **/
  var MegaModule = Y.Base.create('MegaModule', d3ns.Module, [], {
    events: {
      scene: {
        '.service': {
          click: 'serviceClick',
          dblclick: 'serviceDblClick',
          mouseenter: 'serviceMouseEnter',
          mouseleave: 'serviceMouseLeave'
        },

        '.service-status': {
          mouseover: {callback: function(d, self) {
            d3.select(this)
            .select('.unit-count')
            .attr('class', 'unit-count show-count');
          }},
          mouseout: {callback: function(d, self) {
            d3.select(this)
            .select('.unit-count')
            .attr('class', 'unit-count hide-count');
          }}
        },
        '.rel-label': {
          mousemove: 'mousemove'
        },
        '.topology .crosshatch-background rect:first-child': {
          /**
           * If the user clicks on the background we cancel any active add
           * relation.
           */
          click: {callback: function(d, self) {
            var container = self.get('container'),
                topo = self.get('component');
            container.all('.environment-menu.active').removeClass('active');
            self.service_click_actions.toggleControlPanel(null, self);
            topo.fire('clearState');
          }},
          mousemove: 'mousemove'
        },
        '.graph-list-picker .picker-button': {
          click: 'showGraphListPicker'
        },
        '.graph-list-picker .picker-expanded': {
          click: 'hideGraphListPicker'
        },
        // Menu/Controls
        '.view-service': {
          /** The user clicked on the "View" menu item. */
          click: {callback: function(data, context) {
            // Get the service element
            var topo = context.get('component');
            var box = topo.get('active_service');
            var service = topo.serviceForBox(box);
            context.service_click_actions
              .toggleControlPanel(box, context);
            context.service_click_actions
              .show_service(service, context);
          }}
        },
        '.destroy-service': {
          /** The user clicked on the "Destroy" menu item. */
          click: {callback: function(data, context) {
            // Get the service element
            var topo = context.get('component');
            var box = topo.get('active_service');
            var service = topo.serviceForBox(box);
            context.service_click_actions
              .toggleControlPanel(box, context);
            context.service_click_actions
              .destroyServiceConfirm(service, context);
          }}
        }
      },
      d3: {
        '.service': {
          'mousedown.addrel': {callback: function(d, context) {
            var evt = d3.event;
            var topo = context.get('component');
            context.longClickTimer = Y.later(750, this, function(d, e) {
              // Provide some leeway for accidental dragging.
              if ((Math.abs(d.x - d.oldX) + Math.abs(d.y - d.oldY)) /
                  2 > 5) {
                return;
              }

              // Sometimes mouseover is fired after the mousedown, so ensure
              // we have the correct event in d3.event for d3.mouse().
              d3.event = e;

              // Start the process of adding a relation
              topo.fire('addRelationDragStart', {service: d});
            }, [d, evt], false);
          }},
          'mouseup.addrel': {callback: function(d, context) {
            // Cancel the long-click timer if it exists.
            if (context.longClickTimer) {
              context.longClickTimer.cancel();
            }
          }}
        }
      },
      yui: {
        rendered: 'renderedHandler',
        show: 'show',
        hide: 'hide',
        fade: 'fade',
        toggleControlPanel: {callback: function() {
          this.service_click_actions.toggleControlPanel(null, this);
        }},
        rescaled: 'updateServiceMenuLocation'
      }
    },

    initializer: function(options) {
      MegaModule.superclass.constructor.apply(this, arguments);

      // Build a service.id -> BoundingBox map for services.
      this.service_boxes = {};

      // Set a default
      this.set('currentServiceClickAction', 'toggleControlPanel');
    },

    serviceClick: function(d, context) {
      // Ignore if we clicked outside the actual service node.
      var topo = context.get('component'),
          container = context.get('container'),
          mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (!d.containsPoint(mouse_coords, topo.zoom)) {
        return;
      }
      // Get the current click action
      var curr_click_action = context.get('currentServiceClickAction');
      // Fire the action named in the following scheme:
      //   service_click_action.<action>
      // with the service, the SVG node, and the view
      // as arguments.
      (context.service_click_actions[curr_click_action])(
          d, context, this);
    },

    serviceDblClick: function(d, self) {
      // Just show the service on double-click.
      var topo = self.get('component'),
          service = topo.serviceForBox(d);
      (self.service_click_actions.show_service)(service, self);
    },

    serviceMouseEnter: function(d, context) {
      var rect = Y.one(this);
      // Do not fire if this service isn't selectable.
      if (!utils.hasSVGClass(rect, 'selectable-service')) {
        return;
      }

      // Do not fire unless we're within the service box.
      var topo = context.get('component');
      var container = context.get('container');
      var mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (!d.containsPoint(mouse_coords, topo.zoom)) {
        return;
      }

      topo.fire('snapToService', { service: d, rect: rect });
    },

    serviceMouseLeave: function(d, context) {
      // Do not fire if we're within the service box.
      var topo = context.get('component');
      var container = context.get('container');
      var mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (d.containsPoint(mouse_coords, topo.zoom)) {
        return;
      }
      var rect = Y.one(this).one('.service-border');
      utils.removeSVGClass(rect, 'hover');

      topo.fire('snapOutOfService');
    },

    /**
     * If the mouse moves and we are adding a relation, then the dragline
     * needs to be updated.
     *
     * @method mousemove
     * @param {object} d Unused.
     * @param {object} self The environment view itself.
     * @return {undefined} Side effects only.
     */
    mousemove: function(d, self) {
      if (self.clickAddRelation) {
        var container = self.get('component').get('container'),
                node = container.one('.topology rect:first-child').getDOMNode(),
                mouse = d3.mouse(node);
        d3.event.x = mouse[0];
        d3.event.y = mouse[1];
        self.addRelationDrag
              .call(self, self.get('addRelationStart_service'), node);
      }
    },

    /*
     * Sync view models with current db.models.
     */
    updateData: function() {
      //model data
      var topo = this.get('component'),
          vis = topo.vis,
          db = topo.get('db'),
          services = db.services.map(views.toBoundingBox);

      this.services = services;

      Y.each(services, function(service) {
        // Update services  with existing positions.
        var existing = this.service_boxes[service.id];
        if (existing) {
          service.pos = existing.pos;
        }
        service.margins(service.subordinate ?
                {
                  top: 0.05,
                  bottom: 0.1,
                  left: 0.084848,
                  right: 0.084848} :
                {
                  top: 0,
                  bottom: 0.1667,
                  left: 0.086758,
                  right: 0.086758});
        this.service_boxes[service.id] = service;
      }, this);
      topo.service_boxes = this.service_boxes;

      // Nodes are mapped by modelId tuples.
      this.node = vis.selectAll('.service')
                       .data(services, function(d) {
                         return d.modelId();});
    },

    /*
     * Attempt to reuse as much of the existing graph and view models
     * as possible to re-render the graph.
     */
    update: function() {
      var self = this,
          topo = this.get('component'),
          width = topo.get('width'),
          height = topo.get('height');

      if (!this.service_scale) {
        this.service_scale = d3.scale.log().range([150, 200]);
        this.service_scale_width = d3.scale.log().range([164, 200]),
        this.service_scale_height = d3.scale.log().range([64, 100]);
      }

      if (!this.tree) {
        this.tree = d3.layout.pack()
                      .size([width, height])
                      .value(function(d) {
                          return Math.max(d.unit_count, 1);
                        })
                      .padding(300);
      }

      //Process any changed data.
      this.updateData();

      var drag = d3.behavior.drag()
            .on('dragstart', function(d) {
                d.oldX = d.x;
                d.oldY = d.y;
                self.get('container').all('.environment-menu.active')
                  .removeClass('active');
                self.service_click_actions.toggleControlPanel(null, self);
              })
            .on('drag', function(d, i) {
                if (topo.buildingRelation) {
                  topo.fire('addRelationDrag', { box: d });
                } else {
                  if (self.longClickTimer) {
                    self.longClickTimer.cancel();
                  }

                  // Translate the service (and, potentially, menu).
                  d.x += d3.event.dx;
                  d.y += d3.event.dy;
                  d3.select(this).attr('transform', function(d, i) {
                    return d.translateStr();
                  });
                  if (topo.get('active_service') === d) {
                    self.updateServiceMenuLocation();
                  }

                  // Clear any state while dragging.
                  self.get('container').all('.environment-menu.active')
                    .removeClass('active');
                  topo.fire('cancelRelationBuild');

                  // Update relation lines for just this service.
                  topo.fire('serviceMoved', { service: d });
                }
              })
            .on('dragend', function(d, i) {
                if (topo.buildingRelation) {
                  topo.fire('addRelationDragEnd');
                }
              });

      // Generate a node for each service, draw it as a rect with
      // labels for service and charm.
      var node = this.node;

      // Rerun the pack layout.
      // Pack doesn't honor existing positions and will
      // re-layout the entire graph. As a short term work
      // around we layout only new nodes. This has the side
      // effect that node nodes can overlap and will
      // be fixed later.
      var new_services = this.services.filter(function(boundingBox) {
        return !Y.Lang.isNumber(boundingBox.x);
      });
      this.tree.nodes({children: new_services});

      // enter
      node
        .enter().append('g')
        .attr('class', function(d) {
            return (d.subordinate ? 'subordinate ' : '') + 'service';
          })
        .call(drag)
        .attr('transform', function(d) {
            return d.translateStr();
          });

      // Update
      this.drawService(node);

      // Exit
      node.exit()
          .remove();
    },

    // Called to draw a service in the 'update' phase
    drawService: function(node) {
      var self = this,
              topo = this.get('component'),
              service_scale = this.service_scale,
              service_scale_width = this.service_scale_width,
              service_scale_height = this.service_scale_height;

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

      // Draw subordinate services
      node.filter(function(d) {
        return d.subordinate;
      })
            .append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/sub_module.svg')
            .attr('width', function(d) {
                    return d.w;
                  })
            .attr('height', function(d) {
                    return d.h;
                  });

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
            .attr('y', 47 * 0.8);
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
                // Make sure it's exactly as wide as the mask with a bit
                // of leeway for the border.
                return parseInt(
                    d3.select(this.parentNode)
                      .select('image')
                      .attr('width'), 10) / 2.05;
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
                return utils.humanizeNumber(d.unit_count);
              });


    },


    /*
         * Show/hide/fade selection.
         */
    show: function(evt) {
      var selection = evt.selection;
      selection.attr('opacity', '1.0')
                .style('display', 'block');
    },

    hide: function(evt) {
      var selection = evt.selection;
      selection.attr('opacity', '0')
            .style('display', 'none');
    },

    fade: function(evt) {
      var selection = evt.selection,
          alpha = evt.alpha;
      selection.transition()
            .duration(400)
            .attr('opacity', alpha !== undefined && alpha || '0.2');
    },

    /*
         * Finish DOM-dependent rendering
         *
         * Some portions of the visualization require information pulled
         * from the DOM, such as the clientRects used for sizing relation
         * labels and the viewport size used for sizing the whole graph. This
         * is called after the view is attached to the DOM in order to
         * perform all of that work.  In the app, it's called as a callback
         * in app.showView(), and in testing, it needs to be called manually,
         * if the test relies on any of this data.
         */
    renderedHandler: function() {
      var container = this.get('container');

      this.update();

      // Ensure relation labels are sized properly.
      container.all('.rel-label').each(function(label) {
        var width = label.one('text').getClientRect().width + 10;
        label.one('rect').setAttribute('width', width)
              .setAttribute('x', -width / 2);
      });

      // Chainable method.
      return this;
    },

    /**
     * The user clicked on the environment view background.
     *
     * If we are in the middle of adding a relation, cancel the relation
     * adding.
     *
     * @method backgroundClicked
     * @return {undefined} Side effects only.
     */
    backgroundClicked: function() {
      var topo = this.get('component');
      topo.fire('clearState');
    },

    /*
         * Event handler to show the graph-list picker
         */
    showGraphListPicker: function(evt) {
      var container = this.get('container'),
              picker = container.one('.graph-list-picker');
      picker.addClass('inactive');
      picker.one('.picker-expanded').addClass('active');
    },

    /*
         * Event handler to hide the graph-list picker
         */
    hideGraphListPicker: function(evt) {
      var container = this.get('container'),
              picker = container.one('.graph-list-picker');
      picker.removeClass('inactive');
      picker.one('.picker-expanded').removeClass('active');
    },

   updateServiceMenuLocation: function() {
      var topo = this.get('component'),
          container = this.get('container'),
          cp = container.one('.environment-menu.active'),
          service = topo.get('active_service'),
          tr = topo.get('translate'),
          z = topo.get('scale');

      if (service && cp) {
        var cp_width = cp.getClientRect().width,
                menu_left = service.x * z + service.w * z / 2 <
                this.width * z / 2,
                service_center = service.getRelativeCenter();
        if (menu_left) {
          cp.removeClass('left')
                .addClass('right');
        } else {
          cp.removeClass('right')
                .addClass('left');
        }
        // Set the position of the div in the following way:
        // top: aligned to the scaled/panned service minus the
        //   location of the tip of the arrow (68px down the menu,
        //   via css) such that the arrow always points at the service.
        // left: aligned to the scaled/panned service; if the
        //   service is left of the midline, display it to the
        //   right, and vice versa.
        cp.setStyles({
          'top': service.y * z + tr[1] + (service_center[1] * z) - 68,
          'left': service.x * z +
              (menu_left ? service.w * z : -(cp_width)) + tr[0]
        });
      }
    },

    /*
     * Actions to be called on clicking a service.
     */
    service_click_actions: {
      /*
       * Default action: show or hide control panel.
       */
      toggleControlPanel: function(m, view, context) {
        var container = view.get('container'),
            topo = view.get('component'),
                cp = container.one('#service-menu');

        if (cp.hasClass('active') || !m) {
          cp.removeClass('active');
          topo.set('active_service', null);
          topo.set('active_context', null);
        } else {
          topo.set('active_service', m);
          topo.set('active_context', context);
          cp.addClass('active');
          view.updateServiceMenuLocation();
        }
      },

      /*
           * View a service
           */
      show_service: function(m, context) {
        var topo = context.get('component');
        topo.detachContainer();
        topo.fire('navigateTo', {url: '/service/' + m.get('id') + '/'});
      },

      /*
           * Show a dialog before destroying a service
           */
      destroyServiceConfirm: function(m, view) {
        // Set service in view.
        view.set('destroy_service', m);

        // Show dialog.
        view.set('destroy_dialog', views.createModalPanel(
            'Are you sure you want to destroy the service? ' +
                'This cannot be undone.',
            '#destroy-modal-panel',
            'Destroy Service',
            Y.bind(function(ev) {
              ev.preventDefault();
              var btn = ev.target;
              btn.set('disabled', true);
              view.service_click_actions
                      .destroyService(m, view, btn);
            },
            this)));
      },

      /*
           * Destroy a service.
           */
      destroyService: function(m, view, btn) {
        var env = view.get('component').get('env'),
            service = view.get('destroy_service');
        env.destroy_service(
            service.get('id'),
            Y.bind(this._destroyCallback, view,
                   service, view, btn));
      },

      _destroyCallback: function(service, view, btn, ev) {
        var getModelURL = view.get('getModelURL'),
                db = view.get('component').get('db');
        if (ev.err) {
          db.notifications.add(
              new models.Notification({
                title: 'Error destroying service',
                message: 'Service name: ' + ev.service_name,
                level: 'error',
                link: getModelURL(service),
                modelId: service
              })
          );
        } else {
          var relations = db.relations.get_relations_for_service(service);
          Y.each(relations, function(relation) {
            relation.destroy();
          });
          service.destroy();
          view.get('destroy_dialog').hide();
          db.fire('update');
        }
        btn.set('disabled', false);
      }


    }
  }, {
    ATTRS: {}

  });
  views.MegaModule = MegaModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'juju-templates',
    'juju-models',
    'juju-env'
  ]
});
