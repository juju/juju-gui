/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  // Define the list of valid charm/bundle series.
  const BUNDLE_SERIES = 'bundle';
  const SERIES = [
    // Bundles.
    BUNDLE_SERIES,
    // Ubuntu.
    'oneiric',
    'precise',
    'quantal',
    'raring',
    'saucy',
    'trusty',
    'utopic',
    'vivid',
    'wily',
    'xenial',
    'yakkety',
    'zesty',
    // Windows.
    'win2012hvr2',
    'win2012hv',
    'win2012r2',
    'win2012',
    'win7',
    'win8',
    'win81',
    'win10',
    'win2016',
    'win2016nano',
    // Centos.
    'centos7'
  ];

  // Define valid strings for the name and user parts of charm/bundle URLs.
  const namePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]*[a-z][a-z0-9]*)*$/;
  const userPattern = /^[a-z0-9][a-zA-Z0-9+.-]+$/;

  // Define prefixes for user owned charms/bundles.
  const USER_PREFIX = 'u/';
  const LEGACY_USER_PREFIX = '~';

  /**
    Validate the provided URL parts.

    @function validate
    @param parts {Object} A dict mapping URL parts to values. The only required
      field is "name", holding the name of the charm or bundle. Fields include:
      - name: the name of the charm or bundle;
      - schema: "cs" or "local", defaulting to "cs";
      - user: the name of the charm/bundle owner, or empty/undefined for
        promulgated entities;
      - series: the charm/bundle series, like "xenial", "trusty" or "bundle";
      - revision: the charm or bundle revision, as a positive int number or
        null/undefined for last stable revision.
    @returns {String} A validation error or null if all parts are valid.
  */
  function validate(parts) {
    const isStringOrNull = value => {
      if (value) {
        return typeof value === 'string';
      }
      return true;
    };

    if (!parts || !parts.name) {
      return 'charm/bundle name required but not provided';
    }
    if (!isStringOrNull(parts.name)) {
      return `charm/bundle name is not a string: "${parts.name}"`;
    }
    if (!namePattern.test(parts.name)) {
      return `invalid charm/bundle name: "${parts.name}"`;
    }
    if (!isStringOrNull(parts.schema)) {
      return `schema is not a string: "${parts.schema}"`;
    }
    if (parts.schema && parts.schema !== 'cs' && parts.schema !== 'local') {
      return `unrecognized schema: "${parts.schema}"`;
    }
    if (!isStringOrNull(parts.user)) {
      return `user is not a string: "${parts.user}"`;
    }
    if (!userPattern.test(parts.user)) {
      return `invalid user: "${parts.user}"`;
    }
    if (parts.series && SERIES.indexOf(parts.series) === -1) {
      return `invalid series: "${parts.series}"`;
    }
    const revision = parseInt(parts.revision, 10);
    if (isNaN(revision)) {
      if (parts.revision) {
        return `invalid revision: "${parts.revision}"`;
      }
    } else if (revision < 0) {
      return `revision is not a positive number: "${parts.revision}"`;
    }
    return null;
  };

  /**
    URL Initializer.
    Throw an error if the given parts are not valid charm/bundle URL parts.

    @function URL
    @param parts {Object} A dict mapping URL parts to values. The only required
      field is "name", holding the name of the charm or bundle. Fields include:
      - name: the name of the charm or bundle;
      - schema: "cs" or "local", defaulting to "cs";
      - user: the name of the charm/bundle owner, or empty/undefined for
        promulgated entities;
      - series: the charm/bundle series, like "xenial", "trusty" or "bundle";
      - revision: the charm or bundle revision, as a positive int number or
        null/undefined for last stable revision.
    @returns {Object} A URL object for handling charm and bundle URLs.
  */
  function URL(parts) {
    const err = validate(parts);
    if (err) {
      throw new Error(err);
    }
    this.name = parts.name;
    this.schema = parts.schema || 'cs';
    this.user = parts.user || '';
    this.series = parts.series || '';
    this.revision = parseInt(parts.revision, 10);
    if (isNaN(this.revision)) {
      this.revision = null;
    }
  };

  URL.prototype = {

    /**
      Return the charm/bundle URL path as a string (without the schema).

      @function path
      @returns {String} The path, like "wordpress", "django/bundle" or
        "u/who/haproxy/xenial/42".
    */
    path: function() {
      let value = this.name;
      if (this.user) {
        value = `${USER_PREFIX}${this.user}/${value}`;
      }
      if (this.series) {
        value = `${value}/${this.series}`;
      }
      if (this.revision !== null) {
        value = `${value}/${this.revision}`;
      }
      return value;
    },

    /**
      Return the legacy charm/bundle URL path as a string (without the schema).

      @function legacyPath
      @returns {String} The path, like "wordpress", "bundle/django" or
        "~who/xenial/haproxy-42".
    */
    legacyPath: function() {
      let value = this.name;
      if (this.series) {
        value = `${this.series}/${value}`;
      }
      if (this.user) {
        value = `${LEGACY_USER_PREFIX}${this.user}/${value}`;
      }
      if (this.revision !== null) {
        value = `${value}-${this.revision}`;
      }
      return value;
    },

    /**
      Return the charm/bundle URL as a string.

      @function toString
      @returns {String} The URL string, like "wordpress", "django/bundle" or
        "/u/who/haproxy/xenial/42".
    */
    toString: function() {
      return `${this.schema}:${this.path()}`;
    },

    /**
      Return the legacy charm/bundle URL as a string, including the schema.

      @function toString
      @returns {String} The URL string, like "cs:wordpress", "cs:bundle/rails",
        "local:kibana" or "cs:~who/xenial/haproxy-42".
    */
    toLegacyString: function() {
      return `${this.schema}:${this.legacyPath()}`;
    },

    /**
      Copy and return this URL.

      @function copy
      @returns {URL} The copied charm or bundle URL.
    */
    copy: function() {
      return new URL({
        name: this.name,
        schema: this.schema,
        user: this.user,
        series: this.series,
        revision: this.revision
      });
    },

    /**
      Report whether this URL refers to a bundle entity.

      @function isBundle
      @returns {Boolean} Whether this URL identifies a bundle.
    */
    isBundle: function() {
      return this.series === BUNDLE_SERIES;
    },

    /**
      Return True if this refers to a local entity, False otherwise.

      @function isLocal
      @returns {Boolean} Whether this URL identifies a local charm/bundle.
    */
    isLocal: function() {
      return this.schema === 'local';
    }

  };

  /**
    Given an entity URL as a string, create and return a URL.
    Throw an error if the given value is not a valid charm/bundle URL string.

    @function fromString
    @param value {String} The charm/bundle URL string, like "wordpress",
      "django/bundle" or "/u/who/haproxy/xenial/42".
    @returns {URL} The resulting charm or bundle URL object.
  */
  URL.fromString = value => {
    value = cleanup(value);
    const parts = {schema: 'cs'};
    // Handle the schema part, if any.
    const schemaFragments = value.split(':');
    if (schemaFragments.length > 1) {
      parts.schema = schemaFragments.shift();
      value = schemaFragments.join(':');
    }
    const fragments = value.split('/');
    // Handle the user part, if any.
    if (value.indexOf(USER_PREFIX) === 0) {
      fragments.shift(); // This removes the user prefix.
      if (!fragments.length) {
        throw new Error(`URL only includes the user prefix: ${value}`);
      }
      parts.user = fragments.shift();
    }
    // Validation of undefined values will be done by the URL constructor.
    parts.name = fragments.shift();
    let seriesOrRevision = fragments.shift();
    if (seriesOrRevision === undefined) {
      return new URL(parts);
    }
    if (isNaN(parseInt(seriesOrRevision, 10))) {
      parts.series = seriesOrRevision;
      seriesOrRevision = fragments.shift();
    }
    parts.revision = seriesOrRevision;
    if (fragments.length) {
      throw new Error(`URL includes too many parts: ${value}`);
    }
    return new URL(parts);
  };

  /**
    Given an entity legacy URL as a string, create and return a URL.
    Throw an error if the given value is not a valid charm/bundle URL string.

    @function fromLegacyString
    @param value {String} The charm/bundle legacy URL string, like
      "cs:wordpress", "cs:bundle/rails", "local:kibana" or
      "cs:~who/xenial/haproxy-42".
    @returns {URL} The resulting charm or bundle URL object.
  */
  URL.fromLegacyString = value => {
    value = cleanup(value);
    const parts = {schema: 'cs'};
    // Handle the schema part, if any.
    const schemaFragments = value.split(':');
    if (schemaFragments.length > 1) {
      parts.schema = schemaFragments.shift();
      value = schemaFragments.join(':');
    }
    const fragments = value.split('/');
    // Handle the user part, if any.
    if (value.indexOf(LEGACY_USER_PREFIX) === 0) {
      parts.user = fragments.shift().replace(/^~/, '');
      if (!parts.user) {
        throw new Error(`URL only includes the user prefix: ${value}`);
      }
    }
    // Handle the series part if any.
    if (fragments.length > 1) {
      parts.series = fragments.shift();
    }
    // Validation of undefined values will be done by the URL constructor.
    parts.name = fragments.shift() || '';
    if (fragments.length) {
      throw new Error(`URL includes too many parts: ${value}`);
    }
    const nameParts = parts.name.split('-');
    if (nameParts.length > 1) {
      const possibleRevision = parseInt(nameParts[nameParts.length-1], 10);
      if (!isNaN(possibleRevision)) {
        parts.revision = possibleRevision;
        parts.name = nameParts.slice(0, nameParts.length-1).join('-');
      }
    }
    return new URL(parts);
  };

  /**
    Clean up the given URL value.
    Throw an error if the given value is not a valid charm/bundle URL string.

    @function cleanup
    @param value {String} The charm/bundle URL or legacy URL string.
    @returns {String} A cleaned up version of the input string.
  */
  const cleanup = value => {
    if (!value || typeof value !== 'string') {
      throw new Error(`invalid URL: "${value}"`);
    }
    if (value.indexOf(' ') !== -1) {
      throw new Error(`URL contains spaces: "${value}"`);
    }
    // Remove leading and trailing slashes.
    return value.replace(/^\//, '').replace(/\/$/, '');
  };

  const jujulib = exports.jujulib;
  jujulib.URL = URL;
  jujulib.SERIES = SERIES;
  jujulib.BUNDLE_SERIES = BUNDLE_SERIES;
  jujulib.CHARM_SERIES = SERIES.filter(series => {
    return series !== BUNDLE_SERIES;
  });

}((module && module.exports) ? module.exports : this));
