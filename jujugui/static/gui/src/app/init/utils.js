/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

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
const createSocketURL = function(apiAddress, template, uuid, server, port) {
  let baseUrl = '';
  const schema = 'wss://';
  if (!apiAddress) {
    // It should not ever be possible to get here unless you're running the
    // gui in dev mode without pointing it to a proxy/server supplying
    // the necessary config values.
    alert(
      'Unable to create socketURL, no apiAddress provided. The GUI must ' +
      'be loaded with a valid configuration. Try GUIProxy if ' +
      'running in development mode: https://github.com/frankban/guiproxy');
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

module.exports = {createSocketURL};
