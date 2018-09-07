'use strict';

const jsyaml = require('js-yaml');
const React = require('react');
const ReactDOM = require('react-dom');
const FileSaver = require('file-saver');
const {charmstore} = require('jaaslib');

const BundleExporter = require('./bundle-exporter');
const Popup = require('../components/popup/popup');
const initUtils = require('./utils');

let utils = {};

/**
  Create the new socket URL based on the socket template and model details.
  @param {String} apiAddress The root apiAddress to connect to.
  @param {String} template The template to use to generate the url.
  @param {String} uuid The unique identifier for the model.
  @param {String} server The optional API server host address for the
    model. If not provided, defaults to the host name included in the
    provided apiAddress option.
  @param {String} port The optional API server port for the model. If not
    provided, defaults to the host name included in the provided apiAddress
    option.
  @return {String} The resulting fully qualified WebSocket URL.
*/
utils.createSocketURL = data => {
  let apiAddress = data.apiAddress;
  let template = data.template;
  let protocol = data.protocol;
  let uuid = data.uuid;
  let server = data.server;
  let port = data.port;

  let baseUrl = '';
  const schema = `${protocol}://` || 'wss://';
  if (!apiAddress) {
    // It should not ever be possible to get here unless you're running the
    // gui in dev mode without pointing it to a proxy/server supplying
    // the necessary config values.
    alert(
      'Unable to create socketURL, no apiAddress provided. The GUI must ' +
      'be loaded with a valid configuration. Try GUIProxy if ' +
      'running in development mode: https://github.com/juju/guiproxy');
    return;
  }
  if (template[0] === '/') {
    // The WebSocket path is passed so we need to calculate the base URL.
    baseUrl = schema + window.location.hostname;
    if (window.location.port !== '') {
      baseUrl += ':' + window.location.port;
    }
  }
  const defaults = apiAddress.replace(schema, '').split(':');
  template = template.replace('$uuid', uuid);
  template = template.replace('$server', server || defaults[0]);
  template = template.replace('$port', port || defaults[1]);
  return baseUrl + template;
};

/**
  Displays a confirmation when closing window if there are uncommitted
  changes
  @param {Object} env Reference to the app env.
*/
utils.unloadWindow = function() {
  if (Object.keys(this.ecs.getCurrentChangeSet()).length > 0) {
    return 'You have uncommitted changes to your model. You will ' +
      'lose these changes if you continue.';
  }
};

/**
  Export the YAML for the current model, including uncommitted changes.

  @param {Object} db The application database.
  @param {Function} [sendAnalytics] Function to send analytics about the use of
    the bundle export.
*/
utils.exportEnvironmentFile = (db, sendAnalytics)=> {
  const apps = db.services.toArray();
  const idMap = new Map();
  // Store a map of all the temporary app ids to the real ids.
  apps.forEach(app => {
    idMap.set(app.get('id'), app.get('name'));
  });
  const bundleExporter = new BundleExporter({ db });
  const result = bundleExporter.exportBundle();
  let exportData = jsyaml.dump(result);
  // Replace the temporary app ids with the real ids.
  idMap.forEach((name, id) => {
    exportData = exportData.split(id).join(name);
  });
  // In order to support Safari 7 the type of this blob needs
  // to be text/plain instead of it's actual type of application/yaml.
  const exportBlob = new Blob([exportData],
    {type: 'text/plain;charset=utf-8'});
  const envName = db.environment.get('name');
  sendAnalytics('BundleExport', 'export', 'export', apps.length);
  FileSaver.saveAs(exportBlob, utils._generateBundleExportFileName(envName));
};

/**
  Get the export file name

  @method _generateBundleExportFileName
  @param {String} Enviroment name
  @param {Date} date object
*/
utils._generateBundleExportFileName = (envName, date=new Date()) => {
  envName = envName || 'untitled-model';
  const fileExtension = '.yaml';
  return [envName,
    date.getFullYear(),
    ('0' + (date.getMonth() + 1)).slice(-2),
    ('0' + date.getDate()).slice(-2)].join('-') + fileExtension;
};



/**
  Get the config for a service from a YAML file.
  @param {String} filename The config YAML file.
  @param {Function} callback The function to call when the file loads.
  @param {Object} e The load event.
*/
utils._onYAMLConfigLoaded = (filename, callback, e) => {
  const config = jsyaml.safeLoad(e.target.result);
  callback(config);
};

/**
  Get the config for a service from a YAML file.
  @param {Object} file The config YAML file.
  @param {Function} callback The function to call when the file loads.
*/
utils.getYAMLConfig = (file, callback) => {
  const reader = new FileReader();
  reader.onload = utils._onYAMLConfigLoaded.bind(this, file.name, callback);
  reader.readAsText(file);
};

