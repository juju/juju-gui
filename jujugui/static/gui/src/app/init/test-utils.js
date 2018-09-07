'use strict';

const User = require('../user/user');
const utils = require('./utils');
const testUtils = require('./testing-utils');

describe('init utils', () => {
  describe('createSocketURL', () => {
    it('honors socket_protocol and uuid', () => {
      const expected = [
        'ws://',
        window.location.hostname,
        ':',
        window.location.port,
        '/juju/api/example.com/17070/1234-1234'
      ].join('');
      const url = utils.createSocketURL({
        apiAddress: 'http://api.example.com/',
        template: '/juju/api/$server/$port/$uuid',
        protocol: 'ws',
        uuid: '1234-1234',
        server: 'example.com',
        port: '17070'
      });
      assert.strictEqual(url, expected);
    });

    it('honors a fully qualified provided socket URL', () => {
      const url = utils.createSocketURL({
        apiAddress: 'http://api.example.com/',
        template: 'wss://my.$server:$port/model/$uuid/api',
        protocol: 'ws',
        uuid: '1234-1234',
        server: 'example.com',
        port: '17070'
      });
      assert.equal(url, 'wss://my.example.com:17070/model/1234-1234/api');
    });
  });

  describe('unloadWindow', () => {
    it('does not block when no uncommitted changes', () => {
      const context = {
        ecs: {
          getCurrentChangeSet: sinon.stub().returns({})
        }
      };
      const result = utils.unloadWindow.call(context);
      assert.strictEqual(result, undefined);
    });

    it('does block when has uncommitted changes', () => {
      const context = {
        ecs: {
          getCurrentChangeSet: sinon.stub().returns({foo: 'bar'})
        }
      };
      const expected = 'You have uncommitted changes to your model. You will ' +
        'lose these changes if you continue.';
      const result = utils.unloadWindow.call(context);
      assert.strictEqual(result, expected);
    });
  });

  describe('_generateBundleExportFileName', () => {
    it('generates the correct export file name', () => {
      let envName = 'foobar';
      let date = new Date('October 13, 2014 11:13:00');
      let exportFilename =
        utils._generateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foobar-2014-10-13.yaml');

      envName = 'foo-bar';
      date = new Date('January 13, 2014 11:13:00');
      exportFilename =
        utils._generateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foo-bar-2014-01-13.yaml');
    });

    it('can generate a name when there is no model name', () => {
      let envName = '';
      let date = new Date('October 13, 2014 11:13:00');
      let exportFilename =
        utils._generateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'untitled-model-2014-10-13.yaml');
    });
  });

  describe('getName', () => {
    it('returns the name of a charm', () => {
      const name = utils.getName('cs:~uros/precise/rails-server-47');
      assert.strictEqual(name, 'rails-server');
    });

    it('returns the name of a charm when version is missing', () => {
      const name = utils.getName('cs:~uros/precise/rails-server');
      assert.strictEqual(name, 'rails-server');
    });
  });

  describe('jujushellURL', () => {
    // Set up mock sources from which to retrieve the jujushell URL.
    const setupSources = values => {
      const config = {jujushellURL: values.config || ''};
      const db = {
        environment: {
          get: sinon.stub().withArgs('jujushellURL').returns(values.db || '')
        }
      };
      const storage = {
        getItem: sinon.stub().withArgs('jujushell-url').returns(
          values.storage || ''),
        setItem: sinon.stub()
      };
      return {
        config: config,
        db: db,
        storage: storage
      };
    };

    // Check that a call to jujushellURL in a scenario set up with the given
    // values returns the expected URL.
    const assertURL = (values, expectedURL) => {
      const params = setupSources(values);
      const url = utils.jujushellURL(params.storage, params.db, params.config);
      assert.strictEqual(url, expectedURL);
    };

    it('returns the URL stored in the storage', () => {
      assertURL({storage: 'wss://1.2.3.4'}, 'wss://1.2.3.4/ws/');
      assertURL({storage: 'ws://1.2.3.4/api'}, 'ws://1.2.3.4/api/ws/');
      assertURL({storage: '1.2.3.4'}, 'wss://1.2.3.4/ws/');
      assertURL({storage: 'http://1.2.3.4/'}, 'ws://1.2.3.4/ws/');
      assertURL({storage: 'https://1.2.3.4'}, 'wss://1.2.3.4/ws/');
    });

    it('returns the URL stored in the db', () => {
      assertURL({db: 'shell.example.com'}, 'wss://shell.example.com/ws/');
    });

    it('sets the URL in the storage if found in the db', () => {
      const params = setupSources({db: 'shell.example.com'});
      const url = utils.jujushellURL(params.storage, params.db, params.config);
      assert.strictEqual(url, 'wss://shell.example.com/ws/');
      assert.strictEqual(params.storage.setItem.callCount, 1);
      assert.deepEqual(
        params.storage.setItem.args[0],
        ['jujushell-url', 'shell.example.com']);
    });

    it('does not set the URL from db if already in the storage', () => {
      const params = setupSources({
        db: 'db.example.com',
        storage: 'storage.example.com'
      });
      const url = utils.jujushellURL(params.storage, params.db, params.config);
      assert.strictEqual(url, 'wss://storage.example.com/ws/');
      assert.strictEqual(params.storage.setItem.callCount, 0);
    });

    it('returns the URL stored in the config', () => {
      assertURL({config: 'wss://4.3.2.1/ws'}, 'wss://4.3.2.1/ws');
    });

    it('returns null if the URL cannot be found', () => {
      assertURL({}, null);
    });
  });

  describe('destroyService', () => {
    it('responds to service removal failure by alerting the user', () => {
      let notificationAdded;
      const APPNAME = 'the name of the application being removed';
      const evt = {
        err: true,
        applicationName: APPNAME
      };
      const service = ['service', 'mediawiki'];

      const db = {
        notifications: {
          add: notification => {
            // The notification has the required attributes.
            assert.isOk(notification.title);
            assert.isOk(notification.message);
            // The service name is mentioned in the error message.
            assert.notEqual(notification.message.indexOf(APPNAME, -1));
            assert.equal(notification.level, 'error');
            assert.deepEqual(notification.modelId, ['service', 'mediawiki']);
            notificationAdded = true;
          }
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
    });

    it('removes the relations when the service is destroyed', () => {
      let notificationAdded = false;
      const APPNAME = 'the name of the application being removed';
      const evt = {
        err: false,
        applicationName: APPNAME
      };
      const service = {};

      const db = {
        notifications: {
          add: attrs => {
            // The notification has the required attributes.
            assert.equal(attrs.hasOwnProperty('title'), true,
              'Does not have a title');
            assert.equal(attrs.hasOwnProperty('message'), true,
              'Does not have a message');
            // The service name is mentioned in the error message.
            assert.notEqual(attrs.message.indexOf(APPNAME, -1));
            assert.equal(attrs.level, 'important');
            notificationAdded = true;
          }
        },
        relations: {
          get_relations_for_service: sinon.stub().returns([]),
          remove: sinon.stub()
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
      // Check that relations were removed.
      assert.equal(db.relations.remove.calledOnce, true,
        'Remove relations not called');
    });
  });

  describe('destroyModel', () => {
    it('can destroy a model', () => {
      const destroyModels = sinon.stub().callsArg(1);
      const modelAPI = {
        get: sinon.stub().returns('differentUUID')
      };
      const switchModel = sinon.stub();
      const callback = sinon.stub();
      utils.destroyModel(destroyModels, modelAPI, switchModel, 'someuuid', callback);
      assert.equal(destroyModels.callCount, 1);
      assert.deepEqual(destroyModels.args[0][0], ['someuuid']);
      assert.equal(callback.callCount, 1);
      assert.equal(switchModel.callCount, 0);
    });

    it('disconnects when destroying the current model', () => {
      const destroyModels = sinon.stub().callsArg(1);
      const modelAPI = {
        get: sinon.stub().returns('someuuid')
      };
      const switchModel = sinon.stub();
      const callback = sinon.stub();
      utils.destroyModel(destroyModels, modelAPI, switchModel, 'someuuid', callback, false);
      assert.equal(destroyModels.callCount, 1);
      assert.deepEqual(destroyModels.args[0][0], ['someuuid']);
      assert.equal(callback.callCount, 1);
      assert.equal(switchModel.callCount, 1);
      assert.deepEqual(switchModel.args[0], [null, false, false]);
    });
  });

  describe('getUnitStatusCounts', () => {
    it('generate a list of status by unit counts', () => {
      const units = [
        {id: 1, agent_state: 'started'},
        {id: 2, agent_state: 'pending'},
        {id: 3, agent_state: 'error'},
        {id: 4},
        {id: 5},
        {id: 6, agent_state: 'started'},
        {id: 7, agent_state: 'error'},
        {id: 8, agent_state: 'error'},
        {id: 9}
      ];
      assert.deepEqual(utils.getUnitStatusCounts(units), {
        uncommitted: {priority: 3, size: 3},
        started: {priority: 2, size: 2},
        pending: {priority: 1, size: 1},
        error: {priority: 0, size: 3}
      });
    });
  });

  describe('linkify', () => {
    const testLinks = [
      {
        text: 'google.com',
        expected: '<a href="google.com" target="_blank">google.com</a>'
      },
      {
        text: 'www.domain.com',
        expected: '<a href="www.domain.com" target="_blank">www.domain.com</a>' // eslint-disable-line max-len
      },
      {
        text: 'thisisareallylongdomainnamewithunder62parts.co',
        expected: '<a href="thisisareallylongdomainnamewithunder62parts.co" target="_blank">thisisareallylongdomainnamewithunder62parts.co</a>' // eslint-disable-line max-len
      },
      {
        text: 'node-1.www4.example.com.jp',
        expected: '<a href="node-1.www4.example.com.jp" target="_blank">node-1.www4.example.com.jp</a>' // eslint-disable-line max-len
      },
      {
        text: 'http://domain.com',
        expected: '<a href="http://domain.com" target="_blank">http://domain.com</a>' // eslint-disable-line max-len
      },
      {
        text: 'ftp://foo.1.example.com.uk',
        expected: '<a href="ftp://foo.1.example.com.uk" target="_blank">ftp://foo.1.example.com.uk</a>' // eslint-disable-line max-len
      },
      {
        text: 'example.com/?foo=bar',
        expected: '<a href="example.com/?foo=bar" target="_blank">example.com/?foo=bar</a>' // eslint-disable-line max-len
      },
      {
        text: 'example.com/foo/bar?baz=true&something=%20alsotrue',
        expected: '<a href="example.com/foo/bar?baz=true&amp;something=%20alsotrue" target="_blank">example.com/foo/bar?baz=true&amp;something=%20alsotrue</a>' // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/index?foo=bar<script>alert(\'xss\')</script>', // eslint-disable-line max-len
        expected: '<a href="http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt" target="_blank">http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt</a>;' // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/foo"bar',
        expected: '<a href="http://example.com/foo&quot;bar" target="_blank">http://example.com/foo"bar</a>' // eslint-disable-line max-len
      },
      {
        text: 'Hi there John.Bob',
        expected: 'Hi there John.Bob'
      }
    ];

    testLinks.forEach(test => {
      it('correctly linkifies: ' + test.text, () => {
        const actual = utils.linkify(test.text);
        assert.equal(actual, test.expected);
      });
    });
  });

  describe('switchModel', () => {
    let _hidePopup, _showUncommittedConfirm, originalSwitchModel;

    beforeEach(() => {
      originalSwitchModel = utils._switchModel;
      _hidePopup = utils._hidePopup;
      utils._hidePopup = sinon.stub();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = sinon.stub();
      utils._getAuth = sinon.stub().returns({rootUserName: 'animal'});
    });

    afterEach(() => {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
      utils._switchModel = originalSwitchModel;
    });

    it('can switch directly if there are no uncommitted changes', () => {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      assert.deepEqual(utils._switchModel.callCount, 1);
      const switchArgs = utils._switchModel.lastCall.args;
      assert.deepEqual(switchArgs, [env, model, true]);
    });

    it('does not switch to the current model', () => {
      const app = {
        modelUUID: 'model-uuid-1'
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      const model = {id: 'model-uuid-1', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      // The underlying _switchModel is not called.
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('can show a confirmation if there are uncommitted changes', () => {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({change: 'a change'})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 1);
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('does not switch when committing', () => {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(true),
          getCurrentChangeSet: sinon.stub().returns({change: 'a change'})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      const addNotification = sinon.stub();
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, addNotification, model);
      assert.deepEqual(addNotification.callCount, 1);
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('allows switching to disconnected state', () => {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), null);
      assert.deepEqual(utils._switchModel.callCount, 1);
      const switchArgs = utils._switchModel.lastCall.args;
      assert.deepEqual(switchArgs, [env, null, true]);
    });

    it('can switch models', () => {
      const app = {
        modelUUID: 'uu-id',
        state: {changeState: sinon.stub(), current: {}}
      };
      const env = {set: sinon.stub()};
      const model = {id: 'my-uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel.call(app, env, model);
      assert.equal(utils._hidePopup.callCount, 1, '_hidePopup');
      assert.equal(app.state.changeState.callCount, 1, 'changeState');
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null, inspector: null},
        root: null,
        hash: null,
        model: {path: 'who/mymodel', uuid: 'my-uuid'}
      }]);
      assert.equal(env.set.callCount, 1, 'env.set');
      assert.deepEqual(env.set.args[0], ['environmentName', 'mymodel']);
      assert.equal(app.modelUUID, 'my-uuid');
    });

    it('changes to disconnected mode if model is missing', () => {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {changeState: sinon.stub(), current: {}}
      };
      const clear = sinon.stub().withArgs();
      const modelAPI = {
        get: sinon.stub().withArgs('ecs').returns({clear: clear}),
        set: sinon.stub()
      };
      utils._switchModel.call(app, modelAPI, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null, inspector: null},
        root: 'new',
        hash: null,
        model: null
      }]);
      assert.equal(clear.callCount, 1, 'clear');
    });

    it('does not set root state to new if profile state exists', () => {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {profile: 'animal'}, changeState: sinon.stub()}
      };
      const env = {set: sinon.stub()};
      utils._switchModel.call(app, env, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null, inspector: null},
        hash: null,
        root: null,
        model: null
      }]);
    });

    it('does not close the status pane when switching to a model', () => {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {gui: {status: ''}}, changeState: sinon.stub()}
      };
      const env = {set: sinon.stub()};
      const model = {id: 'my-uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel.call(app, env, model);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: '', inspector: null},
        hash: null,
        root: null,
        model: {path: 'who/mymodel', uuid: 'my-uuid'}
      }]);
    });

    it('closes the status pane when switching to a new model', () => {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {gui: {status: ''}}, changeState: sinon.stub()}
      };
      const clear = sinon.stub().withArgs();
      const modelAPI = {
        get: sinon.stub().withArgs('ecs').returns({clear: clear}),
        set: sinon.stub()
      };
      utils._switchModel.call(app, modelAPI, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null, inspector: null},
        hash: null,
        root: 'new',
        model: null
      }]);
      assert.equal(clear.callCount, 1, 'clear');
    });
  });

  describe('showProfile', () => {
    it('calls changeState with the supplied username', () => {
      const changeState = sinon.stub();
      const username = 'hatch';
      utils.showProfile(changeState, username);
      assert.deepEqual(changeState.args[0], [{
        profile: username,
        root: null,
        store: null,
        search: null,
        user: null
      }]);
    });
  });

  describe('deploy util', () => {
    let app, callback, commit, envGet, container;

    beforeEach(() => {
      container = testUtils.makeAppContainer();
      const getMockStorage = () => {
        return new function() {
          return {
            store: {},
            setItem: function(name, val) { this.store['name'] = val; },
            getItem: function(name) { return this.store['name'] || null; }
          };
        };
      };
      const userClass = new User({sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      callback = sinon.stub();
      commit = sinon.stub();
      envGet = sinon.stub();
      envGet.withArgs('ecs').returns({commit: commit});
      envGet.withArgs('connected').returns(true);
      app = {
        applicationConfig: {
          apiAddress: 'apiAddress',
          socketTemplate: 'wss://$server/$uuid',
          socket_protocol: 'socket_protocol',
          uuid: 'uuid'
        },
        modelAPI: {
          connect: sinon.stub(),
          get: envGet,
          on: sinon.stub(),
          set: sinon.stub()
        },
        controllerAPI: {
          createModel: sinon.stub()
        },
        _autoPlaceUnits: sinon.stub(),
        db: {
          notifications: {
            add: sinon.stub()
          }
        },
        set: sinon.stub(),
        createSocketURL: sinon.stub().returns('wss://socket-url'),
        get: sinon.stub().returns('wss://socket-url'),
        switchEnv: sinon.stub(),
        state: {
          current: {},
          changeState: sinon.stub()
        },
        user: userClass
      };
    });

    afterEach(() => {
      container.remove();
    });

    it('can auto place when requested', () => {
      const autoPlaceUnits = sinon.stub();
      utils.deploy(app, autoPlaceUnits, callback, true);
      assert.equal(autoPlaceUnits.callCount, 1);
    });

    it('does not auto place when requested', () => {
      const autoPlaceUnits = sinon.stub();
      utils.deploy(app, autoPlaceUnits, callback, false);
      assert.equal(app._autoPlaceUnits.callCount, 0);
    });

    it('can commit to an existing model', () => {
      utils.deploy(app, sinon.stub(), callback);
      assert.equal(commit.callCount, 1);
      assert.equal(callback.callCount, 1);
      assert.equal(app.controllerAPI.createModel.callCount, 0);
      // Sets the post deployment panel state to show.
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        postDeploymentPanel: true
      }]);
    });

    it('can create a new model', () => {
      envGet.withArgs('connected').returns(false);
      utils.deploy(
        app, sinon.stub(), callback, true, 'new-model', {
          credential: 'the-credential',
          cloud: 'azure',
          region: 'north'
        });
      assert.equal(commit.callCount, 0);
      assert.equal(callback.callCount, 0);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      const args = app.controllerAPI.createModel.args[0];
      assert.strictEqual(args[0], 'new-model');
      assert.strictEqual(args[1], 'user@local');
      assert.deepEqual(args[2], {
        credential: 'the-credential',
        cloud: 'azure',
        region: 'north'
      });
      assert.isFunction(args[3]);
    });

    it('can create, connect, and commit to the new model', () => {
      const modelData = {
        id: 'abc123',
        name: 'model-name',
        owner: 'foo@external',
        uuid: 'the-uuid'
      };
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      const commit = sinon.stub();
      envGet.withArgs('ecs').returns({commit});
      utils._hidePopup = sinon.stub();
      utils.deploy(
        app, sinon.stub(), callback, false, 'my-model', args);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3](null, modelData);
      assert.equal(app.modelUUID, modelData.uuid);
      assert.equal(app.switchEnv.callCount, 1);
      assert.equal(app.switchEnv.args[0][0], 'wss://apiAddress/the-uuid');
      assert.strictEqual(app.switchEnv.args[0][1], null);
      assert.strictEqual(app.switchEnv.args[0][2], null);
      assert.equal(typeof app.switchEnv.args[0][3], 'function');
      assert.strictEqual(app.switchEnv.args[0][4], true);
      assert.strictEqual(app.switchEnv.args[0][5], false);
      // Call the switchEnv callback handler.
      app.switchEnv.args[0][3](args);
      assert.equal(commit.callCount, 1);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [
        null, {
          id: 'abc123',
          name: 'model-name',
          owner: 'foo@external',
          uuid: 'the-uuid'
        }]);
      // Check to make sure that the state was changed.
      assert.equal(app.state.changeState.callCount, 2);
      assert.deepEqual(app.state.changeState.args[0], [{
        postDeploymentPanel: true
      }]);
    });

    it('calls changeState when deploying if state matches rules', () => {
      const modelData = {
        id: 'abc123',
        name: 'model-name',
        owner: 'foo@external',
        uuid: 'the-uuid'
      };
      app.state.current = {
        root: 'new',
        special: {dd: {id: 'cs:apache'}}
      };
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      const commit = sinon.stub();
      envGet.withArgs('ecs').returns({commit});
      sinon.stub(utils, '_switchModel');
      utils.deploy(
        app, sinon.stub(), callback, false, 'my-model', args);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3](null, modelData);
      // Check to make sure that the state was changed.
      assert.equal(app.state.changeState.callCount, 3);
      assert.deepEqual(app.state.changeState.args, [
        [{root: null}],
        [{special: {dd: null}}],
        [{postDeploymentPanel: true}]
      ]);
    });

    it('can display an error notification', () => {
      const modelData = {uuid: 'the-uuid'};
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      utils.deploy(
        app, sinon.stub(), callback, false, 'my-model', args);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3]('it broke', modelData);
      assert.equal(app.db.notifications.add.callCount, 1);
      const expectedError = 'cannot create model: it broke';
      assert.deepEqual(app.db.notifications.add.args[0], [{
        title: expectedError,
        message: expectedError,
        level: 'error'
      }]);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [expectedError, null]);
    });
  });

  describe('generateCloudCredentialName', () => {
    it('can generate a cloud credential name', () => {
      assert.equal(
        utils.generateCloudCredentialName('azure', 'spinach', 'super-cred'),
        'azure_spinach_super-cred');
    });
  });

  describe('getCloudProviderDetails', () => {
    it('can get details for a provider', () => {
      const provider = utils.getCloudProviderDetails('gce');
      assert.equal(provider.id, 'google');
    });
  });

  describe('validateForm', () => {
    it('can validate a form with an invalid field', () => {
      const refs = {
        one: {validate: sinon.stub().returns(false)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      assert.isFalse(utils.validateForm(fields, refs));
    });

    it('can validate a form with valid fields', () => {
      const refs = {
        one: {validate: sinon.stub().returns(true)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      assert.isTrue(utils.validateForm(fields, refs));
    });

    it('validates all fields even if one field is invalid', () => {
      const refs = {
        one: {validate: sinon.stub().returns(false)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      utils.validateForm(fields, refs);
      assert.equal(refs.one.validate.callCount, 1);
      assert.equal(refs.two.validate.callCount, 1);
    });
  });

  describe('parseConstraints', () => {
    let genericConstraints;

    beforeEach(() => {
      genericConstraints = [
        'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
    });

    it('can parse constraints', () => {
      assert.deepEqual(
        utils.parseConstraints(
          genericConstraints,
          'arch=amd64 cpu-cores=2 cpu-power=10 root-disk=2048 mem=1024'),
        {
          arch: 'amd64',
          cores: null,
          'cpu-cores': '2',
          'cpu-power': '10',
          mem: '1024',
          'root-disk': '2048',
          tags: null
        });
    });
  });

  describe('parseMachineDetails', () => {
    let genericConstraints;

    beforeEach(() => {
      genericConstraints = [
        'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
    });

    it('can handle no hardware or constraints', () => {
      const machine = {};
      assert.strictEqual(
        utils.parseMachineDetails(genericConstraints, machine), null);
    });

    it('can generate hardware details', () => {
      const machine = {
        hardware: {
          'cpu-cores': '2',
          'cpu-power': '10',
          mem: '1024',
          'root-disk': '2048'
        }
      };
      assert.deepEqual(
        utils.parseMachineDetails(genericConstraints, machine),
        [{
          label: 'cores',
          value: '2'
        }, {
          label: 'cpu',
          value: '0.1GHz'
        }, {
          label: 'mem',
          value: '1.00GB'
        }, {
          label: 'disk',
          value: '2.00GB'
        }]);
    });

    it('can generate constraints', () => {
      const machine = {
        constraints: 'cpu-cores=2 cpu-power=10 root-disk=2048 mem=1024'
      };
      assert.deepEqual(
        utils.parseMachineDetails(genericConstraints, machine),
        [{
          label: 'cpu',
          value: '0.1GHz'
        }, {
          label: 'cores',
          value: '2'
        }, {
          label: 'mem',
          value: '1.00GB'
        }, {
          label: 'disk',
          value: '2.00GB'
        }]);
    });

    it('can correctly parse with alternate keys', () => {
      const machine = {
        hardware: {
          cpuCores: '2',
          cpuPower: '10',
          mem: '1024',
          disk: '2048'
        }
      };
      assert.deepEqual(
        utils.parseMachineDetails(genericConstraints, machine),
        [{
          label: 'cores',
          value: '2'
        }, {
          label: 'cpu',
          value: '0.1GHz'
        }, {
          label: 'mem',
          value: '1.00GB'
        }, {
          label: 'disk',
          value: '2.00GB'
        }]);
    });
  });

  describe('generateMachineDetails', () => {
    let genericConstraints, units;

    beforeEach(() => {
      genericConstraints = [
        'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
      units = {
        filterByMachine: sinon.stub().returns([1, 2, 3])
      };
    });

    it('can generate hardware details', () => {
      const machine = {
        hardware: {
          'cpu-cores': '2',
          'cpu-power': '10',
          mem: '1024',
          'root-disk': '2048'
        },
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, cores: 2, cpu: 0.1GHz, mem: 1.00GB, '+
        'disk: 2.00GB');
    });

    it('can generate details with no hardware', () => {
      const machine = {
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, hardware details not available');
    });

    it('can generate constraints', () => {
      const machine = {
        constraints: 'cpu-cores=2 cpu-power=10 root-disk=2048 mem=1024',
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, requested constraints: cpu: 0.1GHz, cores: 2'+
        ', mem: 1.00GB, disk: 2.00GB');
    });

    it('can generate details with no constraints', () => {
      const machine = {
        commitStatus: 'uncommitted',
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, default constraints');
    });

    it('can generate details with blank constraints', () => {
      const machine = {
        constraints: 'cpu-cores=',
        commitStatus: 'uncommitted',
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, default constraints');
    });

    it('can generate details with no series', () => {
      const machine = {};
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, hardware details not available');
    });
  });

  describe('addGhostAndEcsUnits', function() {
    function testScaleUp(applicationName) {
      const service = {
        get: function(key) {
          let returnVal;
          switch (key) {
            case 'id':
              returnVal = applicationName;
              break;
            case 'units':
              returnVal = {
                size: function() { return 2; },
                toArray: function() {
                  if (applicationName === 'no-units') {
                    return [];
                  }
                  return [
                    {id: applicationName + '/1'},
                    {id: applicationName + '/2'}
                  ];
                }
              };
              break;
            case 'displayName':
              if (applicationName.indexOf('$') > 0) {
                returnVal = '(' + applicationName + ')';
              } else {
                returnVal = applicationName;
              }
              break;
            case 'charm':
              returnVal = 'I am a charm url';
              break;
            case 'subordinate':
              returnVal = false;
              break;
          }
          return returnVal;
        }
      };
      const db = {
        addUnits: sinon.stub(),
        removeUnits: sinon.stub()
      };
      const env = {
        add_unit: sinon.stub()
      };
      const unitCount = 2;
      const callback = sinon.stub();

      const units = utils.addGhostAndEcsUnits(
        db, env, service, unitCount, callback);
      // Test the db.addUnits call.
      assert.equal(db.addUnits.callCount, 2, 'db addUnits not called');
      const addUnitsArgs = db.addUnits.args;
      // The numbers for the id's are important. The mocks have existing units
      // having indexes of 1 and 2. There was a bug where the next value wasn't
      // being properly computed when there was no 0 unit.
      let firstIndex = 3;
      if (applicationName === 'no-units') {
        firstIndex = 0;
      }
      assert.deepEqual(addUnitsArgs[0][0], {
        id: applicationName + '/' + firstIndex,
        displayName: applicationName + '/' + firstIndex,
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits first not called with proper data');
      assert.deepEqual(addUnitsArgs[1][0], {
        id: applicationName + '/' + (firstIndex+1),
        displayName: applicationName + '/' + (firstIndex+1),
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits second not called with proper data');
      // Test the env.add_unit call.
      assert.equal(env.add_unit.callCount, 2, 'add unit not called');
      const add_unit_args = env.add_unit.args;
      assert.equal(add_unit_args[0][0], applicationName);
      assert.equal(add_unit_args[0][1], 1);
      assert.strictEqual(add_unit_args[0][2], null);
      assert.equal(typeof add_unit_args[0][3], 'function');
      assert.deepEqual(add_unit_args[0][4], {
        modelId: applicationName + '/' + firstIndex
      });
      assert.equal(add_unit_args[1][0], applicationName);
      assert.equal(add_unit_args[1][1], 1);
      assert.strictEqual(add_unit_args[1][2], null);
      assert.equal(typeof add_unit_args[1][3], 'function');
      assert.deepEqual(add_unit_args[1][4], {
        modelId: applicationName + '/' + (firstIndex+1)
      });
      assert.equal(units.length, 2);
    }

    it('creates machines, units; places units; updates unit lists',
      function() {
        testScaleUp('myService');
      }
    );

    it('creates machines, units; places units; updates unit lists (no units)',
      function() {
        testScaleUp('no-units');
      }
    );

    it('creates machines, units; places units; updates unit lists for ghosts',
      function() {
        testScaleUp('myGhostService$');
      }
    );

    it('properly removes the ghost units on env add_unit callback', function() {
      const ghostUnit = { ghostUnit: 'I am' };
      const db = {
        removeUnits: sinon.stub()
      };
      const callback = sinon.stub();
      const e = {
        applicationName: 'appName'
      };
      utils.removeGhostAddUnitCallback(ghostUnit, db, callback, e);
      assert.equal(db.removeUnits.calledOnce, true);
      assert.equal(db.removeUnits.lastCall.args[0].service, 'appName');
      assert.equal(callback.calledOnce, true);
      assert.deepEqual(callback.lastCall.args, [e, db, ghostUnit]);
    });
  });

  describe('utils.ensureTrailingSlash', function() {
    it('adds a trailing slash if not already there', function() {
      var text = utils.ensureTrailingSlash('/foo/bar');
      assert.strictEqual(text, '/foo/bar/');
    });

    it('avoids adding a trailing slash if not required', function() {
      var text = utils.ensureTrailingSlash('/foo/bar/');
      assert.strictEqual(text, '/foo/bar/');
    });
  });

  describe('getIconPath', function() {
    let jujuConfig;

    beforeEach(() => {
      jujuConfig = window.juju_config;
      window.juju_config = {charmstoreURL: 'http://4.3.2.1/'};
    });

    afterEach(() => {
      window.juju_config = jujuConfig;
    });

    it('returns local default bundle icon location for bundles', function() {
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('uses staticURL if provided for bundle icon location', function() {
      window.juju_config = {
        staticURL: 'static'
      };
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });

    it('handles charmstoreURL with no trailing slash', function() {
      window.juju_config = {charmstoreURL: 'http://4.3.2.1'};
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });
  });

  describe('isRedirectError', function() {
    it('returns true if it is a redirect error', function() {
      assert.equal(
        utils.isRedirectError('authentication failed: redirection required'),
        true);
    });

    it('returns false if it is not a redirect error', function() {
      assert.equal(
        utils.isRedirectError('it broke'),
        false);
    });
  });

  describe('isValue', function() {
    it('can check a value is set and not null', function() {
      assert.equal(utils.isValue('string'), true);
      assert.equal(utils.isValue(''), true);
      assert.equal(utils.isValue(1), true);
      assert.equal(utils.isValue(0), true);
      assert.equal(utils.isValue({key: 'value'}), true);
      assert.equal(utils.isValue({}), true);
      assert.equal(utils.isValue(['array']), true);
      assert.equal(utils.isValue([]), true);
      assert.equal(utils.isValue(undefined), false);
      assert.equal(utils.isValue(null), false);
    });
  });

  describe('isObject', function() {
    it('can check a value is an object', function() {
      assert.equal(utils.isObject({key: 'value'}), true);
      assert.equal(utils.isObject({}), true);
      assert.equal(utils.isObject([]), false);
      assert.equal(utils.isObject(undefined), false);
      assert.equal(utils.isObject(null), false);
    });
  });

  describe('arrayDedupe', function() {
    it('can remove duplicates from an array', function() {
      assert.deepEqual(
        utils.arrayDedupe(
          ['one', 'four', 'one', 'two', 'three', 'two', 'four']),
        ['one', 'four', 'two', 'three']);
    });
  });

  describe('arrayFlatten', function() {
    it('can flatten an array of arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [['one', 'two'], ['three'], 'four']),
        ['one', 'two', 'three', 'four']);
    });

    it('can flatten nested arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [[['one', 'two'], ['three']]]),
        ['one', 'two', 'three']);
    });
  });

  describe('formatConstraints', function() {
    it('can format constraints', function() {
      assert.equal(
        utils.formatConstraints({
          arch: 'amd64',
          cpuCores: 2,
          cpuPower: 10,
          disk: 2048,
          mem: 1024
        }),
        'arch=amd64 cpuCores=2 cpuPower=10 disk=2048 mem=1024');
    });
  });
});
