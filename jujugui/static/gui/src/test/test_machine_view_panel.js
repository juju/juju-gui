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

describe('machine view panel view', function() {
  var container, env, machines, machine, models, notifications, providerType,
      scaleUpView, scaleUpViewRender, services, units, utils, View, view,
      views, Y;
  var requirements = [
    'drop-target-view-extension', 'event-simulate', 'juju-env-go',
    'juju-models', 'juju-views', 'juju-tests-utils', 'machine-view-panel',
    'node', 'node-event-simulate'];

  function createViewNoUnits() {
    // Create a test-specific view that has no units to start
    return new View({
      container: container,
      db: {
        services: new models.ServiceList(),
        machines: machines,
        units: new models.ServiceUnitList()
      },
      env: env
    });
  }

  before(function(done) {
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      View = views.MachineViewPanelView;
      done();
    });
  });

  beforeEach(function() {
    providerType = 'demonstration';
    env = {
      after: utils.makeStubFunction(),
      get: function(arg) {
        switch (arg) {
          case 'environmentName':
            return 'Test env';
          case 'providerType':
            return providerType;
        }
      },
      once: utils.makeStubFunction()
    };
    container = utils.makeContainer(this, 'machine-view-panel');
    // setup machines
    machine = {
      id: '0',
      hardware: {
        disk: 1024,
        mem: 1024,
        cpuPower: 1024,
        cpuCores: 1
      }
    };
    machines = new models.MachineList();
    machines.add([machine]);
    // displayName is set on the machine object in the list; we also need to
    // set it on our standalone model.
    var displayName = machines.createDisplayName(machine.id);
    machine.displayName = displayName;
    // setup unplaced service units
    units = new models.ServiceUnitList();
    units.add([
      {id: 'test/1'},
      {id: 'sub/1'}
    ]);
    // setup test services
    services = new models.ServiceList();
    services.add([
      {id: 'test', icon: 'test.svg'},
      {id: 'baz', icon: 'baz.svg'},
      {id: 'sub', icon: 'sub.svg', subordinate: true}
    ]);
    // Set up test notifications.
    notifications = new models.NotificationList();
    // add everything to the view
    view = new View({
      container: container,
      db: {
        machines: machines,
        notifications: notifications,
        services: services,
        units: units
      },
      env: env
    });
  });

  afterEach(function() {
    view.destroy();
    machines.destroy();
    notifications.destroy();
    services.destroy();
    units.destroy();
    container.remove(true);
  });

  it('should apply the wrapping class to the container', function() {
    view.render();
    assert.equal(container.hasClass('machine-view-panel'), true);
  });

  it('can find machine tokens', function() {
    view.render();
    var token = view._findMachineOrContainerToken('0', false);
    assert.equal(token.getAttribute('data-id'), '0');
  });

  it('should render the header widgets', function() {
    view.render();
    assert.equal(container.all('.machine-view-panel-header').size(), 2);
  });

  it('should set the machines header to the environment name', function() {
    view.render();
    assert.equal(container.one('.column.machines .head .title').get('text'),
        'Test env');
  });

  it('should set the initial container header label', function() {
    var labels = ['0 containers', '0 units'];
    view.render();
    labels.forEach(function(l, index) {
      assert.equal(view._containersHeader.get(
          'container').all('.label').item(index).get('text').trim(), l);
    });
  });

  it('can open the machines header more menu', function() {
    view.render();
    var moreMenuNode = container.one('.column.machines .more-menu');
    moreMenuNode.one('.open-menu').simulate('click');
    assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
  });

  it('can open the containers header more menu', function() {
    view.render();
    var moreMenuNode = container.one('.column.containers .more-menu');
    moreMenuNode.one('.open-menu').simulate('click');
    assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
  });

  it('disables add container in the menu on deleted machines', function() {
    view.render();
    machine.deleted = true;
    var stubDisable = utils.makeStubMethod(
        view._containersHeader, 'disableHeaderMenuItem');
    this._cleanups.push(stubDisable.reset);
    view.set('selectedMachine', machine.id);
    var moreMenuNode = container.one('.column.containers .more-menu');
    moreMenuNode.one('.open-menu').simulate('click');
    assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
    assert.equal(stubDisable.callCount(), 1);
    assert.deepEqual(stubDisable.lastArguments(), ['Add container', true]);
  });

  it('only instantiates non-subordinate unit tokens', function() {
    var unitTokens = view.get('unitTokens');
    assert.equal(Object.keys(unitTokens).length, 1);
    assert.equal(unitTokens['test/1'].get('unit').service, 'test');
  });

  describe('_onMachineCreated (autodeploy_extension integration)', function() {

    beforeEach(function() {
      machines.reset();
      view.render();
    });

    it('adds a notification if a global error occurred', function() {
      var machine = machines.addGhost();
      view._onMachineCreated(
          machine, {
            err: 'bad wolf',
            machines: [{
              name: 'foo'
            }]
          });
      assert.strictEqual(notifications.size(), 1);
      var notification = notifications.item(0);
      assert.strictEqual(
          notification.get('title'), 'Error creating the new machine');
      assert.strictEqual(
          notification.get('message'),
          'Could not add the requested machine. ' +
          'Server responded with: bad wolf');
      assert.strictEqual(notification.get('level'), 'error');
    });

    it('adds a notification if a machine error occurred', function() {
      var machine = machines.addGhost();
      var response = {machines: [{name: '42', err: 'exterminate'}]};
      view._onMachineCreated(machine, response);
      assert.strictEqual(notifications.size(), 1);
      var notification = notifications.item(0);
      assert.strictEqual(
          notification.get('title'), 'Error creating machine 42');
      assert.strictEqual(
          notification.get('message'),
          'Could not add the requested machine. ' +
          'Server responded with: exterminate');
      assert.strictEqual(notification.get('level'), 'error');
    });

    it('updates the ghost machine model to use the real id', function() {
      var machine = machines.addGhost();
      assert.strictEqual(machines.size(), 1);
      var response = {machines: [{name: '42'}]};
      view._onMachineCreated(machine, response);
      assert.equal(machines.item(0).id, '42');
    });


    it('removes the ghost machine even when an error occurs', function() {
      var machine = machines.addGhost();
      assert.strictEqual(machines.size(), 1);
      var response = {err: 'bad wolf'};
      view._onMachineCreated(machine, response);
      assert.strictEqual(machines.size(), 0);
    });

  });

  describe('_onMachineRemove', function() {

    it('clears the container column when the active machine is removed',
        function() {
          var clearStub = utils.makeStubMethod(view, '_clearContainerColumn');
          this._cleanups.push(clearStub.reset);
          var onboardingStub = utils.makeStubMethod(view, '_toggleOnboarding');
          this._cleanups.push(onboardingStub.reset);
          view._machinesHeader = {};
          var labelStub = utils.makeStubMethod(view._machinesHeader,
              'updateLabelCount');
          this._cleanups.push(labelStub.reset);
          view.set('selectedMachine', '0');
          machines.remove(machines.getById('0'));
          assert.equal(clearStub.calledOnce(), true);
        });

    it('does not clear the container column if the machine is not active',
        function() {
          var clearStub = utils.makeStubMethod(view, '_clearContainerColumn');
          this._cleanups.push(clearStub.reset);
          var onboardingStub = utils.makeStubMethod(view, '_toggleOnboarding');
          this._cleanups.push(onboardingStub.reset);
          view._machinesHeader = {};
          var labelStub = utils.makeStubMethod(view._machinesHeader,
              'updateLabelCount');
          this._cleanups.push(labelStub.reset);
          view.set('selectedMachine', '9');
          machines.remove(machines.getById('0'));
          assert.equal(clearStub.calledOnce(), false);
        });
  });

  describe('_onMachineChanges and _onMachineChange', function() {
    it('does nothing when there are not instances', function() {
      var changeStub = utils.makeStubMethod(view, '_onMachineChange');
      this._cleanups.push(changeStub.reset);
      view._onMachineChanges({});
      assert.equal(changeStub.callCount(), 0);
    });

    it('calls change handler for each machine in a batch', function() {
      var changeStub = utils.makeStubMethod(view, '_onMachineChange');
      this._cleanups.push(changeStub.reset);
      var instances = [
        {id: '0'},
        {id: '1'}
      ];
      view._onMachineChanges({instances: instances});
      assert.equal(changeStub.callCount(), instances.length);
    });

    it('matches deltas with their associated instances', function() {
      var changeStub = utils.makeStubMethod(view, '_onMachineChange');
      this._cleanups.push(changeStub.reset);
      view.render();
      machines.add([{id: 'foo'}]);
      var instances = [
        {id: '0'},
        {id: 'bar'}
      ];
      var changes = [
        {hide: {newVal: true, prevVal: false}},
        {id: {newVal: 'bar', prevVal: 'foo'}}
      ];
      view._onMachineChanges({instances: instances, changes: changes});
      var args = changeStub.allArguments();
      assert.deepEqual(args[0], [{instance: instances[0], changed: changes[0]}],
                       'First instance/changed pairing is incorrect');
      assert.deepEqual(args[1], [{instance: instances[1], changed: changes[1]}],
                       'Second instance/changed pairing is incorrect');
    });
  });

  describe('create machine view', function() {
    beforeEach(function() {
      var env = view.get('env');
      env.addMachines = utils.makeStubFunction('add-machine-record-key');
      env.placeUnit = utils.makeStubFunction();
    });

    it('displays when the machine header action is clicked', function() {
      view.render();
      var createMachine = container.one('.create-machine');
      // Need to click on the more menu to make it render.
      container.one('.machines .head .more-menu .open-menu').simulate('click');
      container.one('.machines .head .moreMenuItem-0').simulate('click');
      assert.equal(createMachine.hasClass('create-machine-view'), true,
                   'expected class is not present');
      assert.equal(createMachine.getHTML() === '', false,
                   'HTML is not present');
      assert.equal(createMachine.hasClass('state-constraints'), true,
                   'the constraints should be visible');
    });

    it('displays when the container header action is clicked', function() {
      view.render();
      view.set('selectedMachine', '0');
      var createContainer = container.one('.create-container');
      // Need to click on the more menu to make it render.
      container.one('.containers .head .more-menu .open-menu').simulate(
          'click');
      container.one('.containers .head .moreMenuItem-0').simulate('click');
      assert.equal(createContainer.hasClass('create-machine-view'), true,
                   'expected class is not present');
      assert.equal(createContainer.getHTML() === '', false,
                   'HTML is not present');
      assert.equal(createContainer.hasClass('state-containers'), true,
                   'the container types should be visible');
    });

    it('does not display in the container header when no machine is selected',
        function() {
          view.render();
          view.set('selectedMachine', null);
          var createContainer = container.one('.create-container');
          // Need to click on the more menu to make it render.
          container.one('.containers .head .more-menu .open-menu').simulate(
              'click');
          container.one('.containers .head .moreMenuItem-0').simulate('click');
          assert.equal(createContainer.getHTML(), '',
                       'HTML present in container');
        }
    );

    it('creates an unplaced unit when cancelled with a unit', function() {
      var unitTokens = view.get('unitTokens');
      var toggleStub = utils.makeStubMethod(view, '_toggleAllPlacedMessage');
      this._cleanups.push(toggleStub.reset);
      view.render();
      view._unitTokenDropHandler({
        dropAction: 'machine',
        unit: 'test/1'
      });
      assert.equal(Object.keys(unitTokens).length, 0);
      // Confirm the machine creation.
      container.one('.create-machine-view .cancel').simulate('click');
      assert.equal(Object.keys(unitTokens).length, 1);
    });
  });

  // Add a provider type with the given name to the provider features list.
  // The provider will support the given list of supportedContainerTypes.
  // Clean up the provider features on exit.
  var mockProviderType = function(test, name, supportedContainerTypes) {
    var environments = Y.namespace('juju.environments');
    var original = environments.providerFeatures;
    environments.providerFeatures = Y.clone(original);
    environments.providerFeatures[name] = {
      supportedContainerTypes: supportedContainerTypes
    };
    // Restore the original providerFeatures on exit.
    test._cleanups.push(function() {
      environments.providerFeatures = original;
    });
  };

  describe('containerization support', function() {
    var KVM = {label: 'LXC', value: 'lxc'},
        LXC = {label: 'KVM', value: 'kvm'},
        VMW = {label: 'VmWare', value: 'vmw'};

    beforeEach(function() {
      window.flags = {};
      this._cleanups.push(function() {
        window.flags = {};
      });
      localStorage.removeItem('force-containers');
    });

    it('disables containers if no container types are supported', function() {
      mockProviderType(this, 'testing', []);
      providerType = 'testing';
      view.render();
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelNoopHeaderView');
      var head = container.one('.column.containers .head a3');
      assert.strictEqual(head.getContent(), 'Sub-containers not supported');
      assert.deepEqual(view.supportedContainerTypes, []);
    });

    it('enables containers if container types are supported', function() {
      mockProviderType(this, 'testing', [KVM, LXC]);
      providerType = 'testing';
      view.render();
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelHeaderView');
      assert.deepEqual(view.supportedContainerTypes, [KVM, LXC]);
    });

    it('enables all containers types if the feature flag is set', function() {
      mockProviderType(this, 'all', [KVM, LXC, VMW]);
      mockProviderType(this, 'testing', []);
      providerType = 'testing';
      window.flags.containers = true;
      view.render();
      // All the container types are enabled even if the current provider type
      // does not support containerization.
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelHeaderView');
      assert.deepEqual(view.supportedContainerTypes, [KVM, LXC, VMW]);
    });

    it('enables all containers types if user sets it', function() {
      localStorage.setItem('force-containers', 'true');
      mockProviderType(this, 'all', [KVM, LXC, VMW]);
      mockProviderType(this, 'testing', []);
      providerType = 'testing';
      view.render();
      // All the container types are enabled even if the current provider type
      // does not support containerization.
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelHeaderView');
      assert.deepEqual(view.supportedContainerTypes, [KVM, LXC, VMW]);
    });



    it('uses the supported container when creating machines', function() {
      mockProviderType(this, 'testing', [KVM, LXC, VMW]);
      providerType = 'testing';
      view.render();
      // Need to click on the more menu to make it render.
      var menu = container.one('.containers .head .more-menu .open-menu');
      menu.simulate('click');
      container.one('.containers .head .moreMenuItem-0').simulate('click');
      // The create machine view container includes the expected options.
      var createMachineViewContainer = container.one('.create-container');
      var options = createMachineViewContainer.all(
          '.containers option:not([disabled])');
      assert.deepEqual(options.getContent(), ['LXC', 'KVM', 'VmWare']);
      assert.deepEqual(options.get('value'), ['lxc', 'kvm', 'vmw']);
    });

    it('wait until the provider type is available', function() {
      mockProviderType(this, 'testing', [LXC]);
      providerType = null;
      view.render();
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelNoopHeaderView');
      var head = container.one('.column.containers .head a3');
      assert.strictEqual(head.getContent(), 'Checking sub-containers support');
      // A callback has been registered listening for provider type changes.
      var env = view.get('env');
      assert.strictEqual(env.once.calledOnce(), true);
      var args = env.once.lastArguments();
      assert.strictEqual(args[0], 'providerTypeChange');
      // The callback is bound to the current view.
      assert.deepEqual(args[2], view);
      // Simulate the provider type becomes available.
      var callback = args[1];
      callback.call(view, {newVal: 'testing'});
      // Now containerization is enabled.
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelHeaderView');
      assert.deepEqual(view.supportedContainerTypes, [LXC]);
    });

    it('does not wait for the provider if the flag is set', function() {
      mockProviderType(this, 'all', [KVM, LXC]);
      providerType = null;
      window.flags.containers = true;
      view.render();
      // Containerization is enabled even if the provider is not known yet.
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelHeaderView');
      assert.deepEqual(view.supportedContainerTypes, [KVM, LXC]);
    });

    it('disables container support if provider is unknown', function() {
      providerType = 'bad-provider';
      view.render();
      assert.strictEqual(
          view._containersHeader.name, 'MachineViewPanelNoopHeaderView');
      var head = container.one('.column.containers .head a3');
      assert.strictEqual(head.getContent(), 'Sub-containers not supported');
      assert.deepEqual(view.supportedContainerTypes, []);
    });

  });

  describe('token drag and drop', function() {
    beforeEach(function() {
      var env = view.get('env');
      env.addMachines = utils.makeStubFunction('add-machine-record-key');
      env.placeUnit = utils.makeStubFunction();
    });

    it('listens for the drag start, end, drop events', function() {
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      view._bindEvents();
      var onStubArgs = onStub.allArguments();
      assert.equal(onStubArgs[0][0], '*:unit-token-drag-start');
      assert.deepEqual(onStubArgs[0][1], view._showDraggingUI);
      assert.equal(onStubArgs[1][0], '*:unit-token-drag-end');
      assert.deepEqual(onStubArgs[1][1], view._hideDraggingUI);
      assert.equal(onStubArgs[2][0], '*:unit-token-drop');
      assert.deepEqual(onStubArgs[2][1], view._unitTokenDropHandler);
    });

    it('converts the headers and tokens to drop targets when dragging',
        function() {
          // This tests assumes the previous test passed:
          // 'listens for the drag start, end, drop events'.
          view.render();
          // The first machine token is automatically selected on render.
          view.set('selectedMachine', null);
          var onStub = utils.makeStubMethod(view, 'on');
          this._cleanups.push(onStub.reset);
          var machineToken = view.get('machineTokens')['0'];
          view._bindEvents();
          view._machinesHeader = { setDroppable: utils.makeStubFunction() };
          view._containersHeader = { setDroppable: utils.makeStubFunction() };
          machineToken.setDroppable = utils.makeStubFunction();
          // unit-drag start handler _showDraggingUI
          onStub.allArguments()[0][1].call(view);
          assert.equal(
              view._machinesHeader.setDroppable.calledOnce(), true,
              'machines header setDroppable not called');
          assert.equal(
              machineToken.setDroppable.calledOnce(), true,
              'machine token setDroppable not called');
          // The user hasn't selected a machine so this header should not be
          // a drop target.
          assert.equal(
              view._containersHeader.setDroppable.calledOnce(), false,
              'containers header setDroppable unexpectedly called');
        });

    // Start dragging a unit on the machine view with a machine selected.
    // Return the machine and container tokens.
    var startDragging = function(test, view) {
      view.render();
      var onStub = utils.makeStubMethod(view, 'on');
      test._cleanups.push(onStub.reset);
      var onboardingStub = utils.makeStubMethod(view, '_hideOnboarding');
      test._cleanups.push(onboardingStub.reset);
      container.append(Y.Node.create(
          '<div class="containers">' +
          '  <div class="content">' +
          '    <div class="items"></div>' +
          '  </div>' +
          '</div>'));
      // Add a container.
      machines.add([{id: '0/lxc/3'}]);
      var machineToken = view.get('machineTokens')['0'];
      var rootToken = view.get('containerTokens')['0/root-container'];
      var containerToken = view.get('containerTokens')['0/lxc/3'];
      view._bindEvents();
      view._machinesHeader = { setDroppable: utils.makeStubFunction() };
      view._containersHeader = { setDroppable: utils.makeStubFunction() };
      machineToken.setDroppable = utils.makeStubFunction();
      containerToken.setDroppable = utils.makeStubFunction();
      rootToken.setDroppable = utils.makeStubFunction();
      view.set('selectedMachine', 1);
      // unit-drag start handler _showDraggingUI
      onStub.allArguments()[0][1].call(view);
      return {
        machine: machineToken,
        rootContainer: rootToken,
        container: containerToken
      };
    };

    it('turns headers/tokens to drop targets (machine selected)', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var tokens = startDragging(this, view);
      // All the headers and tokens are drop targets.
      assert.equal(
          view._machinesHeader.setDroppable.calledOnce(), true,
          'machines header setDroppable not called');
      assert.equal(
          tokens.machine.setDroppable.calledOnce(), true,
          'machine token setDroppable not called');
      // The user selected a machine so this header should be a drop target.
      assert.equal(
          view._containersHeader.setDroppable.calledOnce(), true,
          'containers header setDroppable not called');
      assert.equal(
          tokens.container.setDroppable.calledOnce(), true,
          'container token setDroppable not called');
      assert.equal(
          tokens.rootContainer.setDroppable.calledOnce(), true,
          'root container not set droppable when it should be.');
    });

    it('turns headers/tokens to drop targets (unknown provider)', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      providerType = null;
      // The tokens are not converted to drop targets.
      var tokens = startDragging(this, view);
      assert.equal(
          view._machinesHeader.setDroppable.calledOnce(), true,
          'machines header setDroppable not called');
      assert.equal(
          tokens.machine.setDroppable.calledOnce(), false,
          'machine token setDroppable unexpectedly called');
      assert.equal(
          tokens.container.setDroppable.calledOnce(), false,
          'container token setDroppable unexpectedly called');
      assert.equal(
          tokens.rootContainer.setDroppable.calledOnce(), true,
          'root container not set droppable when it should be.');
    });

    it('turns headers/tokens to drop targets (no containers)', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      mockProviderType(this, 'testing', []);
      providerType = 'testing';
      // The tokens are not converted to drop targets.
      var tokens = startDragging(this, view);
      assert.equal(
          view._machinesHeader.setDroppable.calledOnce(), true,
          'machines header setDroppable not called');
      assert.equal(
          tokens.machine.setDroppable.calledOnce(), false,
          'machine token setDroppable unexpectedly called');
      assert.equal(
          tokens.container.setDroppable.calledOnce(), false,
          'container token setDroppable unexpectedly called');
    });

    it('converts headers to non-drop targets when drag stopped', function() {
      // This tests assumes the previous test passed.
      // 'listens for the drag start, end, drop events'
      var onStub = utils.makeStubMethod(view, 'on');
      this._cleanups.push(onStub.reset);
      var hideOnboardingStub = utils.makeStubMethod(view, '_hideOnboarding');
      this._cleanups.push(hideOnboardingStub.reset);
      container.append(Y.Node.create('<div class="containers">' +
          '<div class="content"><div class="items"></div></div></div>'));
      machines.add([{id: '0/lxc/3'}]);
      var machineToken = view.get('machineTokens')['0'];
      var containerToken = view.get('containerTokens')['0/lxc/3'];
      view._bindEvents();
      view._machinesHeader = { setNotDroppable: utils.makeStubFunction() };
      view._containersHeader = { setNotDroppable: utils.makeStubFunction() };
      machineToken.setNotDroppable = utils.makeStubFunction();
      containerToken.setNotDroppable = utils.makeStubFunction();
      // unit-drag end handler _hideDraggingUI
      onStub.allArguments()[1][1].call(view);
      assert.equal(view._machinesHeader.setNotDroppable.calledOnce(), true);
      assert.equal(view._containersHeader.setNotDroppable.calledOnce(), true);
      assert.equal(machineToken.setNotDroppable.calledOnce(), true);
      assert.equal(containerToken.setNotDroppable.calledOnce(), true);
    });

    it('converts headers to non-drop targets when dropped on a header',
        function() {
          view.render();
          machines.add([{id: '0/lxc/3'}]);
          var machineToken = view.get('machineTokens')['0'];
          var containerToken = view.get('containerTokens')['0/lxc/3'];
          machineToken.setNotDroppable = utils.makeStubFunction();
          containerToken.setNotDroppable = utils.makeStubFunction();
          view._machinesHeader = {
            setNotDroppable: utils.makeStubFunction(),
            updateLabelCount: utils.makeStubFunction()
          };
          view._containersHeader = {
            setNotDroppable: utils.makeStubFunction()
          };
          view._unitTokenDropHandler({
            dropAction: 'machine',
            unit: 'test/1'
          });
          assert.equal(view._machinesHeader.setNotDroppable.calledOnce(), true);
          assert.equal(view._containersHeader.setNotDroppable.calledOnce(),
              true);
          assert.equal(machineToken.setNotDroppable.calledOnce(), true);
          assert.equal(containerToken.setNotDroppable.calledOnce(), true);
        });

    it('creates and selects a new machine when dropped on machine header',
        function() {
          var toggleStub = utils.makeStubMethod(
              view, '_toggleAllPlacedMessage');
          this._cleanups.push(toggleStub.reset);
          var selectStub = utils.makeStubMethod(view, '_selectMachineToken');
          this._cleanups.push(selectStub.reset);
          view.render();
          view._unitTokenDropHandler({
            dropAction: 'machine',
            unit: 'test/1'
          });
          var env = view.get('env');
          // The create machine options should be visible.
          var createMachine = container.one('.create-machine');
          assert.equal(createMachine.hasClass('create-machine-view'), true);
          assert.equal(createMachine.getHTML() === '', false);
          // Confirm the machine creation.
          container.one('.create-machine-view .create').simulate('click');
          assert.deepEqual(env.addMachines.lastArguments()[0], [{
            containerType: undefined,
            parentId: undefined,
            constraints: {
              'cpu-power': '',
              'cpu-cores': '',
              mem: '',
              'root-disk': ''
            }
          }]);
          // A new ghost machine has been added to the database.
          assert.isNotNull(machines.getById('new0'));
          var placeArgs = env.placeUnit.lastArguments();
          assert.strictEqual(placeArgs[0].id, 'test/1');
          assert.equal(placeArgs[1], 'new0');

          // Call count will be 3--once for the create, once when
          // selectFirstMachine is called on render and once more to
          // select the first machine that is added.
          assert.equal(selectStub.callCount(), 3);
        }
    );

    it('creates and selects a new container when dropped on container header',
        function() {
          view.render();
          var toggleStub = utils.makeStubMethod(
              view, '_toggleAllPlacedMessage');
          this._cleanups.push(toggleStub.reset);
          var selectStub = utils.makeStubMethod(view, '_selectContainerToken');
          this._cleanups.push(selectStub.reset);
          view.set('selectedMachine', '5');
          view._unitTokenDropHandler({
            dropAction: 'container',
            unit: 'test/1'
          });
          var env = view.get('env');
          // The create container options should be visible
          var createView = container.one('.create-machine-view');
          assert.equal(createView.hasClass('create-machine-view'), true,
                       'expected class is not present');
          assert.equal(createView.getHTML() === '', false,
                       'HTML is not present');
          // Make sure the correct container type is selected
          var select = createView.one('select');
          select.all('option').each(function(option, index) {
            var value = option.get('value');
            if (value === 'lxc') {
              select.getDOMNode().selectedIndex = index;
            }
          });
          // Confirm the container creation
          createView.one('select').simulate('change');
          createView.one('.create').simulate('click');
          assert.deepEqual(env.addMachines.lastArguments()[0], [{
            containerType: 'lxc',
            parentId: '5',
            constraints: {
              'cpu-power': '',
              'cpu-cores': '',
              mem: '',
              'root-disk': ''
            }
          }], 'Args passed to addMachines are incorrect');
          // A new ghost machine has been added to the database.
          assert.notEqual(machines.getById('5/lxc/new0'), null,
                          'new container is not in the database');
          var placeArgs = env.placeUnit.lastArguments();
          assert.strictEqual(placeArgs[0].id, 'test/1',
                             'the unit ID passed to placeUnit is incorrect');
          assert.equal(placeArgs[1], '5/lxc/new0',
                       'the container ID passed to placeUnit is incorrect');
          assert.equal(selectStub.callCount(), 1);
        }
    );

    it('displays new container form when dropped on a machine', function() {
      view.render();
      var toggleStub = utils.makeStubMethod(view, '_toggleAllPlacedMessage');
      this._cleanups.push(toggleStub.reset);
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0',
        unit: 'test/1'
      });
      // The create container options should be visible
      var createView = container.one('.create-machine-view');
      assert.equal(createView.hasClass('create-machine-view'), true,
                   'expected class is not present');
      assert.equal(createView.getHTML() === '', false,
                   'HTML is not present');
    });

    it('places the unit on and selects an already existing container',
        function() {
          var toggleStub = utils.makeStubMethod(
              view, '_toggleAllPlacedMessage');
          this._cleanups.push(toggleStub.reset);
          var selectMachineStub = utils.makeStubMethod(
              view, '_selectMachineToken');
          this._cleanups.push(selectMachineStub.reset);
          view._machinesHeader = {
            setNotDroppable: utils.makeStubFunction(),
            updateLabelCount: utils.makeStubFunction()
          };
          view._containersHeader = {
            setNotDroppable: utils.makeStubFunction()
          };
          view.set('selectedMachine', 0);
          view._unitTokenDropHandler({
            dropAction: 'container',
            targetId: '0/lxc/1',
            unit: 'test/1'
          });
          var env = view.get('env');
          // The machine is already created so we don't create a new one.
          assert.equal(env.addMachines.callCount(), 0);
          var placeArgs = env.placeUnit.lastArguments();
          assert.strictEqual(placeArgs[0].id, 'test/1');
          assert.equal(placeArgs[1], '0/lxc/1');
          assert.equal(selectMachineStub.callCount(), 1);
        }
    );

    it('places the unit on and selects the existing root conatiner',
        function() {
          var toggleStub = utils.makeStubMethod(
              view, '_toggleAllPlacedMessage');
          this._cleanups.push(toggleStub.reset);
          var selectStub = utils.makeStubMethod(view, '_selectContainerToken');
          this._cleanups.push(selectStub.reset);
          view._machinesHeader = {
            setNotDroppable: utils.makeStubFunction(),
            updateLabelCount: utils.makeStubFunction()
          };
          view._containersHeader = {
            setNotDroppable: utils.makeStubFunction()
          };
          view.set('selectedMachine', 0);
          view.render();
          assert.equal(selectStub.callCount(), 1); // called once by render
          view._unitTokenDropHandler({
            dropAction: 'container',
            targetId: '0/root-container',
            unit: 'test/1'
          });
          var env = view.get('env');
          // The machine is already created so we don't create a new one.
          assert.equal(env.addMachines.callCount(), 0);
          var placeArgs = env.placeUnit.lastArguments();
          assert.strictEqual(placeArgs[0].id, 'test/1');
          assert.equal(placeArgs[1], '0');
          // selectContainerToken called once by selectMachineToken.
          assert.equal(selectStub.callCount(), 2);
        }
    );

    it('can select the root container when selecting the machine', function() {
      var selectRootStub = utils.makeStubMethod(view, '_selectRootContainer');
      this._cleanups.push(selectRootStub.reset);
      var selectContainerStub = utils.makeStubMethod(
          view, '_selectContainerToken');
      this._cleanups.push(selectContainerStub.reset);
      view.set('selectedMachine', 0);
      view.render();
      var machineToken = container.one('.column.machines .items .token');
      assert.equal(selectRootStub.callCount(), 1); // called once by render
      assert.equal(selectContainerStub.callCount(), 0);
      view._selectMachineToken(machineToken);
      assert.equal(selectRootStub.callCount(), 2);
      assert.equal(selectContainerStub.callCount(), 0);
    });

    it('can select another container when selecting the machine', function() {
      var containerId = '0/lxc/12';
      var selectRootStub = utils.makeStubMethod(view, '_selectRootContainer');
      this._cleanups.push(selectRootStub.reset);
      var selectContainerStub = utils.makeStubMethod(
          view, '_selectContainerToken');
      this._cleanups.push(selectContainerStub.reset);
      view.set('selectedMachine', 0);
      view.render();
      machines.add([{id: containerId}]);
      var machineToken = container.one('.column.machines .items .token');
      assert.equal(selectRootStub.callCount(), 1); // called once by render
      assert.equal(selectContainerStub.callCount(), 0);
      view._selectMachineToken(machineToken, containerId);
      assert.equal(selectRootStub.callCount(), 1);
      assert.equal(selectContainerStub.callCount(), 1);
      assert.deepEqual(selectContainerStub.lastArguments()[0], container.one(
          '.container-token .token[data-id="' + containerId + '"]'));
    });

    it('does not allow placement on machines being deleted', function() {
      var notes;
      view.render();
      var toggleStub = utils.makeStubMethod(view, '_toggleAllPlacedMessage');
      var placeStub = utils.makeStubMethod(view, '_placeUnit');
      this._cleanups.push(toggleStub.reset);
      view.get('db').notifications = {
        add: function(args) {
          notes = args;
        }
      };
      machine.deleted = true;
      view._unitTokenDropHandler({
        dropAction: 'container',
        targetId: '0',
        unit: 'test/1'
      });
      assert.equal(placeStub.callCount(), 0);
      assert.equal(
          notes.title,
          'Unable to place the unit on a pending destroyed machine');
    });
  });

  describe('unplaced units column', function() {
    beforeEach(function() {
      var env = view.get('env');
      env.addMachines = utils.makeStubFunction('add-machine-record-key');
      env.placeUnit = utils.makeStubFunction();
    });

    it('should render a list of units', function() {
      view.render();
      var list = container.all('.unplaced .unplaced-unit');
      assert.equal(list.size(), 1,
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var u = units.item(index),
            id = item.getAttribute('data-id');
        assert.equal(id, u.id, 'displayed item does not match model');
      });
    });

    it('displays a message when there are no unplaced units', function() {
      var view = createViewNoUnits();
      view.get('db').services.add([
        {id: 'test', icon: 'test.svg'}
      ]);
      view.render();
      assert.equal(view.get('container').one(
          '.column.unplaced .units').hasClass('state-placed'), true);
    });

    it('doesn\'t show a message when there are unplaced units', function() {
      view.render();
      assert.equal(view.get('container').one(
          '.column.unplaced .units').hasClass('state-placed'), false);
    });

    it('show the list of units when there are unplaced units', function() {
      view.render();
      assert.equal(view.get('container').one(
          '.column.unplaced .units').hasClass('state-units'), true);
    });

    it('hides when the message is hidden and there are no units', function() {
      var view = createViewNoUnits();
      view.render();
      view._toggleAllPlacedMessage(false);
      assert.equal(view.get('container').one(
          '.column.unplaced .units').hasClass('state-hidden'), true);
    });

    it('can auto place all unplaced units on machines', function() {
      var env = view.get('env');
      view.render();
      container.one('.column.unplaced .auto-place').simulate('click');
      assert.equal(env.addMachines.callCount(), 2);
      var placeArgs = env.placeUnit.allArguments()[0];
      assert.strictEqual(placeArgs[0].id, 'test/1',
          'The unit should be placed');
      assert.equal(placeArgs[1], 'new0',
          'The unit should be placed on the new machine');
    });

    it('should add new tokens when units are added', function() {
      view.render();
      var selector = '.unplaced .unplaced-unit',
          list = container.all(selector),
          id = 'test/2';
      assert.equal(list.size(), 1,
                   'initial displayed list is out of sync with unplaced units');
      units.add([{ id: id }]);
      list = container.all(selector);
      assert.equal(list.size(), 2,
                   'final displayed list is out of sync with unplaced units');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added unit in the displayed list');
    });

    it('should display added units on root containers', function() {
      view.render();
      var selector = '.container-token .unit';
      assert.equal(container.all(selector).size(), 0);
      units.add({
        id: 'test/2',
        machine: '0'
      });
      assert.equal(container.all(selector).size(), 1);
    });

    it('update machine token with units when added to machines', function() {
      // The machine tokens which have this unit placed need to be updated
      // with the appropriate unit data to show the tokens after deploy.
      view.render();
      var machineToken = view.get('machineTokens')[0];
      var renderUnits = utils.makeStubMethod(machineToken, 'renderUnits');
      this._cleanups.push(renderUnits.reset);
      var selectMachineToken = utils.makeStubMethod(
          view, '_selectMachineToken');
      this._cleanups.push(selectMachineToken);
      units.add({
        id: 'test/2',
        machine: '0'
      });
      assert.equal(renderUnits.callCount(), 1);
      assert.equal(selectMachineToken.callCount(), 1);
    });

    it('update container token with units when added to container', function() {
      // The container tokens which have this unit placed need to be updated
      // with the appropriate unit data to show the tokens after deploy.
      view.render();
      var containerToken = view.get('containerTokens')['0/root-container'];
      var renderUnits = utils.makeStubMethod(containerToken, 'renderUnits');
      this._cleanups.push(renderUnits.reset);
      var updateMachine = utils.makeStubMethod(
          view, '_updateMachineWithUnitData');
      this._cleanups.push(updateMachine.reset);
      units.add({
        id: 'test/2',
        machine: '0/root-container'
      });
      assert.equal(updateMachine.callCount(), 1);
      assert.equal(renderUnits.callCount(), 1);
    });

    it('should remove tokens when units are deleted', function() {
      view.render();
      var selector = '.unplaced .unplaced-unit',
          list = container.all(selector);
      assert.equal(list.size(), 1,
                   'initial displayed list is out of sync with unplaced units');
      units.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), 0,
                   'final displayed list is out of sync with unplaced units');
      var deletedSelector = selector + '[data-id="test/1"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted unit still in the list');
    });

    it('should re-render token when a unit is updated', function() {
      view.render();
      var name = 'scooby',
          unitModel = units.revive(0),
          id = unitModel.get('id'),
          selector = '.unplaced .unplaced-unit[data-id="{id}"]',
          item;
      selector = Y.Lang.sub(selector, {id: id});
      item = container.one(selector);
      assert.notEqual(item, null, 'unit was not initially displayed');
      unitModel.set('displayName', name);
      item = container.one(selector);
      assert.notEqual(item, null, 'unit was not displayed post-update');
      assert.equal(name, item.one('.title').get('text').trim(),
                   'unit did not have the updated name');
    });

    it('can move the unit to a new machine', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var constraints = {
        'cpu-power': '',
        mem: '',
        'root-disk': ''
      };
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.deepEqual(env.addMachines.lastArguments()[0], [{
          containerType: undefined,
          parentId: null,
          constraints: constraints
        }], 'A new machine should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], 'new0',
            'The unit should be placed on the new machine');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: 'new',
        container: undefined,
        constraints: constraints
      });
    });

    it('can move the unit to a new machine with constraints', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var constraints = {
        'cpu-power': '2',
        mem: '4',
        'root-disk': '6'
      };
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.deepEqual(env.addMachines.lastArguments()[0], [{
          containerType: undefined,
          parentId: null,
          constraints: constraints
        }], 'A new machine should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], 'new0',
            'The unit should be placed on the new machine');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: 'new',
        container: undefined,
        constraints: constraints
      });
    });

    it('can move the unit to a new kvm container', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var constraints = {
        'cpu-power': '4',
        mem: '5',
        'root-disk': '6'
      };
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.deepEqual(env.addMachines.lastArguments()[0], [{
          containerType: 'kvm',
          parentId: '4',
          constraints: constraints
        }], 'A new container should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], '4/kvm/new0',
            'The unit should be placed on the new container');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: '4',
        container: 'kvm',
        constraints: constraints
      });
    });

    it('can move the unit to a new lxc container', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.deepEqual(env.addMachines.lastArguments()[0], [{
          containerType: 'lxc',
          parentId: '42',
          constraints: {}
        }], 'A new container should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], '42/lxc/new0',
            'The unit should be placed on the new container');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: '42',
        container: 'lxc',
        constraints: {}
      });
    });

    it('renders the new container token if the parent is selected', function() {
      view.render();
      var machineToken = container.one('.machines .machine-token .token');
      var unit = {id: 'test/1'};
      machineToken.simulate('click');
      assert.equal(machineToken.hasClass('active'), true);
      assert.equal(container.all('.containers .container-token').size(), 1);
      view._placeServiceUnit({
        unit: unit,
        machine: '0',
        container: 'lxc',
        constraints: {}
      });
      // Need to call placeUnit directly as the view._placeUnit has
      // been mocked out.
      view.get('env').placeUnit(unit, '0');
      assert.equal(container.all('.containers .container-token').size(), 2);
    });

    it('does not render the new container token if the parent is not selected',
        function() {
          view.render();
          var machineToken = container.one('.machines .machine-token .token');
          var unit = {id: 'test/1'};
          machineToken.simulate('click');
          assert.equal(machineToken.hasClass('active'), true);
          assert.equal(container.all('.containers .container-token').size(), 1);
          view._placeServiceUnit({
            unit: unit,
            machine: '1',
            container: 'lxc',
            constraints: {}
          });
          // Need to call placeUnit directly as the view._placeUnit has
          // been mocked out.
          view.get('env').placeUnit(unit, '1');
          assert.equal(container.all('.containers .container-token').size(), 1);
        });

    it('can move the unit to the root container', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var constraints = {
        'cpu-power': '',
        mem: '',
        'root-disk': ''
      };
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.equal(env.addMachines.lastArguments(), undefined,
            'No machines or containers should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], '4',
            'The unit should be placed on the root container');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: '4',
        container: 'root-container',
        constraints: constraints
      });
    });

    it('can move the unit to a container', function(done) {
      view.render();
      var env = view.get('env');
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var constraints = {
        'cpu-power': '',
        mem: '',
        'root-disk': ''
      };
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.equal(env.addMachines.lastArguments(), undefined,
            'No machines or containers should have been created');
        var placeArgs = env.placeUnit.lastArguments();
        assert.strictEqual(placeArgs[0].id, 'test/1',
            'The correct unit should be placed');
        assert.equal(placeArgs[1], '4/lxc/2',
            'The unit should be placed on the container');
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: '4',
        container: '4/lxc/2',
        constraints: constraints
      });
    });

    it('removes the unit token when it has been placed', function(done) {
      view.render();
      var unplacedUnit = container.one('.unplaced .unplaced-unit');
      var unitTokens = view.get('unitTokens');
      assert.equal(Object.keys(unitTokens).length, 1);
      unplacedUnit.on('moveToken', function(e) {
        view._placeServiceUnit(e);
        assert.equal(Object.keys(unitTokens).length, 0);
        assert.equal(container.one('.unplaced .unplaced-unit'), null);
        done();
      });
      // Move the unit.
      unplacedUnit.fire('moveToken', {
        unit: {id: 'test/1'},
        machine: 'new',
        container: undefined,
        constraints: {}
      });
    });

    it('does not show more than one placement form at once', function() {
      view.render();
      units.add([{id: 'test/5'}]);
      var firstToken = container.all('.serviceunit-token').item(0);
      var secondToken = container.all('.serviceunit-token').item(1);
      firstToken.one('.open-menu').simulate('click');
      firstToken.one('li').simulate('click');
      assert.equal(firstToken.hasClass('state-select-machine'), true);
      assert.equal(secondToken.hasClass('state-select-machine'), false);
      // Clicking on a different token should make the second token
      // active, and reset the first token.
      secondToken.one('.open-menu').simulate('click');
      secondToken.one('li').simulate('click');
      assert.equal(firstToken.hasClass('state-select-machine'), false);
      assert.equal(secondToken.hasClass('state-select-machine'), true);
    });

    it('can open the more menu', function() {
      view.render();
      var moreMenuNode = container.one('.unplaced-unit .more-menu');
      moreMenuNode.one('.open-menu').simulate('click');
      assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
    });

    it('only shows one more menu at a time', function() {
      view.render();
      units.add([{id: 'test/5'}]);
      var tokens = container.all('.unplaced-unit');
      var moreMenuNode = tokens.item(0).one('.more-menu');
      var moreMenuNode2 = tokens.item(1).one('.more-menu');
      // Click on both menus to render them.
      moreMenuNode2.one('.open-menu').simulate('click');
      moreMenuNode.one('.open-menu').simulate('click');
      var moreMenu = moreMenuNode.one('.yui3-moremenu');
      var moreMenu2 = moreMenuNode2.one('.yui3-moremenu');
      assert.equal(moreMenu.hasClass('open'), true);
      assert.equal(moreMenu2.hasClass('open'), false);
      moreMenuNode2.one('.open-menu').simulate('click');
      assert.equal(moreMenu.hasClass('open'), false);
      assert.equal(moreMenu2.hasClass('open'), true);
    });
  });


  describe('machine column', function() {
    it('should render a list of machines', function() {
      view.render();
      var list = container.all('.machines .content .items li');
      assert.equal(list.size(), machines.size(),
                   'models are out of sync with displayed list');
      list.each(function(item, index) {
        var m = machines.item(index);
        assert.equal(item.one('.title').get(
            'text').trim().indexOf(m.displayName) === 0,
            true, 'displayed item does not match model');
      });
    });

    it('should set the correct machine count in the header', function() {
      var label = '(1)';
      view.render();
      assert.equal(view._machinesHeader.get(
          'container').one('.label').get('text').trim(), label);
    });

    it('should select the first machine by default', function() {
      view.render();
      assert.equal(container.one(
          '.machines .content li:first-child .token').hasClass('active'),
          true, 'the first machine token should be selected');
    });

    it('should add new tokens when machines are added', function() {
      view.render();
      var selector = '.machines .token',
          list = container.all(selector),
          id = '1';
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.add([{
        id: id,
        parentId: null,
        hardware: {
          disk: 1024,
          mem: 1024,
          cpuPower: 1024,
          cpuCores: 1
        }
      }]);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var addedItem = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(addedItem, null,
                      'unable to find added machine in the displayed list');
    });

    it('appends new real machines to the end of the list', function() {
      machines.reset();
      view.render();
      machines.add({id: '1', parentId: null});
      machines.add({id: '2', parentId: null});
      var tokens = container.all('.machines .token');
      assert.strictEqual(tokens.size(), 2);
      assert.deepEqual(tokens.getData('id'), ['1', '2']);
    });

    it('prepends new ghost machines to the beginning of the list', function() {
      machines.reset();
      view.render();
      machines.add({id: '1', parentId: null, commitStatus: 'committed'});
      machines.add({id: 'new2', parentId: null, commitStatus: 'uncommitted'});
      var tokens = container.all('.machines .token');
      assert.strictEqual(tokens.size(), 2);
      assert.deepEqual(tokens.getData('id'), ['new2', '1']);
    });

    it('should select the first machine when it is added', function() {
      machines.reset();
      assert.equal(machines.size(), 0);
      // Have to re-init so the cached list of machines/tokens is updated.
      view.init();
      view.render();
      assert.equal(view.get('selectedMachine'), undefined);
      machines.add([{id: '0'}]);
      assert.equal(view.get('selectedMachine'), '0');
      assert.equal(container.one(
          '.machines .content li:first-child .token').hasClass('active'),
          true, 'the first machine token should be selected');
    });

    it('should remove tokens when machines are deleted', function() {
      view.render();
      var selector = '.machines .token',
          list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'initial displayed list is out of sync with machines');
      machines.remove(0);
      list = container.all(selector);
      assert.equal(list.size(), machines.size(),
                   'final displayed list is out of sync with machines');
      var deletedSelector = selector + '[data-id="' + machine.id + '"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted machine still in the list');
    });

    it('should show a message when the token is set for removal', function() {
      env.destroyMachines = utils.makeStubFunction();
      view.render();
      var token = container.one('.machines .token');
      assert.equal(token.hasClass('deleted'), false);
      // Need to click on the more menu to make it render.
      token.one('.more-menu .open-menu').simulate('click');
      token.one('.moreMenuItem-0').simulate('click');
      assert.equal(token.hasClass('deleted'), true);
    });

    it('should not try to remove a machine more than once', function() {
      view.render();
      // Need to click on the more menu to make it render.
      container.one('.machine-token .more-menu .open-menu').simulate('click');
      var deleteNode = container.one('.machine-token .moreMenuItem-0');
      view.set('env', {
        destroyMachines: utils.makeStubFunction()
      });
      deleteNode.simulate('click');
      // Manually set the deleted flag as we've stubbed out the
      // destroyMachines method that would do this.
      view.get('db').machines.getById('0').deleted = true;
      deleteNode.simulate('click');
      assert.equal(view.get('env').destroyMachines.calledOnce(), true);
    });

    it('can reset uncommitted units', function() {
      var stubRender = utils.makeStubMethod(view, '_renderUnplacedUnits');
      var stubToggle = utils.makeStubMethod(view, '_toggleOnboarding');
      this._cleanups.push(stubRender.reset);
      this._cleanups.push(stubToggle.reset);

      var machine = machines.item(0);
      machine.units = [{
        id: 'foo/0',
        agent_state: 'started'
      }, {
        id: 'foo/1'
      }];
      view.render();
      assert.equal(stubRender.calledOnce(), true, 'Render not called');
      assert.equal(stubToggle.calledOnce(), true, 'Toggle not called');
      view.removeUncommittedUnitsFromMachine(machine);
      assert.equal(stubRender.callCount(), 2, 'Render not called');
      assert.equal(stubToggle.callCount(), 2, 'Toggle not called');
    });

    it('resets uncommitted units when a machine is deleted', function() {
      view.render();
      view.set('env', {
        destroyMachines: utils.makeStubFunction()
      });
      var stubRemove = utils.makeStubMethod(
          view, 'removeUncommittedUnitsFromMachine');
      this._cleanups.push(stubRemove.reset);
      container.one('.machine-token .more-menu .open-menu').simulate('click');
      var deleteNode = container.one('.machine-token .moreMenuItem-0');
      deleteNode.simulate('click');
      assert.equal(stubRemove.calledOnce(), true);
    });

    it('should re-render token when machine is updated', function() {
      view.render();
      var id = '999',
          machineModel = machines.item(0),
          selector = '.machines .token',
          item = container.one(
              selector + '[data-id="' + machineModel.id + '"]');
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(item.one('.title').get(
          'text').trim().indexOf(machineModel.displayName) === 0,
          true, 'initial machine names do not match');
      machines.updateModelId(machineModel, id, true);
      item = container.one(selector + '[data-id="' + id + '"]');
      assert.notEqual(item, null, 'machine was not displayed post-update');
      assert.equal(item.one('.title').get(
          'text').trim().indexOf(machineModel.displayName) === 0,
          true, 'machine names do not match post-update');
    });

    it('re-renders the container tokens then machine is updated', function() {
      // When a machine is updated if it's selected we want to re-render
      // any of it's container tokens so that they can also updated with the
      // new status. Such as uncommitted to committed.
      //
      // This test relies on the previous test passing successfully
      //   'should re-render token when machine is updated'
      view.render();
      var id = 999,
          machineModel = machines.item(0),
          selector = '.machines .token',
          item = container.one(
              selector + '[data-id="' + machineModel.id + '"]');
      var unselect = utils.makeStubMethod(view, '_unselectIfHidden');
      this._cleanups.push(unselect.reset);
      var selectToken = utils.makeStubMethod(view, '_selectMachineToken');
      view.set('selectedMachine', 999);
      machines.updateModelId(machineModel, id, true);
      assert.equal(
          selectToken.calledOnce(), true, 'Selected token not called once');
      assert.equal(
          unselect.callCount() > 0, true, '_unselectIfHidden not called');
    });

    it('unselects a machine token if machine is hidden', function() {
      // It should also clear the container column.
      view.render();
      var clear = utils.makeStubMethod(view, '_clearContainerColumn');
      this._cleanups.push(clear.reset);
      view._unselectIfHidden({
        id: '0',
        hide: true
      });
      assert.equal(clear.callCount(), 1);
      assert.strictEqual(view.get('selectedMachine'), null);
    });

    it('should set the correct counts in the container header', function(done) {
      var labels = ['2 containers', '1 unit'];
      view.render();
      var machineToken = container.one('.machines li .token');
      machines.add([
        {id: '0/lxc/1'},
        {id: '0/lxc/2'}
      ]);
      // Add a unit to the machine.
      view.get('db').units.add([{id: 'test/2', machine: '0'}]);
      machineToken.on('click', function(e) {
        // Need to explicitly fire the click handler as we are catching
        // the click event before it can be fired.
        view.handleMachineTokenSelect(e);
        labels.forEach(function(l, index) {
          assert.equal(view._containersHeader.get(
              'container').all('.label').item(index).get('text').trim(), l);
        });
        done();
      });
      machineToken.simulate('click');
    });

    it('should select a token when clicked', function() {
      view.render();
      machines.add([
        {id: '0/lxc/1'}
      ]);
      // Click on a machine so that we have a list of containers.
      container.one('.machines li .token').simulate('click');
      // Now select a container.
      var containerToken = container.one('.containers li .token');
      containerToken.simulate('click');
      assert.equal(containerToken.hasClass('active'), true);
    });

    it('should annotate units with icons for its tokens', function() {
      var db = view.get('db'),
          unit = {id: 'foo/0', service: 'foo' };
      db.services.add({ id: 'foo', icon: 'http://example.com/foo.png' });
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(unit.icon, 'http://example.com/foo.png');
    });

    it('should log an error when it cannot find the service', function() {
      var unit = {id: 'foo/0', service: 'foo' },
          errorStub = utils.makeStubMethod(console, 'error');
      this._cleanups.push(errorStub.reset);
      unit = view._addIconsToUnits([unit])[0];
      assert.equal(errorStub.calledOnce(), true);
      assert.equal(errorStub.lastArguments(), 'Unit foo/0 has no service.');
    });

    it('should update a machine when a new unit is placed', function() {
      view.render();
      var machineModel = machines.revive(0),
          unitModel = units.revive(0),
          id = machineModel.get('id'),
          selector = Y.Lang.sub('.machines .token[data-id="{id}"]', {id: id}),
          item = container.one(selector);
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(item.one('img.unit'), null,
                   'machine should not have any unit icons initially');
      unitModel.set('machine', id);
      item = container.one(selector);
      assert.notEqual(item, null, 'machine was not displayed post-update');
      var icon = item.one('img.unit');
      assert.equal(icon.getAttribute('src'), 'test.svg',
                   'machine should display icons post-update');
    });

    it('should update machine when a unit is added to a container', function() {
      view.render();
      var machineModel = machines.revive(0),
          unitModel = units.revive(0),
          id = machineModel.get('id'),
          containerId = id + '/lxc/3',
          selector = Y.Lang.sub('.machines .token[data-id="{id}"]', {id: id}),
          item = container.one(selector);
      machines.add([{id: containerId}]);
      assert.notEqual(item, null, 'machine was not initially displayed');
      assert.equal(item.one('img.unit'), null,
                   'machine should not have any unit icons initially');
      unitModel.set('machine', containerId);
      item = container.one(selector);
      assert.notEqual(item, null, 'machine was not displayed post-update');
      var icon = item.one('img.unit');
      assert.equal(icon.getAttribute('src'), 'test.svg',
                   'machine should display icons post-update');
    });

    it('should add tokens when containers are added', function() {
      view.render();
      var selector = '.containers .token',
          list = container.all(selector),
          id = '0/foo/999',
          initialSize = list.size();
      assert.equal(initialSize, 1,
                   'check the initial size');
      machines.add([
        { id: id }
      ]);
      list = container.all(selector);
      assert.equal(list.size(), 2, 'list should have updated');
      assert.equal(container.all(selector).item(1).getData('id'), '0/foo/999',
          'the container should be in the displayed list');
    });

    it('should remove tokens when containers are removed', function() {
      var id = '0/foo/999';
      view.render();
      machines.add([{ id: id }]);
      var selector = '.containers .token',
          list = container.all(selector),
          initialSize = list.size(),
          m = machines.getById(id);
      assert.equal(initialSize, 2,
                   'check the initial size');
      machines.remove(m);
      list = container.all(selector);
      assert.equal(list.size(), 1,
                   'list should have changed in size');
      var deletedSelector = selector + '[data-id="' + id + '"]';
      var deletedItem = container.one(deletedSelector);
      assert.equal(deletedItem, null,
                   'found the deleted container in the list');
    });

    it('should update tokens when containers are changed', function() {
      var id = '0/foo/999';
      view.render();
      machines.add([{ id: id }]);
      var selector = '.containers .token',
          list = container.all(selector),
          initialSize = list.size(),
          m = machines.getById(id);
      var oldItem = container.one(selector + '[data-id="' + id + '"]');
      assert.equal(initialSize, 2,
                   'check the initial size');
      m = machines.revive(m);
      assert.equal(oldItem === null, false, 'the item should exist');
      m.set('id', '2/foo/1000');
      list = container.all(selector);
      assert.equal(list.size(), 2,
                   'list should not have changed in size');
      oldItem = container.one(selector + '[data-id="' + id + '"]');
      assert.equal(oldItem, null,
          'the old item should no longer exist');
      var changedSelector = selector + '[data-id="2/foo/1000"]';
      var changedItem = container.one(changedSelector);
      assert.equal(changedItem === null, false,
                   'the new item should be in the list');
    });

    it('should remove all tokens on destroy', function() {
      view.render();
      view.destroy();
      assert.equal(Object.keys(view.get('machineTokens')).length, 0,
                   'No machine tokens should exist');
      assert.equal(Y.all('.machines .token').size(), 0,
                   'No machine DOM elements should exist');
      assert.equal(Object.keys(view.get('containerTokens')).length, 0,
                   'No container tokens should exist');
      assert.equal(Y.all('.countainers .token').size(), 0,
                   'No container DOM elements should exist');
      assert.equal(Object.keys(view.get('unitTokens')).length, 0,
                   'No service unit tokens should exist');
      assert.equal(Y.all('.unplaced .unplaced-unit').size(), 0,
                   'No service unit DOM elements should exist');
    });

    it('can open the more menu', function() {
      view.render();
      var moreMenuNode = container.one('.machine-token .more-menu');
      moreMenuNode.one('.open-menu').simulate('click');
      assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
    });

    it('can toggle the constraints', function() {
      view.render();
      machines.add([{id: '17'}]);
      var tokenDetails = container.one('.machine-token:last-child .details');
      var headerMenu = container.one('.column.machines .head .more-menu');
      // Need to click on the more menu to render the items.
      headerMenu.one('.open-menu').simulate('click');
      var menuItem = headerMenu.one('.moreMenuItem-1');
      // Check the initial state.
      assert.equal(tokenDetails.hasClass('hidden'), false);
      assert.equal(menuItem.get('text').trim(), 'Hide constraints');
      // Toggle to the hidden state.
      menuItem.simulate('click');
      assert.equal(tokenDetails.hasClass('hidden'), true);
      assert.equal(menuItem.get('text').trim(), 'Show constraints');
      // Toggle back to the visible state.
      headerMenu.one('.open-menu').simulate('click');
      menuItem.simulate('click');
      assert.equal(tokenDetails.hasClass('hidden'), false);
      assert.equal(menuItem.get('text').trim(), 'Hide constraints');
    });

    it('still shows the constraints for the selected machine', function() {
      view.render();
      machines.add([{id: '17'}]);
      var firstTokenDetails = container.one('.machine-token .details');
      var secondTokenDetails = container.one(
          '.machine-token:last-child .details');
      var headerMenu = container.one('.column.machines .head .more-menu');
      // Need to click on the more menu to render the items.
      headerMenu.one('.open-menu').simulate('click');
      var menuItem = headerMenu.one('.moreMenuItem-1');
      menuItem.simulate('click');
      assert.equal(firstTokenDetails.hasClass('hidden'), false);
      assert.equal(secondTokenDetails.hasClass('hidden'), true);
      // Now select the second token.
      secondTokenDetails.simulate('click');
      assert.equal(firstTokenDetails.hasClass('hidden'), true);
      assert.equal(secondTokenDetails.hasClass('hidden'), false);
    });

    it('has the correct constraints state on new machine tokens', function() {
      view.render();
      machines.add([{id: '16'}]);
      var tokenDetails = container.one('.machine-token:last-child .details');
      var headerMenu = container.one('.column.machines .head .more-menu');
      // Need to click on the more menu to render the items.
      headerMenu.one('.open-menu').simulate('click');
      var menuItem = headerMenu.one('.moreMenuItem-1');
      // Toggle to the hidden state.
      menuItem.simulate('click');
      assert.equal(tokenDetails.hasClass('hidden'), true);
      assert.equal(menuItem.get('text').trim(), 'Show constraints');
      machines.add([{id: '17'}]);
      assert.equal(container.one('.machine-token:last-child .details').hasClass(
          'hidden'), true);
    });

    it('can sort the machines by name', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '11'},
        {id: '12'},
        {id: '10'}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-3').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '10');
      assert.equal(machineTokens.item(1).getData('id'), '11');
      assert.equal(machineTokens.item(2).getData('id'), '12');
    });

    it('can correctly sort numbers', function() {
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.reset();
      machines.add([
        {id: '10'},
        {id: 'new1'},
        {id: '1'},
        {id: '2'},
        {id: 'new0'},
        {id: '0'},
        {id: 'new12'},
        {id: 'new3'}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-3').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '0');
      assert.equal(machineTokens.item(1).getData('id'), '1');
      assert.equal(machineTokens.item(2).getData('id'), '2');
      assert.equal(machineTokens.item(3).getData('id'), '10');
      assert.equal(machineTokens.item(4).getData('id'), 'new0');
      assert.equal(machineTokens.item(5).getData('id'), 'new1');
      // new12 and new3 can not be sorted correctly as the number
      // padding only helps with strings that contain only integers.
      assert.equal(machineTokens.item(6).getData('id'), 'new12');
      assert.equal(machineTokens.item(7).getData('id'), 'new3');
    });

    it('can sort the machines by the number of services', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '11'},
        {id: '12'},
        {id: '10'}
      ]);
      machines.getById('12').units = [{service: '1'}, {service: '2'}];
      machines.getById('10').units = [{service: '1'}];
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-4').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '12');
      assert.equal(machineTokens.item(1).getData('id'), '10');
      assert.equal(machineTokens.item(2).getData('id'), '11');
    });

    it('can sort the machines by the number of units', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '11'},
        {id: '12'},
        {id: '10'}
      ]);
      machines.getById('12').units = [{id: 'test/1'}];
      machines.getById('10').units = [{id: 'test/2'}, {id: 'test/3'}];
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-5').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '10');
      assert.equal(machineTokens.item(1).getData('id'), '12');
      assert.equal(machineTokens.item(2).getData('id'), '11');
    });

    it('can sort the machines by disk', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '12', hardware:
              {disk: 1024, mem: 1024, cpuPower: 1024, cpuCores: 1}},
        {id: '11', hardware:
              {disk: null, mem: 1024, cpuPower: 1024, cpuCores: 1}},
        {id: '10', hardware:
              {disk: 2048, mem: 1024, cpuPower: 1024, cpuCores: 1}}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-6').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '10');
      assert.equal(machineTokens.item(1).getData('id'), '12');
      assert.equal(machineTokens.item(2).getData('id'), '11');
    });

    it('can sort the machines by ram', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '12', hardware:
              {disk: 1024, mem: null, cpuPower: 1024, cpuCores: 1}},
        {id: '11', hardware:
              {disk: null, mem: 2024, cpuPower: 1024, cpuCores: 1}},
        {id: '10', hardware:
              {disk: 2048, mem: 1024, cpuPower: 1024, cpuCores: 1}}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-7').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '11');
      assert.equal(machineTokens.item(1).getData('id'), '10');
      assert.equal(machineTokens.item(2).getData('id'), '12');
    });

    it('can sort the machines by cpu', function() {
      machines.reset();
      view.render();
      var moreMenuNode = container.one('.column.machines .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var machineTokens;
      machines.add([
        {id: '12', hardware:
              {disk: 1024, mem: null, cpuPower: 1024, cpuCores: 1}},
        {id: '11', hardware:
              {disk: null, mem: 2024, cpuPower: null, cpuCores: 1}},
        {id: '10', hardware:
              {disk: 2048, mem: 1024, cpuPower: 2024, cpuCores: 1}}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-8').simulate('click');
      machineTokens = container.all('.machine-token .token');
      assert.equal(machineTokens.item(0).getData('id'), '10');
      assert.equal(machineTokens.item(1).getData('id'), '12');
      assert.equal(machineTokens.item(2).getData('id'), '11');
    });
  });

  describe('container column', function() {
    it('creates container tokens without units', function() {
      var updateStub = utils.makeStubMethod(
          view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; },
        destroy: function() {},
        get: function() {
          return {remove: function() {}};
        },
        on: function() {
          return {detach: function() {}};
        }
      });
      this._cleanups.push(viewStub.reset);
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          container = {id: '0/lxc/5'};
      view._createContainerToken(containerParent, container, true);
      // Verify that units for the container were looked up since they weren't
      // provided
      assert.equal(filterStub.calledOnce(), true);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens with units', function() {
      var updateStub = utils.makeStubMethod(view, '_updateMachineWithUnitData');
      this._cleanups.push(updateStub.reset);
      var db = view.get('db'),
          filterStub = utils.makeStubMethod(db.units, 'filterByMachine');
      this._cleanups.push(filterStub.reset);
      var rendered = false,
          target;
      var viewStub = utils.makeStubMethod(views, 'ContainerToken', {
        render: function() { rendered = true; },
        addTarget: function(t) { target = t; },
        destroy: function() {},
        get: function() {
          return {remove: function() {}};
        },
        on: function() {
          return {detach: function() {}};
        }
      });
      this._cleanups.push(viewStub.reset);
      var containerParent = utils.makeContainer(this, 'machine-view-panel'),
          units = [{}],
          container = {id: '0/lxc/5'};
      view._createContainerToken(containerParent, container, true, units);
      // Verify that units for the container were provided, and not looked up.
      assert.equal(filterStub.calledOnce(), false);
      assert.equal(updateStub.calledOnce(), true);
      assert.equal(viewStub.calledOnce(), true);
      // Verify token is rendered and has the view added as a target.
      assert.equal(rendered, true);
      assert.equal(target, view);
    });

    it('creates container tokens when a machine is selected', function() {
      view.render();
      var target = container.one('.machines li .token');
      target.setData('id', '0');
      var mockEvent = {
        currentTarget: target,
        preventDefault: function() {}
      };
      machines.add([{ id: '0/lxc/0' }]);
      var renderStub = utils.makeStubMethod(view, '_renderContainerTokens');
      this._cleanups.push(renderStub.reset);
      view.handleMachineTokenSelect(mockEvent);
      assert.equal(renderStub.calledOnce(), true);
      var lastArgs = renderStub.lastArguments();
      assert.equal(lastArgs[0][0].displayName, '0/lxc/0');
      assert.equal(lastArgs[1], '0');
    });

    it('creates tokens for containers including the root', function() {
      view.render();
      machines.add([{ id: '0/lxc/0' }]);
      var containers = machines.filterByAncestor('0');
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens(containers, '0');
      assert.equal(tokenStub.callCount(), 2);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, 'Root container');
      assert.equal(tokenArguments[1][1].displayName, '0/lxc/0');
    });

    it('creates tokens for nested containers', function() {
      var id = '0/kvm/0/lxc/0';
      view.render();
      machines.add([{id: id}]);
      var containers = machines.filterByAncestor('0');
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens(containers, '0');
      assert.equal(tokenStub.callCount(), 2);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[1][1].displayName, id);
    });

    it('always creates a root container token', function() {
      view.render();
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens([], '0');
      assert.equal(tokenStub.callCount(), 1);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][1].displayName, 'Root container');
    });

    it('creates container tokens with proper committed state', function() {
      view.render();
      machines.getById('0').commitStatus = 'in-progress';
      machines.add([{ id: '0/lxc/new1', commitStatus: 'uncommitted' }]);
      var containers = machines.filterByAncestor('0');
      var tokenStub = utils.makeStubMethod(view, '_createContainerToken');
      this._cleanups.push(tokenStub.reset);
      view._renderContainerTokens(containers, '0');
      assert.equal(tokenStub.callCount(), 2);
      var tokenArguments = tokenStub.allArguments();
      assert.equal(tokenArguments[0][2], 'in-progress',
                   'root container does not have expected committed state');
      assert.equal(tokenArguments[1][2], 'uncommitted',
                   'new container does not have expected uncommitted state');
    });

    it('displays the container count in the header', function() {
      view.render();
      machines.add([{id: '0/lxc/0'}]);
      container.one('.machine-token .token').simulate('click');
      var containerCount = Object.keys(machines.filterByAncestor('0')).length;
      assert.equal(containerCount > 0, true);
      assert.equal(container.one(
          '.column.containers .head .label:first-child').get('text').trim(),
          containerCount + ' container');
    });

    it('updates the container count when a container is added', function() {
      view.render();
      container.one('.machine-token .token').simulate('click');
      var selector = '.column.containers .head .label:first-child';
      assert.equal(container.one(selector).get('text').trim(),
          '0 containers');
      machines.add([{id: '0/lxc/0'}]);
      assert.equal(container.one(selector).get('text').trim(),
          '1 container');
    });

    it('updates the container count when a container is removed', function() {
      var id = '0/lxc/0';
      view.render();
      machines.add([{id: id}]);
      container.one('.machine-token .token').simulate('click');
      var selector = '.column.containers .head .label:first-child';
      assert.equal(container.one(selector).get('text').trim(),
          '1 container');
      machines.remove(machines.getById(id));
      assert.equal(container.one(selector).get('text').trim(),
          '0 containers');
    });

    it('should show a message when the token is set for removal', function() {
      env.destroyMachines = utils.makeStubFunction();
      view.render();
      machines.add([{ id: '0/lxc/0' }]);
      container.one('.machine-token').simulate('click');
      var token = container.one(
          '.containers .container-token:last-child .token');
      assert.equal(token.hasClass('deleted'), false);
      token.simulate('click');
      // Need to click on the more menu to make it render.
      token.one('.more-menu .open-menu').simulate('click');
      token.one('.moreMenuItem-0').simulate('click');
      assert.equal(token.hasClass('deleted'), true);
    });

    it('should not try to remove a container more than once', function() {
      var id = '0/lxc/0';
      view.render();
      machines.add([{id: id}]);
      container.one('.container-token:last-child .token').simulate('click');
      // Need to click on the more menu to make it render.
      container.one('.container-token:last-child .more-menu .open-menu')
          .simulate('click');
      var deleteNode = container.one(
          '.container-token:last-child .moreMenuItem-0');
      view.set('env', {
        destroyMachines: utils.makeStubFunction()
      });
      deleteNode.simulate('click');
      // Manually set the deleted flag as we've stubbed out the
      // destroyMachines method that would do this.
      machines.getById(id).deleted = true;
      deleteNode.simulate('click');
      assert.equal(view.get('env').destroyMachines.calledOnce(), true);
    });

    it('can open the more menu', function() {
      view.render();
      machines.add([{id: '0/lxc/0'}]);
      var token = container.one('.container-token:last-child .token');
      token.simulate('click');
      var moreMenuNode = token.one('.more-menu');
      moreMenuNode.one('.open-menu').simulate('click');
      assert.equal(moreMenuNode.one('.yui3-moremenu').hasClass('open'), true);
    });

    it('can sort the containers by name', function() {
      view.render();
      var moreMenuNode = container.one('.column.containers .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var containerTokens;
      machines.add([
        {id: '0/lxc/11'},
        {id: '0/lxc/12'},
        {id: '0/lxc/10'}
      ]);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-2').simulate('click');
      containerTokens = container.all('.container-token .token');
      assert.equal(containerTokens.item(1).getData('id'), '0/lxc/10');
      assert.equal(containerTokens.item(2).getData('id'), '0/lxc/11');
      assert.equal(containerTokens.item(3).getData('id'), '0/lxc/12');
    });

    it('can sort the containers by service', function() {
      view.render();
      var moreMenuNode = container.one('.column.containers .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var containerTokens;
      machines.add([
        {id: '0/lxc/11'},
        {id: '0/lxc/12'},
        {id: '0/lxc/10'}
      ]);
      machines.getById('0/lxc/12').units = [{service: '2'}];
      machines.getById('0/lxc/10').units = [{service: '1'}];
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-4').simulate('click');
      containerTokens = container.all('.container-token .token');
      assert.equal(containerTokens.item(1).getData('id'), '0/lxc/11');
      assert.equal(containerTokens.item(2).getData('id'), '0/lxc/10');
      assert.equal(containerTokens.item(3).getData('id'), '0/lxc/12');
    });

    it('can sort the containers by the number of units', function() {
      view.render();
      var moreMenuNode = container.one('.column.containers .head .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var containerTokens;
      machines.add([
        {id: '0/lxc/11'},
        {id: '0/lxc/12'},
        {id: '0/lxc/10'}
      ]);
      machines.getById('0/lxc/12').units = [{id: 'test/1'}];
      machines.getById('0/lxc/10').units = [{id: 'test/2'}, {id: 'test/3'}];
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-3').simulate('click');
      containerTokens = container.all('.container-token .token');
      assert.equal(containerTokens.item(1).getData('id'), '0/lxc/10');
      assert.equal(containerTokens.item(2).getData('id'), '0/lxc/12');
      assert.equal(containerTokens.item(3).getData('id'), '0/lxc/11');
    });

    it('can render the more menu on container units', function() {
      view.render();
      units.add({
        id: 'test/2',
        machine: '0'
      });
      var moreMenuNode = container.one('.container-token .unit .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      assert.equal(moreMenuNode.one('.yui3-moremenu'), null);
      openMenu.simulate('click');
      assert.equal(moreMenuNode.one('.yui3-moremenu') !== null, true);
    });

    it('can delete uncommitted units', function() {
      env.remove_units = utils.makeStubFunction();
      view.render();
      units.add({
        id: 'test/2',
        machine: '0'
      });
      var unitNode = container.one('.container-token .unit');
      var moreMenuNode = unitNode.one('.more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      assert.equal(unitNode !== null, true);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-0').simulate('click');
      assert.equal(container.one('.container-token .unit'), null);
      assert.equal(env.remove_units.calledOnce(), true);
    });

    it('updates the unit count when uncommitted units are deleted', function() {
      env.remove_units = utils.makeStubFunction();
      view.render();
      units.add({
        id: 'test/2',
        machine: '0'
      });
      var moreMenuNode = container.one('.container-token .unit .more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      var labelSelector = '.column.containers .head .label:last-child';
      assert.equal(container.one(labelSelector).get('text').trim(), '1 unit');
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-0').simulate('click');
      assert.equal(container.one(labelSelector).get('text').trim(), '0 units');
    });

    it('can delete committed units', function() {
      env.remove_units = utils.makeStubFunction();
      view.render();
      units.add({
        id: 'test/2',
        machine: '0',
        agent_state: 'started'
      });
      var unitNode = container.one('.container-token .unit');
      var moreMenuNode = unitNode.one('.more-menu');
      var openMenu = moreMenuNode.one('.open-menu');
      assert.equal(unitNode.hasClass('.deleted'), false);
      openMenu.simulate('click');
      moreMenuNode.one('.moreMenuItem-0').simulate('click');
      assert.equal(unitNode.hasClass('.deleted'), true);
      assert.equal(env.remove_units.calledOnce(), true);
    });

    describe('functional tests', function() {
      it('can render containers on click of machine token', function() {
        view.render();
        machines.add([{id: '5'}, {id: '5/lxc/0'}]);
        view.get('db').units.add([{id: 'test/2', machine: '0'}]);
        var token = container.one('.machine-token:last-child .token');
        assert.equal(
            token.hasClass('active'), false,
            'Machine token already selected.');
        token.simulate('click');
        assert.equal(
            token.hasClass('active'), true,
            'Machine token not marked as selected.');
        var containers = container.all('.container-token .token'),
            hardware = token.one('.details').get('text').replace(/\s+/g, '');
        // We should have one token for the new container and one for the
        // root container.
        assert.equal(containers.size(), 2, 'Containers did not render.');
        assert.equal(hardware, 'Hardwaredetailsnotavailable');
      });

      it('can select container tokens', function() {
        view.render();
        machines.add([{ id: '0/lxc/0' }]);
        view.get('db').units.add([{id: 'test/2', machine: '0'}]);
        var machineToken = container.one('.machine-token .token');
        machineToken.simulate('click');
        var containerToken = container.one(
            '.container-token:last-child .token');
        assert.equal(
            containerToken.hasClass('active'), false,
            'Container token already selected.');
        containerToken.simulate('click');
        assert.equal(
            containerToken.hasClass('active'), true,
            'Container token not marked as selected.');
      });

      it('should select the root container by default', function() {
        view.render();
        machines.add([{ id: '0/lxc/0' }]);
        view.get('db').units.add([{id: 'test/2', machine: '0'}]);
        var machineToken = container.one('.machine-token .token');
        machineToken.simulate('click');
        assert.equal(container.one(
            '.containers .content li:first-child .token').hasClass('active'),
            true, 'the root container token should be selected');
      });
    });
  });

  describe('mass scale up UI', function() {
    it('should render the scale up UI', function() {
      view.render();
      assert.equal(container.one(
          '.column.unplaced .scale-up .action-block span').get('text'),
          'New units');
    });

    it('should render the mass scale up UI', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub,
        enableScaleUp: utils.makeStubFunction()
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      assert.equal(scaleUpView.calledOnce(), true);
      assert.equal(scaleUpViewRender.calledOnce(), true);
      assert.equal(onStub.callCount(), 3);
      var onArgs = onStub.lastArguments();
      assert.equal(onArgs[0], 'listClosed');
    });

    it('properly destroys the scale up view up on destroy', function() {
      var detachStub = utils.makeStubFunction();
      var onStub = utils.makeStubFunction({ detach: detachStub });
      var destroyStub = utils.makeStubFunction();
      scaleUpViewRender = utils.makeStubFunction({
        on: onStub,
        destroy: destroyStub,
        enableScaleUp: utils.makeStubFunction()
      });
      scaleUpView = utils.makeStubMethod(views, 'ServiceScaleUpView', {
        render: scaleUpViewRender
      });
      this._cleanups.push(scaleUpView.reset);
      view.render();
      view.destroy();
      assert.equal(detachStub.callCount(), 3);
      assert.equal(destroyStub.callCount(), 1);
    });

    it('disables when there are no services', function() {
      var db = view.get('db');
      // Clear all the services from the list.
      db.services.reset();
      assert.equal(db.services.size(), 0,
          'There need to be 0 services for this test');
      view.render();
      assert.equal(view.get('container').one(
          '.service-scale-up-view .action-block').hasClass('enabled'), false);
    });

    it('disables when there are no principal services', function() {
      var db = view.get('db');
      // Clear all the services from the list and add a subordinate service.
      db.services.reset();
      db.services.add({id: 'puppet', 'subordinate': true});
      view.render();
      assert.strictEqual(view.get('container').one(
          '.service-scale-up-view .action-block').hasClass('enabled'), false);
    });

    it('shows the onboarding when there are no services', function() {
      var db = view.get('db');
      // Clear all the services from the list.
      db.services.reset();
      assert.equal(db.services.size(), 0,
          'There need to be 0 services for this test');
      view.render();
      assert.equal(view.get('container').one(
          '.units').hasClass('state-add'), true);
    });

    it('enables when there are services', function() {
      var db = view.get('db');
      assert.equal(db.services.size() > 0, true,
          'There need to be some services for this test');
      view.render();
      assert.equal(view.get('container').one(
          '.service-scale-up-view .action-block').hasClass('enabled'), true);
    });

    it('enables when a service is added', function() {
      var db = view.get('db');
      // Clear all the services from the list.
      db.services.reset();
      assert.equal(db.services.size(), 0,
          'There initially need to be 0 services for this test');
      view.render();
      assert.equal(container.one(
          '.service-scale-up-view .action-block').hasClass('enabled'), false);
      services.add([{id: 'test'}]);
      assert.equal(container.one(
          '.service-scale-up-view .action-block').hasClass('enabled'), true);
    });

    it('hides when all services are removed', function() {
      var db = view.get('db');
      // Clear and add once service for later removal.
      db.services.reset();
      services.add([{id: 'test'}]);
      assert.equal(db.services.size() > 0, true,
          'There initially need to be some services for this test');
      view.render();
      assert.equal(container.one(
          '.service-scale-up-view .action-block').hasClass('enabled'), true);
      db.services.remove(0);
      assert.equal(db.services.size(), 0,
          'There now should be 0 services');
      assert.equal(container.one(
          '.service-scale-up-view .action-block').hasClass('enabled'), false);
    });

    it('calls _scaleUpService on addUnit', function() {
      var scale = utils.makeStubMethod(view, '_scaleUpService');
      this._cleanups.push(scale.reset);
      view.render();
      view._scaleUpView.fire('addUnit');
      assert.equal(scale.calledOnce(), true);
    });

    it('calls addGhostAndEcsUnits on scale-up', function() {
      var addGhost = utils.makeStubMethod(
          Y.juju.views.utils, 'addGhostAndEcsUnits');
      this._cleanups.push(addGhost);

      var db = {
        services: {
          getById: utils.makeStubFunction('serviceName') }};
      var env = { foo: 'bar' };

      view.set('db', db);
      view.set('env', env);

      view._scaleUpService({
        serviceName: 'foo',
        unitCount: 7
      });

      assert.equal(addGhost.calledOnce(), true);
      var addArgs = addGhost.lastArguments();
      assert.deepEqual(addArgs[0], db);
      assert.deepEqual(addArgs[1], env);
      assert.equal(addArgs[2], 'serviceName');
      assert.equal(addArgs[3], 7);
      assert.equal(typeof addArgs[4], 'function');
    });

    it('hides the "all placed" message when the service list is displayed',
        function() {
          var view = createViewNoUnits();
          view.get('db').services.add([{id: 'test', icon: 'test.svg'}]);
          view.render();
          // The message should be display initially.
          var message = view.get('container').one('.column.unplaced .units');
          assert.equal(message.hasClass('state-placed'), true);
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          assert.equal(message.hasClass('state-placed'), false);
        });

    it('shows the "all placed" message when the service list is closed',
        function() {
          var view = createViewNoUnits();
          view.get('db').services.add([{id: 'test', icon: 'test.svg'}]);
          view.render();
          // Click the button to open the panel and the message should
          // be hidden.
          container.one('.scale-up button.closed').simulate('click');
          var message = view.get('container').one('.column.unplaced .units');
          assert.equal(message.hasClass('state-placed'), false);
          // Close the panel and the message should displayed again.
          container.one('.scale-up button.opened').simulate('click');
          assert.equal(message.hasClass('state-placed'), true);
        });
  });

  describe('onboarding for zero machines', function() {
    it('should display on MV render if there are no machines', function() {
      var machines = view.get('db').machines;
      machines.reset();
      assert.equal(machines.size(), 0);
      view.render();
      var onboarding = container.one('.column.machines .onboarding.zero');
      assert.equal(onboarding.hasClass('hidden'), false);
    });

    it('should not display on MV render if there are machines', function() {
      assert.equal(view.get('db').machines.size() > 0, true);
      view.render();
      var onboarding = container.one('.column.machines .onboarding.zero');
      assert.equal(onboarding.hasClass('hidden'), true);
    });

    it('should hide when "create machine" is opened', function() {
      var machines = view.get('db').machines;
      machines.reset();
      assert.equal(machines.size(), 0);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.zero');
      assert.equal(onboarding.hasClass('hidden'), false);
      // Need to click on the more menu to make it render.
      container.one('.machine-view-panel-header .more-menu .open-menu')
          .simulate('click');
      container.one('.machine-view-panel-header .moreMenuItem-0').simulate(
          'click');
      assert.equal(onboarding.hasClass('hidden'), true);
    });

    it('should show when "create machine" is cancelled', function() {
      var machines = view.get('db').machines;
      machines.reset();
      assert.equal(machines.size(), 0);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.zero');
      // Need to click on the more menu to make it render.
      container.one('.machine-view-panel-header .more-menu .open-menu')
          .simulate('click');
      container.one('.machine-view-panel-header .moreMenuItem-0').simulate(
          'click');
      assert.equal(onboarding.hasClass('hidden'), true);
      container.one('.create-machine .cancel').simulate('click');
      assert.equal(onboarding.hasClass('hidden'), false);
    });

    it('should show when all machines are removed', function() {
      var machines = view.get('db').machines;
      assert.equal(machines.size(), 1);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.zero');
      assert.equal(onboarding.hasClass('hidden'), true);
      machines.remove(0);
      assert.equal(machines.size(), 0);
      assert.equal(onboarding.hasClass('hidden'), false);
    });

    it('should hide when a machine is added', function() {
      var machines = view.get('db').machines;
      machines.reset();
      assert.equal(machines.size(), 0);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.zero');
      assert.equal(onboarding.hasClass('hidden'), false);
      machines.add([{id: '0'}]);
      assert.equal(machines.size(), 1);
      assert.equal(onboarding.hasClass('hidden'), true);
    });
  });

  describe('onboarding for one machine', function() {
    it('should display on MV render if there is one machine', function() {
      var machines = view.get('db').machines;
      assert.equal(machines.size(), 1);
      view.render();
      var onboarding = container.one('.column.machines .onboarding.one');
      assert.equal(onboarding.hasClass('hidden'), false);
    });

    it('should not display on MV render if there are no machines', function() {
      var machines = view.get('db').machines;
      machines.reset();
      assert.equal(machines.size(), 0);
      view.render();
      var onboarding = container.one('.column.machines .onboarding.one');
      assert.equal(onboarding.hasClass('hidden'), true);
    });

    it('should not display on MV render if more than one machine', function() {
      var machines = view.get('db').machines;
      // must render before machines can be added
      view.render();
      var machine = {
        id: '1',
        hardware: {
          disk: 1024,
          mem: 1024,
          cpuPower: 1024,
          cpuCores: 1
        }
      };
      machines.add([machine]);
      assert.equal(machines.size(), 2);
      var onboarding = container.one('.column.machines .onboarding.one');
      assert.equal(onboarding.hasClass('hidden'), true);
    });

    it('should hide when "create machine" is opened', function() {
      var machines = view.get('db').machines;
      assert.equal(machines.size(), 1);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.one');
      assert.equal(onboarding.hasClass('hidden'), false);
      // Need to click on the more menu to make it render.
      container.one('.machine-view-panel-header .more-menu .open-menu')
          .simulate('click');
      container.one('.machine-view-panel-header .moreMenuItem-0').simulate(
          'click');
      assert.equal(onboarding.hasClass('hidden'), true);
    });

    it('should show when "create machine" is cancelled', function() {
      var machines = view.get('db').machines;
      assert.equal(machines.size(), 1);
      view.render();
      var container = view.get('container');
      var onboarding = container.one('.column.machines .onboarding.one');
      // Need to click on the more menu to make it render.
      container.one('.machine-view-panel-header .more-menu .open-menu')
          .simulate('click');
      container.one('.machine-view-panel-header .moreMenuItem-0').simulate(
          'click');
      assert.equal(onboarding.hasClass('hidden'), true);
      container.one('.create-machine .cancel').simulate('click');
      assert.equal(onboarding.hasClass('hidden'), false);
    });
  });
});