/**
Return the name from the given charm ID.

@method getName
@param {String} id A fully qualified charm ID, like
  "cs:trusty/django-42" or "cs:~frankban/utopic/juju-gui-0"
@return {String} The charm name.
*/
utils.getName = id => {
  const parts = id.split('/');
  // The last part will be the name and version number e.g. juju-gui-0.
  const idParts = parts[parts.length - 1].split('-');
  // If the last part is numeric, it's the version number; remove it.
  if (!isNaN(idParts[idParts.length - 1])) {
    idParts.pop();
  }
  return idParts.join('-');
};

/*
pluralize is a helper that handles pluralization of strings.
The requirement for pluralization is based on the passed in object,
which can be number, array, or object. If a number, it is directly
checked to see if pluralization is needed. Arrays and objects are
checked for length or size attributes, which are then used.

By default, if pluralization is needed, an 's' is appended to the
string. This handles the regular case (e.g. cat => cats). Irregular
cases are handled by passing in a plural form (e.g. octopus => ocotopi).
*/
utils.pluralize = (word, object, plural_word, options) => {
  let plural = false;
  if (typeof(object) === 'number') {
    plural = (object !== 1);
  }
  if (object) {
    if (object.size) {
      plural = (object.size() !== 1);
    } else if (object.length) {
      plural = (object.length !== 1);
    }
  }
  if (plural) {
    if (typeof(plural_word) === 'string') {
      return plural_word;
    } else {
      return word + 's';
    }
  } else {
    return word;
  }
};

/**
  Retrieve the jujushell URL from the provided sources.
  Return null if jujushell is not available.

  @param {Object} storage A storage object for persisting custom settings.
  @param {Object} db The application database.
  @param {Object} config The application config.
*/
utils.jujushellURL = (storage, db, config) => {
  const storageKey = 'jujushell-url';
  // First check if the user has put the jujushell URL in the GUI settings.
  let url = storage.getItem(storageKey);
  if (url) {
    url = url.replace(/^(http:\/\/)/, 'ws://');
    url = url.replace(/^(https:\/\/)/, 'wss://');
    if (url.indexOf('ws://') !== 0 && url.indexOf('wss://') !== 0) {
      url = 'wss://' + url;
    }
    return url.replace(/\/?$/, '/') + 'ws/';
  }
  // Then try and check whether there is a jujushell charm deployed and ready
  // on the current model.
  url = db.environment.get('jujushellURL');
  if (url) {
    storage.setItem(storageKey, url);
    return `wss://${url}/ws/`;
  }
  // Last option is the application settings (JAAS case).
  return config.jujushellURL || null;
};

/**
  Remove a service. If it is uncommitted then remove it otherwise use the
  ecs.
  @param {Object} db Reference to the app db.
  @param {Object} env Reference to the app env.
  @param {Object} service Reference to the service model to add units to.
*/
utils.destroyService = (db, env, service, callback) => {
  if (service.name === 'service') {
    env.destroyApplication(service.get('id'),
      utils._destroyServiceCallback.bind(this, service, db, callback),
      {modelId: null});
  } else if (service.get('pending')) {
    db.services.remove(service);
    service.destroy();
  } else {
    throw new Error('Unexpected model type: ' + service.name);
  }
};

/**
  React to a service being destroyed (or not).
  @param {Object} service The service we attempted to destroy.
  @param {Object} db The database responsible for storing the service.
  @param {Object} evt The event describing the destruction (or lack
    thereof).
*/
utils._destroyServiceCallback = (service, db, callback, evt) => {
  if (evt.err) {
    // If something bad happend we need to alert the user.
    db.notifications.add({
      title: 'Error destroying service',
      message: 'Service name: ' + evt.applicationName,
      level: 'error',
      link: undefined,
      modelId: service
    });
  } else {
    // Remove the relations from the database (they will be removed from
    // the state server by Juju, so we don't need to interact with env).
    db.relations.remove(db.relations.get_relations_for_service(service));
    db.notifications.add({
      title: 'Destroying service',
      message: 'Service: ' + evt.applicationName + ' is being destroyed.',
      level: 'important'
    });
  }
  if (callback) {
    callback();
  }
};

/**
  Remove a model.
  @param destroyModels {Function} The controller API method to destroy models.
  @param modelAPI {Object} The model API.
  @param switchModel {Function} The method for switching models.
  @param modelUUID {String} The UUID for the model to destroy.
  @param callback {Function} The function to call after destroying the model.
  @param {Boolean} clearProfileState Whether to close the profile if the model
    is destroyed.
*/
utils.destroyModel = (
  destroyModels, modelAPI, switchModel, modelUUID, callback=null, clearProfileState=true) => {
  // If the current model is being destroyed then disconnect first.
  if (modelAPI.get('modelUUID') === modelUUID) {
    switchModel(null, false, clearProfileState);
  }
  destroyModels([modelUUID], (error, data) => {
    callback && callback(error, data);
  });
};

