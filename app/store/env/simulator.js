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

/**

  Simulate various types of change to a sandbox environment.
  These can include things like
    - unit/relation failure/recovery
    - unit count changes
    - landscape annotation changes
    - position annotation changes


  @module env
  @submodule env.simulator
*/

YUI.add('juju-fakebackend-simulator', function(Y) {

  // How often should we run by default (ms).
  var DEFAULT_INTERVAL = 3000;
  var RAND = function(prob) {
    return Math.random() <= prob;
  };

  var DEFAULT_AGENTS = {
    landscape: {
      start: function(context) {
        // For landscape to work, we need to ensure the top level
        // env has the proper setup. This happens once.
        var db = context.state.db;
        var envAnno = db.environment.get('annotations');
        envAnno['landscape-url'] = 'http://landscape.example.com';
        envAnno['landscape-computers'] = '/computers/criteria/environment:test';
        envAnno['landscape-reboot-alert-url'] =
            '+alert:computer-reboot/info#power';
        envAnno['landscape-security-alert-url'] =
            '+alert:security-upgrades/packages/list?filter=security';
        context.state.updateAnnotations('env', envAnno);
        context.serviceAnnotations(context);
      },

      /**
      Annotate services as if connected to landscape.

      @method serviceAnnotations
       */
      serviceAnnotations: function(context) {
        context.state.db.services.each(function(service) {
          var annotations = service.get('annotations') || {};
          var sid = service.get('id');
          if (!annotations['landscape-computers']) {
            annotations['landscape-computers'] = '+service:' + sid;
            context.state.updateAnnotations(sid, annotations);
          }
        });
      },

      /**
      Annotate units as if connected to landscape.

      @method unitAnnotations
       */
      unitAnnotations: function(context) {
        context.selection.each(function(service) {
          service.get('units').each(function(unit) {
            var annotations = unit.annotations || {};
            if (!annotations['landscape-computer']) {
              annotations['landscape-computer'] = '+unit:' + unit.urlName;
              context.state.updateAnnotations(unit.id, annotations);
            }
          });
        });
      },

      select: {
        list: 'services'
      },

      reboot_chance_per_unit: 0.05,
      upgrade_chance_per_unit: 0.05,

      run: function(context) {
        context.serviceAnnotations(context);
        context.unitAnnotations(context);
        context.selection.each(function(service) {
          service.get('units').each(function(unit) {
            var annotations = unit.annotations || {};
            var changed = false;
            // Toggle some annotations.
            if (RAND(context.reboot_chance_per_unit)) {
              annotations['landscape-needs-reboot'] = !annotations[
                  'landscape-needs-reboot'];
              changed = true;
            }
            if (RAND(context.upgrade_chance_per_unit)) {
              annotations['landscape-security-upgrades'] = !annotations[
                  'landscape-security-upgrades'];
              changed = true;
            }
            if (changed) {
              context.state.updateAnnotations(unit.id, annotations);
            }
          });
        });
      }
    },

    unitCounts: {
      select: {
        list: 'services',
        random: 0.1
      },
      run: function(context) {
        context.selection.each(function(service) {
          if (RAND(0.5)) {
            context.state.addUnit(service.get('id'), 1);
          } else {
            var units = service.get('units');
            if (units.length > 1) {
              var unit = units.item(units.length - 1);
              context.state.removeUnits([unit.id]);
            }
          }
        });
      }
    },

    unitStatus: {
      select: {
        list: 'services'
      },
      run: function(context) {
        context.selection.each(function(service) {
          service.get('units').each(function(unit) {
            if (RAND(0.95)) { return; }
            var roll = Math.random();
            if (roll <= 0.35) {
              unit.agent_state = 'started';
              unit.agent_state_info = undefined;
              unit.agent_state_data = {};
            } else if (roll <= 0.7) {
              if (roll <= 0.4) {
                unit.agent_state = 'dying';
              } else if (roll <= 0.5) {
                unit.agent_state = 'installing';
              } else {
                unit.agent_state = 'pending';
              }
              unit.agent_state_info = undefined;
              unit.agent_state_data = {};
            } else if (roll <= 1) {
              // error block
              unit.agent_state = 'error';
              var db = context.state.db;
              var serviceName = this.service;
              var relations = db.relations.get_relations_for_service(
                  db.services.getById(serviceName));
              if (roll <= 0.8 && relations.length > 0) {
                var relation = relations[
                    Math.floor(Math.random() * relations.length)];
                var interfaceName, remoteUnit;
                relation.get('endpoints').forEach(function(endpoint) {
                  if (endpoint[0] !== serviceName) {
                    remoteUnit = endpoint[0];
                    return;
                  }
                  interfaceName = endpoint[1].name;
                });
                unit.agent_state_info = 'hook failed: "' +
                    interfaceName + '-relation-changed"';
                unit.agent_state_data = {
                  hook: interfaceName + '-relation-changed',
                  'relation-id': 1,
                  'remote-unit': remoteUnit + '/0'
                };
              } else if (roll <= 0.9) {
                unit.agent_state_info = 'hook failed: "install"';
                unit.agent_state_data = {
                  hook: 'install'
                };
              } else if (roll <= 1) {
                unit.agent_state_info = 'hook failed: "config-changed"';
                unit.agent_state_data = {
                  hook: 'config-changed'
                };
              }
            }
            // Put in delta since there is no API for this.
            context.state.changes.units[unit.id] = [unit, true];
          });
        });
      }
    },

    /*
     This one is a toy playing with position annotations
     */
    position: {
      threshold: 0.0, // Disabled by default.

      start: function(context) {
        // Not sensitive to size changes.
        // Reach across time and space to look at... client-side.
        var canvas = Y.one('body'),
            width = canvas.getDOMNode().getClientRects()[0].width,
            height = canvas.getDOMNode().getClientRects()[0].height;
        this.set('width', width);
        this.set('height', height);
      },


      select: {
        list: 'services'
      },

      run: function(context) {
        var width = context.width,
            height = context.height,
            center = context.center;

        var axis = RAND(0.5) && 'x' || 'y';

        context.selection.each(function(s) {
          var annotations = s.get('annotations') || {};
          var x = annotations['gui-x'];
          var y = annotations['gui-y'];
          if (!Y.Lang.isNumber(x)) {
            return;
          }
          // Mirror relative x position on canvas.
          // TODO: Should move by box center point (except this
          // is a toy).
          if (axis === 'x') {
            annotations['gui-x'] = width - x;
          } else {
            annotations['gui-y'] = height - y;
          }
          context.state.updateAnnotations(s.get('id'), annotations);
        });
      }
    }
  };
  Y.namespace('juju.environments').DEFAULT_AGENTS = DEFAULT_AGENTS;

  /**
    Agents of backend change. Created automatically,
    see Simulator.ATTRS.agents

    @class Agent
    */
  function Agent(config) {
    Agent.superclass.constructor.apply(this, arguments);
  }
  Agent.NAME = 'Agent';
  Agent.ATTRS = {
    started: {value: false}
  };

  Y.extend(Agent, Y.Base, {
    /**
      This tells `Y.Base` that it should create ad-hoc attributes for config
      properties passed to Model's constructor. This makes it possible to
      instantiate a model and set a bunch of attributes without having to
      subclass `Y.Model` and declare all those attributes first.

      @property _allowAdHocAttrs
      @type {Boolean}
      @default true
      @protected
      @since 3.5.0
     */
    _allowAdHocAttrs: true,

    /**
     Prepare context used in callbacks.

     @method getContext
    */
    getContext: function() {
      var context = this.getAttrs();
      delete context.initialized;
      delete context.destroyed;
      return context;
    },

    /**
     Start lifecycle handler. Triggered by simulator.

     @method start
     */
    start: function() {
      var context = this.getContext();

      if (this.get('started') === true) {
        return;
      }
      if (context.start) {
        context.start.call(this, context);
      }
      this.set('started', true);
    },

    /**
     Select handler. Triggered in Simulator.run

     @method select
     */
    select: function(context) {
      var select = context.select;
      var db = context.state.db;
      if (!select) {
        return;
      }

      if (select.list) {
        context.selection = db[select.list];
      }
      if (select.filter) {
        // filter should return {asList: true}
        context.selection = select.filter(context);
      }
      // Also filter out any 'pending' items.
      if (context.selection !== undefined) {
        context.selection = context.selection.filter(
            {asList: true}, function(model) {
              return (model.pending ||
                  (model.get && model.get('pending'))) !== true;
            });
      }

      if (select.random !== undefined) {
        // This requires that a selection is present.
        context.selection = context.selection.filter(
            {asList: true}, function() {
              return Math.random() <= select.random;
            });
      }
    },

    /**
     Agent runtime controller. Called by Simulator.run automatically.

     @method run
     */
    run: function() {
      var context = this.getContext();

      if (context.threshold !== undefined && !RAND(context.threshold)) {
        return;
      }
      // Update selection to act on.
      if (context.select) {
        this.select(context);
        this.set('selection', context.selection);
      }
      if (context.run) {
        // `run` should logically always exist,
        // however some tests are very simple to
        // write w/o it.
        context.run.call(this, context);
      }
    }
  });
  Y.namespace('juju.environments').Agent = Agent;

  /**
  Humble make-believe manager.
  The Simulator processes its 'agents' attribute into
  an Agent object and then manages its runtime. Each entry
  in the agents attribute is a {String} 'name': {Object} agent spec
  mapping.

  Each agent spec can in turn define a number of attributes.

  start: {Function} optional. invoked after the client has logged.

  select: {Object} Defines how to select a set of models to interact with.
                   When possible 'pending' items are removed from the
                   selection automatically.

          list: {String} optional name of ModelList in db to use as
                         starting selection.

          filter: {Function} Called with context (so context.selection is
          available). Should return a ModelList.filter({asList: true},
          function()) styled selection.

          random: {Float} 0..1 (optional) Narrow existing selection to a random
          subset.

  threshold: {Float} optional 0..1 range probability that agent should run on a
  given interval.

  run: {Function}(context) Do agent work. This method will first prepare a
  selection if one is defined and then trigger the provided callback with
  (context).  This should perform mutations using the 'state' (FakeBackend) API
  directly or taking care to make sure the delta stream is properly handled
  should no API be available.

  `context` passed to these methods represents the current attribute values of
  the agent as well as `state` which is a handle to the backend (FakeBackend)
  API.  Callbacks are invoked with the generate Agent class and can directly
  store attributes on the class in the normal Y.Base ways.

  @class Simulator
  */
  function Simulator(config) {
    // Invoke Base constructor, passing through arguments.
    Simulator.superclass.constructor.apply(this, arguments);
  }

  Simulator.NAME = 'Simulator';
  Simulator.ATTRS = {
    agents: {},
    state: {},
    useDefaultAgents: {value: true},
    interval: {value: DEFAULT_INTERVAL}
  };

  Y.extend(Simulator, Y.Base, {

    /**
    Initializes.

    @method initializer
    @return {undefined} Nothing.
    */
    initializer: function() {
      this._agents = null;
      this._scheduler = null;
      /**
       * Fired on each interval of the scheduler
       * after agents have run.
       * @event tick
       */
      this.publish('tick');

      // When our agents property changes
      // regenerate our agents mapping.
      if (this.get('useDefaultAgents')) {
        var agents = this.get('agents') || {};
        this.set('agents', Y.mix(agents, DEFAULT_AGENTS));
      }
      this._updateAgents();
      this.after('stateChange', this._updateAgents, this);
      this.after('agentsChange', this._updateAgents, this);
      return this;
    },

    /**
    Cleanup on destruction.
    @method destructor
    */
    destructor: function() {
      this.stop();
    },

    /**
     Utility to generate Agent instances from
     Agent specs (see agents attribute)

     @method _updateAgents
     @return {undefined} side-effects only.
     */
    _updateAgents: function() {
      var decls = this.get('agents');
      var state = this.get('state');
      var agents = {};

      Y.each(decls, function(spec, name) {
        spec = spec || {};
        spec.state = state;
        agents[name] = new Agent(spec);
      });
      this._agents = agents;
    },

    /**
    Start each agent firing 'tick' events when pushing changes.

    @method start
    @chainable
    */
    start: function() {
      var self = this,
          state = this.get('state');

      if (this._scheduler) {
        // Already started, so restart.
        this.stop();
      }

      var tick = function() {
        if (state.get('authenticated') === true) {
          Y.each(self._agents, function(agent, name) {
            if (agent.get('started') !== true) {
              agent.start.call(agent);
            }
            agent.run.call(agent);
          });
        }
        self.fire('tick');
      };

      this._scheduler = Y.later(self.get('interval'),
                                self, tick, undefined,
                                true);

      // Invoke on start as well.
      tick();
      return this;

    },

    /**
    Stop agents from firing or mutating backend.
    @method stop
    @chainable
    */
    stop: function() {
      if (this._scheduler) {
        this._scheduler.cancel();
        this._scheduler = null;
      }
      return this;
    },

    /**
     Toggle the running state of the simulator.

     @method toggle
     @chainable
     */
    toggle: function() {
      if (this._scheduler) {
        this.stop();
      } else {
        this.start();
      }
      return this;
    }

  });
  Y.namespace('juju.environments').Simulator = Simulator;


}, '0.1.0', {
  requires: [
    'base',
    'event',
    'juju-models',
    'promise',
    'yui-later'
  ]
});
