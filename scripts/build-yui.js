#!/usr/bin/env node
'use strict';

const fs = require('fs');

// This order is important.
const files = [
  'static/yui/attribute-core/attribute-core-min.js',
  'static/yui/oop/oop-min.js',
  'static/yui/attribute-extras/attribute-extras-min.js',
  'static/yui/attribute-base/attribute-base-min.js',
  'static/yui/event-custom-base/event-custom-base-min.js',
  'static/yui/event-custom-complex/event-custom-complex-min.js',
  'static/yui/attribute-observable/attribute-observable-min.js',
  'static/yui/base-base/base-base-min.js',
  'static/yui/base-observable/base-observable-min.js',
  'static/yui/base-build/base-build-min.js',
  'static/yui/base-core/base-core-min.js',
  'static/yui/escape/escape-min.js',
  'static/yui/json-parse/json-parse-min.js',
  'static/yui/model/model-min.js',
  'static/yui/arraylist/arraylist-min.js',
  'static/yui/array-invoke/array-invoke-min.js',
  'static/yui/array-extras/array-extras-min.js',
  'static/yui/model-list/model-list-min.js',
  'static/yui/pluginhost-base/pluginhost-base-min.js',
  'static/yui/pluginhost-config/pluginhost-config-min.js',
  'static/yui/datasource-local/datasource-local-min.js',
  'static/yui/base-pluginhost/base-pluginhost-min.js',
  'static/yui/lazy-model-list/lazy-model-list-min.js',
  'static/yui/io-base/io-base-min.js',
  'static/yui/querystring-stringify-simple/querystring-stringify-simple-min.js',
  'static/yui/datasource-io/datasource-io-min.js',
  'static/yui/dataschema-base/dataschema-base-min.js',
  'static/yui/json-stringify/json-stringify-min.js',
  'static/yui/plugin/plugin-min.js',
  'static/yui/dataschema-json/dataschema-json-min.js',
  'static/yui/datasource-jsonschema/datasource-jsonschema-min.js'
];

const combo = files.reduce((acc, val) => acc += fs.readFileSync(val), '');

fs.writeFileSync('static/assets/javascript/yui-bundle.js', combo);