/**
  Calculate the number of units per status.
  @param {Array} units An array of units.
  @returns {Object} The unit statuses.
*/
utils.getUnitStatusCounts = units => {
  const unitStatuses = {
    uncommitted: { priority: 3, size: 0 },
    started: { priority: 2, size: 0 },
    pending: { priority: 1, size: 0 },
    error: { priority: 0, size: 0 }
  };
  let agentState;
  units.forEach(unit => {
    agentState = unit.agent_state || 'uncommitted';
    // If we don't have it in our status list then add it to the end
    // with a very low priority.
    if (!unitStatuses[agentState]) {
      unitStatuses[agentState] = { priority: 99, size: 0 };
    }
    unitStatuses[agentState].size += 1;
  });
  return unitStatuses;
};

// Modified for Javascript from https://gist.github.com/gruber/8891611 - I
// escaped the forward slashes and removed the negative-lookbehind, which JS
// does not support. See line 46 in Gruber's gist; that's the line/feature
// I had to take out.
const URL_RE = /\b((?:(?:https?|ftp):(?:\/{1,3}|[a-z0-9%])|[a-z0-9.\-]+[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\/)(?:[^\s()<>{}\[\]]+|\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\))+(?:\([^\s()]*?\([^\s()]+\)[^\s()]*?\)|\([^\s]+?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’])|(?:[a-z0-9]+(?:[.\-][a-z0-9]+)*[.](?:com|net|org|edu|gov|mil|aero|asia|biz|cat|coop|info|int|jobs|mobi|museum|name|post|pro|tel|travel|xxx|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|Ja|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\b\/?(?!@)))/ig; // eslint-disable-line max-len

/**
  Convert plain text links to anchor tags.
  @param {String} str a string that may have a plain text link or URL in it
  @returns {String} the string with HTML anchor tags for the link
*/
utils.linkify = str => {
  // Sanitize any malicious HTML or Javascript.
  let sanitizedStr = str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const links = sanitizedStr.match(URL_RE);
  if (links) {
    links.forEach(link => {
      // Sanitize any attempts to escape an href attribute.
      const href = link.replace(/"/g, '&quot;');
      // Replace the text-only link with an anchor element.
      sanitizedStr = sanitizedStr.replace(link,
        `<a href="${href}" target="_blank">${link}</a>`);
    });
  }
  return sanitizedStr;
};

/**
  Switch model, displaying a confirmation if there are uncommitted changes.
  @param {Object} modelAPI Reference to the app modelAPI.
  @param {Object} model The model to switch to, with these attributes:
    - name: the model name;
    - id: the model unique identifier;
    - owner: the user owning the model, like "admin" or "who@external".
  @param {Boolean} confirmUncommitted Whether to show a confirmation if there
    are uncommitted changes.
  @param {Boolean} clearProfileState Whether to close the profile.
*/
utils.switchModel = function(
  modelAPI, addNotification, model, confirmUncommitted=true, clearProfileState=true) {
  if (model && model.id === this.modelUUID) {
    // There is nothing to be done as we are already connected to the model.
    // Note that this check is always false when switching models from the
    // profile view, as the "modelUUID" is set to null in that case.
    return;
  }
  if (modelAPI.get('ecs').isCommitting()) {
    const message = 'cannot switch models while deploying.';
    addNotification({
      title: message,
      message: message,
      level: 'error'
    });
    return;
  }
  const switchModel = utils._switchModel.bind(this, modelAPI, model, clearProfileState);
  const currentChangeSet = modelAPI.get('ecs').getCurrentChangeSet();
  // If there are uncommitted changes then show a confirmation popup.
  if (confirmUncommitted && Object.keys(currentChangeSet).length > 0) {
    utils._showUncommittedConfirm(switchModel);
    return;
  }
  // If there are no uncommitted changes or we don't want to confirm then
  // switch right away.
  switchModel();
};

/**
  Show the a confirmation popup for when there are uncommitted changes.
  @param {Function} action The method to call if the user continues.
*/
utils._showUncommittedConfirm = action => {
  const buttons = [{
    title: 'Cancel',
    action: utils._hidePopup.bind(this),
    type: 'inline-neutral'
  }, {
    title: 'Continue',
    action: action,
    type: 'destructive'
  }];
  ReactDOM.render(
    <Popup
      buttons={buttons}
      title="Uncommitted changes">
      <p>
        You have uncommitted changes to your model. You will
        lose these changes if you continue.
      </p>
    </Popup>,
    document.getElementById('popup-container'));
};

/**
  Hide the confirmation popup.
*/
utils._hidePopup = () => {
  ReactDOM.unmountComponentAtNode(
    document.getElementById('popup-container'));
};

/**
  Switch models using the correct username and password.
  @param {Object} modelAPI Reference to the app model API.
  @param {Object} model The model to switch to, with these attributes:
    - name: the model name;
    - id: the model unique identifier;
    - owner: the user owning the model, like "admin" or "who@external".
  @param {Boolean} clearProfileState Whether to close the profile.
*/
utils._switchModel = function(modelAPI, model, clearProfileState=true) {
  // Remove the switch model confirmation popup if it has been displayed to
  // the user.
  utils._hidePopup();
  const current = this.state.current;
  const newState = {
    gui: {
      status: null,
      inspector: null
    },
    root: null
  };
  if (clearProfileState) {
    newState.profile = null;
    newState.hash = null;
  }
  let name = '';
  let uuid = '';
  if (model) {
    uuid = model.id;
    name = model.name;
    const owner = model.owner.split('@')[0];
    newState.model = {path: `${owner}/${name}`, uuid: uuid};
    if (current && current.gui && current.gui.status !== undefined) {
      newState.gui.status = current.gui.status;
    }
  } else {
    newState.model = null;
    if (!current || !current.profile) {
      newState.root = 'new';
      // Clear the ECS here preemptively, so that if a model switch is not
      // triggered (for instance as we are going from new model to new model)
      // we still clear the canvas.
      modelAPI.get('ecs').clear();
    }
  }
  this.state.changeState(newState);
  modelAPI.set('environmentName', name);
  // It is the new init.
  this.modelUUID = uuid;
};

/**
  Navigate to the users profile page.
  @param {Function} changeState The method for changing the app state.
  @param {String} username The username of the profile to display.
*/
utils.showProfile = (changeState, username) => {
  changeState({
    profile: username,
    root: null,
    store: null,
    search: null,
    user: null
  });
};

/**
  Deploy or commit to a model.
  @param {Object} app The app instance itself.
  @param {Function} callback The function to be called once the deploy is
    complete. It must be passed an error string or null if the operation
    succeeds.
  @param {Boolean} autoplace Whether the unplace units should be placed.
  @param {String} modelName The name of the new model.
  @param {Object} args Any other optional argument that can be provided when
    creating a new model. This includes the following fields:
    - config: the optional model config;
    - cloud: the name of the cloud to create the model in;
    - region: the name of the cloud region to create the model in;
    - credential: the name of the cloud credential to use for managing the
      model's resources.
*/
utils.deploy = function(
  app, autoPlaceUnits, callback, autoplace=true, modelName, args, slaData) {
  const modelAPI = app.modelAPI;
  const controllerAPI = app.controllerAPI;
  const user = app.user;
  if (autoplace) {
    autoPlaceUnits();
  }
  // If we're in a model which exists then just commit the ecs and return.
  if (modelAPI.get('connected')) {
    modelAPI.get('ecs').commit(modelAPI);
    app.state.changeState({
      postDeploymentPanel: true
    });
    callback(null);
    return;
  }
  const handler = (err, model) => {
    if (err) {
      const msg = 'cannot create model: ' + err;
      app.db.notifications.add({title: msg, message: msg, level: 'error'});
      callback(msg, null);
      return;
    }
    const setSLAOnController = data => {
      if (data) {
        const parsed = JSON.parse(data);
        modelAPI.setSLALevel(slaData.name, parsed.owner, parsed.credentials, commit);
        return;
      }
      // If we have no SLA to add then carry on.
      commit();
    };
    const commit = args => {
      modelAPI.get('ecs').commit(modelAPI);
      // After committing then update state to update the url. This is done
      // after committing because changing state will change models and we
      // won't have visibility on when we're connected again and can
      // commit the changes.
      utils._switchModel.call(app, modelAPI, {
        id: model.uuid,
        name: model.name,
        owner: model.owner
      });
      callback(null, model);
    };
    const switchToModel = (err, slaData) => {
      if (err) {
        console.error(err);
        const msg = 'Unable to authorize SLA';
        app.db.notifications.add({title: msg, message: msg, level: 'error'});
        return;
      }
      const current = app.state.current;
      const rootState = current.root;
      if (rootState && rootState === 'new') {
        // If root is set to new then set it to null otherwise when the app
        // dispatches again it'll disconnect the model being deployed to.
        app.state.changeState({root: null});
      }
      const special = current.special;
      if (special && special.dd) {
        // Cleanup the direct deploy state so that we don't dispatch it again.
        app.state.changeState({special: {dd: null}});
      }
      app.modelUUID = model.uuid;
      const config = app.applicationConfig;
      const socketUrl = utils.createSocketURL({
        apiAddress: config.apiAddress,
        template: config.socketTemplate,
        protocol: config.socket_protocol,
        uuid: model.uuid
      });
      app.switchEnv(
        socketUrl, null, null, setSLAOnController.bind(this, slaData), true, false);
      app.state.changeState({
        postDeploymentPanel: true
      });
    };
    // If the user has set a budget and an SLA then authorize that after the
    // model has been created and the entities have been deployed.
    if (slaData) {
      app.plans.authorizeSLA(slaData.name, model.uuid, slaData.budget, switchToModel);
    } else {
      switchToModel();
    }
  };
  controllerAPI.createModel(modelName, user.controller.user, args, handler);
};

/**
  Generates a valid cloud credential name using the supplied arguments.
  TODO frankban: why are we using this function? We should not double guess
  credential names, but retrieve them from Juju. This is broken.
  @param {String} cloudName Name of the cloud that this credential applies,
    for instance "aws" or "google".
  @param {String} user Full user name, for instance "admin@local".
  @param {String} credName The name of the credential
    (TODO frankban: WTF!? We already have that? This is so confusing).
  @return A cloud credential name
*/
utils.generateCloudCredentialName = (cloudName, user, credName) => {
  return `${cloudName}_${user}_${credName}`;
};

/**
  Get the extra info for a cloud provided that is required by constious parts of
  the GUI.
  @param {String} providerName Name of the provider.
  @return {Object} The details for the provider.
*/

utils.getCloudProviderDetails = providerName => {
  const providers = {
    'gce': {
      id: 'google',
      showLogo: true,
      signupUrl: 'https://console.cloud.google.com/billing/freetrial',
      svgHeight: 33,
      svgWidth: 256,
      title: 'Google Compute Engine',
      forms: {
        jsonfile: [{
          id: 'file',
          title: 'Google Compute Engine project credentials .json file',
          json: true
        }],
        oauth2: [{
          id: 'client-id',
          title: 'Client ID'
        }, {
          id: 'client-email',
          title: 'Client e-mail address'
        }, {
          autocomplete: false,
          id: 'private-key',
          title: 'Private key',
          multiLine: true,
          unescape: true
        }, {
          id: 'project-id',
          title: 'Project ID'
        }]
      },
      message: (
        <p>
          Need help? Read more about <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/credentials"
            target="_blank" title="Cloud credentials help">credentials in
          general</a> or <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/help-google"
            target="_blank"
            title="Help using the Google Compute Engine public cloud">
            setting up GCE credentials</a>.
        </p>
      )
    },
    'azure': {
      id: 'azure',
      showLogo: true,
      signupUrl: 'https://azure.microsoft.com/en-us/free/',
      svgHeight: 24,
      svgWidth: 204,
      title: 'Microsoft Azure',
      forms: {
        'service-principal-secret': [{
          id: 'application-id',
          title: 'Azure Active Directory application ID'
        }, {
          id: 'subscription-id',
          title: 'Azure subscription ID'
        }, {
          id: 'application-password',
          title: 'Azure Active Directory application password',
          type: 'password'
        }]
      },
      message: (
        <p>
          Need help? Read more about <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/credentials"
            target="_blank" title="Cloud credentials help">credentials in
          general</a> or <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/help-azure"
            target="_blank"
            title="Help using the Microsoft Azure public cloud">setting up
          Azure credentials</a>.
        </p>
      )
    },
    'ec2': {
      id: 'aws',
      showLogo: true,
      signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
      'registration/index.html',
      svgHeight: 44,
      svgWidth: 117,
      title: 'Amazon Web Services',
      forms: {
        'access-key': [{
          id: 'access-key',
          title: 'The EC2 access key'
        }, {
          autocomplete: false,
          id: 'secret-key',
          title: 'The EC2 secret key'
        }]
      },
      message: (
        <p>
          Need help? Read more about <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/credentials"
            target="_blank" title="Cloud credentials help">credentials in
          general</a> or <a className="deployment-panel__link"
            href="https://jujucharms.com/docs/stable/help-aws" target="_blank"
            title="Help using the Amazon Web Service public cloud">setting up
          AWS credentials</a>.
        </p>
      )
    },
    'openstack': {
      id: 'openstack',
      showLogo: false,
      title: 'OpenStack',
      forms: {
        userpass: [{
          id: 'username',
          title: 'Username'
        }, {
          id: 'password',
          title: 'Password',
          type: 'password'
        }, {
          id: 'tenant-name',
          title: 'Tenant name'
        }, {
          id: 'domain-name',
          required: false,
          title: 'Domain name'
        }],
        'access-key': [{
          id: 'access-key',
          title: 'Access key'
        }, {
          autocomplete: false,
          id: 'secret-key',
          title: 'Secret key'
        }, {
          id: 'tenant-name',
          title: 'Tenant name'
        }]
      }
    },
    'cloudsigma': {
      id: 'cloudsigma',
      showLogo: false,
      title: 'CloudSigma',
      forms: {
        userpass: [{
          id: 'username',
          title: 'Username'
        }, {
          id: 'password',
          title: 'Password',
          type: 'password'
        }]
      }
    },
    'joyent': {
      id: 'joyent',
      showLogo: false,
      title: 'Joyent',
      forms: {
        userpass: [{
          id: 'sdc-user',
          title: 'SmartDataCenter user ID'
        }, {
          id: 'sdc-key-id',
          title: 'SmartDataCenter key ID'
        }, {
          autocomplete: false,
          id: 'private-key',
          title: 'Private key used to sign requests'
        }, {
          id: 'algorithm',
          title: 'Algorithm used to generate the private key'
        }]
      }
    },
    'maas': {
      id: 'maas',
      showLogo: false,
      title: 'MAAS',
      forms: {
        oauth1: [{
          id: 'maas-oauth',
          title: 'OAuth/API-key credentials for MAAS'
        }]
      }
    },
    'rackspace': {
      id: 'rackspace',
      showLogo: false,
      title: 'Rackspace',
      forms: {
        userpass: [{
          id: 'username',
          title: 'Username'
        }, {
          id: 'password',
          title: 'Password',
          type: 'password'
        }, {
          id: 'tenant-name',
          title: 'Tenant name'
        }, {
          id: 'domain-name',
          required: false,
          title: 'Domain name'
        }],
        'access-key': [{
          id: 'access-key',
          title: 'Access key'
        }, {
          autocomplete: false,
          id: 'secret-key',
          title: 'Secret key'
        }, {
          id: 'tenant-name',
          title: 'Tenant name'
        }]
      }
    },
    'vsphere': {
      id: 'vsphere',
      showLogo: false,
      title: 'vSphere',
      forms: {
        userpass: [{
          id: 'username',
          title: 'Username'
        }, {
          id: 'password',
          title: 'Password',
          type: 'password'
        }]
      }
    },
    localhost: {
      id: 'local',
      showLogo: false,
      title: 'Local'
    }
  };
  // Map the cloud id to provider type.
  switch (providerName) {
    case 'aws':
      providerName = 'ec2';
      break;
    case 'google':
      providerName = 'gce';
      break;
  }
  return providers[providerName];
};

/**
  Validate the form fields in a react component.
  @param {Array} fields A list of field ref names.
  @param {Object} refs The refs for a component.
  @returns {Boolean} Whether the form is valid.
*/
utils.validateForm = (fields, refs) => {
  let formValid = true;
  fields.forEach(field => {
    const ref = refs[field];
    if (!ref || !ref.validate) {
      return;
    }
    const valid = ref.validate();
    // If there is an error then mark that. We don't want to exit the loop
    // at this point so that each field gets validated.
    if (!valid) {
      formValid = false;
    }
  });
  return formValid;
};

/**
  Parse a constraints string into an object.
  @param constraints {String} A constraints string.
  @returns {Object} The constraints object.
*/
utils.parseConstraints = (genericConstraints, constraints='') => {
  let types = {};
  // Map the list of constraint types to an object.
  genericConstraints.forEach(constraint => {
    types[constraint] = null;
  });
  // The machine constraints are always a string in the format:
  // cpu-power=w cores=x mem=y root-disk=z
  constraints.split(' ').forEach(part => {
    const keyVal = part.split('=');
    // Add the value if it has a matching key.
    if (types[keyVal[0]] !== undefined) {
      types[keyVal[0]] = keyVal[1];
    }
  });
  return types;
};

/**
  Generate the hardware/constraints details for a machine
  @param machine {Object} A machine.
  @returns {String} The machine details.
*/
utils.parseMachineDetails = (genericConstraints, machine) => {
  const hardware = machine.hardware ||
    utils.parseConstraints(genericConstraints, machine.constraints) || {};
  let details = [];
  Object.keys(hardware).forEach(name => {
    let value = hardware[name];
    // Some details will not be set, so don't display them.
    if (value) {
      if (name === 'cpu-power' || name === 'cpuPower') {
        value = `${(value / 100)}GHz`;
      } else if (name === 'mem' || name === 'root-disk' || name === 'disk') {
        value = `${(value / 1024).toFixed(2)}GB`;
      }
      let label = name.replace('-', ' ');
      switch (label) {
        case 'cpuCores':
        case 'cpu cores':
          label = 'cores';
          break;
        case 'cpuPower':
        case 'cpu power':
          label = 'cpu';
          break;
        case 'rootDisk':
        case 'root disk':
          label = 'disk';
          break;
      }
      details.push({ label, value });
    }
  });
  return details && details.length ? details : null;
};

/**
  Generate the series/hardware/constraints details for a machine
  @param machine {Object} A machine.
  @returns {String} The machine details.
*/
utils.generateMachineDetails = (genericConstraints, units, machine) => {
  const unitCount = units.filterByMachine(machine.id, true).length;
  const details = utils.parseMachineDetails(genericConstraints, machine);
  const detailsLine = details ?
    details.map(detail => `${detail.label}: ${detail.value}`).join(', ') : '';
  let hardwareDetails;
  if (detailsLine) {
    const constraintsMessage = machine.constraints ?
      'requested constraints: ' : '';
    hardwareDetails = `${constraintsMessage}${detailsLine}`;
  }
  if (!hardwareDetails) {
    if (machine.commitStatus === 'uncommitted') {
      hardwareDetails = 'default constraints';
    } else {
      hardwareDetails = 'hardware details not available';
    }
  }
  const plural = unitCount === 1 ? '' : 's';
  const series = machine.series ? `${machine.series}, ` : '';
  return `${unitCount} unit${plural}, ${series}${hardwareDetails}`;
};


/**
  Given the db, env, service, unit count and constraints, create and auto
  place those units on new machines.

  @method createMachinesPlaceUnits
  @param {Object} db Reference to the app db.
  @param {Object} env Reference to the app env.
  @param {Object} service Reference to the service model to add units to.
  @param {Integer} numUnits The unit count from the form input.
  @param {Object} constraints The constraints to create the new machines with.
*/
utils.createMachinesPlaceUnits = function(
  db, env, service, numUnits, constraints) {
  let machine;
  let parentId = null;
  let containerType =null;
  for (let i = 0; i < parseInt(numUnits, 10); i += 1) {
    machine = db.machines.addGhost(
      parentId, containerType,
      {constraints: initUtils.formatConstraints(constraints)});
    env.addMachines([{
      constraints: constraints
    }], function(machine) {
      db.machines.remove(machine);
    }.bind(this, machine), { modelId: machine.id});
    env.placeUnit(addGhostAndEcsUnits(db, env, service, 1)[0], machine.id);
  }
};

/**
  Given the db, env, service, and unit count, add these units to the db
  and to the environment such that the unit tokens can be displayed and that
  the ECS will clean them up on deploy.

  @method addGhostAndEcsUnits
  @param {Object} db Reference to the app db.
  @param {Object} env Reference to the app env.
  @param {Object} service Reference to the service model to add units to.
  @param {Integer} unitCount the unit count from the form input.
  @param {Function} callback optional The callback to call after the units
    have been added to the env.
*/
function addGhostAndEcsUnits(db, env, service, unitCount, callback) {
  var serviceName = service.get('id'),
      unitCount = parseInt(unitCount, 10),
      units = [],
      displayName, ghostUnit, unitId, unitIdCount;
  // u will be a unit OR the previous unit index value.
  const parseId = u => parseInt((u.id && u.id.split('/')[1]) || u, 10);
  const serviceUnits = service.get('units').toArray();
  let highestIndex = -1;
  if (serviceUnits.length) {
    highestIndex = serviceUnits.reduce(
      (prev, curr) => Math.max(parseId(prev), parseId(curr)), 0);
  }
  // Service names have a $ in them when they are uncommitted. Uncomitted
  // service's display names are also wrapped in parens to display on the
  // canvas.
  if (serviceName.indexOf('$') > 0) {
    displayName = service.get('displayName')
      .replace(/^\(/, '').replace(/\)$/, '');
  } else {
    displayName = serviceName;
  }

  for (let i = 1; i <= unitCount; i += 1) {
    unitIdCount = highestIndex + i;
    unitId = serviceName + '/' + unitIdCount;
    ghostUnit = db.addUnits({
      id: unitId,
      displayName: displayName + '/' + unitIdCount,
      charmUrl: service.get('charm'),
      subordinate: service.get('subordinate')
    });
    env.add_unit(
      serviceName,
      1,
      null,
      removeGhostAddUnitCallback.bind(null, ghostUnit, db, callback),
      {modelId: unitId});
    units.push(ghostUnit);
  }
  return units;
};

/**
  Callback for the env add_unit call from the addGhostAndEcsUnit method.

  @method removeGhostAndUnitCallback
  @param {Object} ghostUnit the ghost unit created in the db which this fn
    needs to remove.
  @param {Object} db Reference to the app db instance.
  @param {Function} callback The user supplied callback for the env add_unit
    call.
  @param {Object} e env add_unit event facade.
*/
function removeGhostAddUnitCallback(ghostUnit, db, callback, e) {
  // Remove the ghost unit: the real unit will be re-added by the
  // mega-watcher handlers.
  ghostUnit.service = e.applicationName;
  db.removeUnits(ghostUnit);
  if (typeof callback === 'function') {
    callback(e, db, ghostUnit);
  }
}
utils.addGhostAndEcsUnits = addGhostAndEcsUnits;
utils.removeGhostAddUnitCallback = removeGhostAddUnitCallback;

/**
   Get a list of all the supported series.

   @method getSeriesList
   @return {Object} A collection of series.
 */
utils.getSeriesList = function() {
  // For a list of supported series in Juju see:
  // https://github.com/juju/charmstore/blob/v5-unstable/internal/
  // series/series.go#L37
  return {
    precise: {name: 'Precise 12.04'},
    trusty: {name: 'Trusty 14.04'},
    xenial: {name: 'Xenial 16.04'},
    centos7: {name: 'CentOS 7'},
    win2012hvr2: {name: 'Windows Server 2012 R2 Hyper-V'},
    win2012hv: {name: 'Windows Server 2012 Hyper-V'},
    win2012r2: {name: 'Windows Server 2012 R2'},
    win2012: {name: 'Windows Server 2012'}
  };
};

/**
 * Ensure a trailing slash on a string.
 * @method ensureTrailingSlash
 * @param {String} text The input string to check.
 * @return {String} The output string with trailing slash.
 */
utils.ensureTrailingSlash = function(text) {
  if (text.lastIndexOf('/') !== text.length - 1) {
    text += '/';
  }
  return text;
};

/**
  Returns the icon path result from either the Juju environment (for local
  charms) or the charmstore (for all others). You should call this method
  instead of the others directly to maintain consistency throughout the app.

  @method getIconPath
  @param {String} charmId The id of the charm to fetch the icon for.
  @param {Boolean} isBundle Whether or not this is an icon for a bundle.
*/
utils.getIconPath = function(charmId, isBundle, env) {
  var cfg = window.juju_config,
      charmstoreURL = (cfg && cfg.charmstoreURL) || '',
      localIndex = charmId.indexOf('local:'),
      path;
  charmstoreURL = utils.ensureTrailingSlash(charmstoreURL);

  if (localIndex > -1 && env) {
    path = env.getLocalCharmIcon(charmId);
  } else if (localIndex === -1) {
    if (typeof isBundle === 'boolean' && isBundle) {
      var staticURL = '';
      if (window.juju_config && window.juju_config.staticURL) {
        // The missing slash is important because we need to use an
        // associated path for GISF but a root path for GiJoe.
        staticURL = window.juju_config.staticURL + '/';
      }
      var basePath = `${staticURL}static/gui/build/app`;
      path = `${basePath}/assets/images/non-sprites/bundle.svg`;
    } else {
      // Get the charm ID from the service.  In some cases, this will be
      // the charm URL with a protocol, which will need to be removed.
      // The following regular expression removes everything up to the
      // colon portion of the quote and leaves behind a charm ID.
      charmId = charmId.replace(/^[^:]+:/, '');
      // Note that we make sure isBundle is Boolean. It's coming from a
      // handlebars template helper which will make the second argument the
      // context object when it's not supplied. We want it optional for
      // normal use to default to the charm version, but if it's a boolean,
      // then check that boolean because the author cares specifically if
      // it's a bundle or not.
      path = charmstoreURL + [
        charmstore.charmstoreAPIVersion, charmId, 'icon.svg'].join('/');
    }
  } else {
    // If no env is provided as necessary then return the default icon.
    path = 'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
  }
  return path;
};

/**
  Parses the error string and determines if the error is a redirect error.

  @method isRedirectError
  @param {String} error The error string returned from the api server.
  @return {Boolean} Whether it is a redirect error or not.
*/
utils.isRedirectError = function(error) {
  return error === 'authentication failed: redirection required';
};

/**
  Check that a value is valid and not null.

  @method isValue
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is not undefined, null or NaN.
*/
utils.isValue = value => {
  return value !== undefined && value !== null;
};

/**
  Check that a value is an object.

  @method isObject
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is an object.
*/
utils.isObject = value => {
  return typeof(value) === 'object' && value !== null &&
    !Array.isArray(value);
};

/**
  Remove duplicate entries from an array.

  @method arrayDedupe
  @returns {Array} An array with no duplicates.
*/
utils.arrayDedupe = function(array) {
  // Sets can only contain unique values, so use that to do the dedupe and
  // then turn it back into an array.
  return [...new Set(array)];
};

/**
  Turn an array of arrays into a single array.

  @method arrayFlatten
  @returns {Array} A single depth array.
*/
utils.arrayFlatten = function(array) {
  return array.reduce((flattened, current) => {
    return flattened.concat(
      // If this is an array then flatten it before concat, otherwise concat
      // the current value.
      Array.isArray(current) ? utils.arrayFlatten(current) : current);
  }, []);
};

/**
  Format the constraints to: cpu-power=w cores=x mem=y root-disk=z

  @method formatConstraints
  @param constraints {Object} A collection of constraints.
  @returns {String} A formatted constraints string.
*/
utils.formatConstraints = constraints => {
  return Object.keys(constraints || {}).reduce((collected, key) => {
    const value = constraints[key];
    if (value) {
      collected.push(key + '=' + value);
    }
    return collected;
  }, []).join(' ');
};

module.exports = utils;
