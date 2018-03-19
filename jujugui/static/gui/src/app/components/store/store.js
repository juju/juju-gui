/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ExpertStoreCard = require('../expert-store-card/expert-store-card');

class Store extends React.Component {
  componentDidMount() {
    this.props.setPageTitle('Store');
  }

  /**
    Generate the path for local images on the store page

    @method _generateLocalImagePath
    @param {String} filename The name of the file
    @return {String} A path to the local asset
  */
  _generateLocalImagePath(filename) {
    const staticURL = this.props.staticURL || '';
    const basePath = `${staticURL}/static/gui/build/app/assets/images/store/`;
    return basePath + filename;
  }

  /**
    Generate the URL to a icon for a charm or bundle

    @method _generateIconPath
    @param {String} entityName The name of the charm or bundle
    @return {String} A URL to the entity icon
  */
  _generateIconPath(entityName) {
    const charmstoreURL = this.props.charmstoreURL;
    const apiVersion = this.props.apiVersion;
    return `${charmstoreURL}${apiVersion}/${entityName}/icon.svg`;
  }

  /**
    Generate the URL to a diagram for a bundle

    @method _generateDiagramPath
    @param {String} entityName The name of the bundle
    @return {String} A URL to the bundles diagram
  */
  _generateDiagramPath(entityName) {
    const charmstoreURL = this.props.charmstoreURL;
    const apiVersion = this.props.apiVersion;
    return `${charmstoreURL}${apiVersion}/bundle/${entityName}/diagram.svg`;
  }

  /**
    Generate the URL to a users page on the storefront

    @method _generateUserPath
    @param {String} username The name of the user
    @return {String} A URL to the users page on storefront
  */
  _generateUserPath(username) {
    return `https://jujucharms.com/u/${username}`;
  }

  /**
    Show the entity details when clicked.

    @method _handleEntityClick
    @param {String} id The entity id.
    @param {Object} e The click event.
  */
  _handleEntityClick(e) {
    e.stopPropagation();
    var id = (e.target.dataset.entity ||
      e.target.closest('[data-entity]').dataset.entity);
    this.props.changeState({
      store: id
    });
  }

  /**
    Show the search results when clicked.

    @method _handleSearchClick
    @param {String} query The search string.
    @param {Object} evt The click event.
  */
  _handleSearchClick(evt) {
    evt.stopPropagation();
    const search = {
      text: this._getData(evt.currentTarget, 'query')
    };
    const filterKey = this._getData(evt.currentTarget, 'filterkey');
    const filterValue = this._getData(evt.currentTarget, 'filtervalue');
    if (filterKey && filterValue) {
      search[filterKey] = filterValue;
    }
    this.props.changeState({
      root: null,
      search: search
    });
  }

  /**
    Stop events bubbling.

    @method _stopPropagation
    @param {Object} evt The click event.
  */
  _stopPropagation(evt) {
    evt.stopPropagation();
  }

  /**
    Get the data value for an element.

    @method _getData
    @param {Object} target The target node.
    @param {String} key The key for the data value.
    @returns {String} The data value.
  */
  _getData(target, key) {
    const node = target || target.closest(`[data-${key}]`);
    return node && node.dataset && node.dataset[key] || '';
  }

  /**
    The content for the write you own section of the page

    @method _writeOurOwnSection
    @return {Object} The contents of the section
  */
  _writeOurOwnSection() {
    const href =
      'https://www.jujucharms.com/docs/stable/authors-charm-writing';
    return (<div className="row row--write-your-own">
      <div className="wrapper">
        <div className="inner-wrapper">
          <div className="text six-col">
            <h2>Write a charm and join the ecosystem</h2>
            <p>Creating new charms it easy. Charms can be written
            in your choice of language and adapting existing
            scripts is straightforward. You can keep new charms
            private, or share them back with the community.</p>
            <p>
              <a className="link"
                href={href}
                target="_blank">
              Learn more about writing charms&nbsp;&rsaquo;
              </a></p>
          </div>
        </div>
        <div>
          <img src={this._generateLocalImagePath('write-your-own.png')} />
        </div>
      </div>
    </div>);
  }

  /**
    The content for the development tools section of the page

    @method _developmentToolsSection
    @return {Object} The contents of the section
  */
  _developmentToolsSection() {
    return (<div className="row row--border-bottom">
      <div className="inner-wrapper">
        <h2>Development tools</h2>
        <ul className="twelve-col no-bullets equal-height">
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="gitlab"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('gitlab')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Gitlab
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="jenkins"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('jenkins')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Jenkins
                </h3>
                <p>by Creative</p>
              </div>
            </span>
          </li>
        </ul>
      </div>
    </div>);
  }

  /**
    The content for the featured charms and bundles section of the page

    @method _featuredSection
    @return {Object} The contents of the section
  */
  _featuredSection() {
    let kubernetesButton = (<a className="button--inline-neutral"
      href="https://jujucharms.com/kubernetes"
      onClick={this._stopPropagation.bind(this)}
      target="_blank">
          Find out more
    </a>);
    let openstackButton = (<a className="button--inline-neutral"
      href="https://jujucharms.com/openstack"
      onClick={this._stopPropagation.bind(this)}
      target="_blank">
          Find out more
    </a>);
    let bigdataButton = (<a className="button--inline-neutral"
      href="https://jujucharms.com/big-data"
      onClick={this._stopPropagation.bind(this)}
      target="_blank">
          Find out more
    </a>);

    if (!this.props.gisf) {
      kubernetesButton = (<span className="button--inline-neutral"
        data-query="kubernetes"
        onClick={this._handleSearchClick.bind(this)}>
        View
      </span>);
      openstackButton = (<span className="button--inline-neutral"
        data-query="openstack"
        onClick={this._handleSearchClick.bind(this)}>
          View
      </span>);
      bigdataButton = (<span className="button--inline-neutral"
        data-query="hadoop"
        onClick={this._handleSearchClick.bind(this)}>
          View
      </span>);
    }

    const kubernetes = (
      <div className={
        `box box--kubernetes align-center ${
          this.props.gisf ? 'four-col' : 'four-col'
        }`}
      data-query="kubernetes"
      onClick={this._handleSearchClick.bind(this)}>
        <img alt="Kubernetes"
          className="box__image" src={this._generateLocalImagePath('k8-image.png')} />
        <div className="align-bottom">
          <h2>Kubernetes</h2>
          {kubernetesButton}
        </div>
      </div>
    );
    const openstack = this.props.gisf ? null : (
      <div className="box box--openstack align-center four-col"
        data-query="openstack"
        onClick={this._handleSearchClick.bind(this)}>
        <img alt="Openstack"
          className="box__image" src={this._generateLocalImagePath('openstack-promo.png')} />
        <div className="align-bottom">
          <h2>OpenStack</h2>
          {openstackButton}
        </div>
      </div>
    );
    const bigdata = (
      <div className={
        `box box--kubernetes align-center ${
          this.props.gisf ? 'four-col' : 'four-col'
        }`}
      data-query="hadoop"
      onClick={this._handleSearchClick.bind(this)}>
        <div className="box--hadoop-container">
          <img alt="Hadoop"
            className="box__image" src={this._generateLocalImagePath('hadoop-elephant.png')} />
          <div className="align-bottom">
            <h2>Big Data</h2>
            {bigdataButton}
          </div>
        </div>
      </div>
    );

    return (
      <div className="row equal-height">
        {kubernetes}
        {openstack}
        {bigdata}
        <ExpertStoreCard
          classes={['four-col', 'last-col', 'box--expert']}
          expert="spicule"
          staticURL={this.props.staticURL} />
      </div>);
  }

  /**
    Generate contents of the tagged list

    @method _tagsSection
    @return {Object} A generated section listing topics with counts
  */
  _tagsSection() {
    var topics = [
      {name: 'databases', count: 19},
      {name: 'app-servers', count: 19},
      {name: 'file-servers', count: 16},
      {name: 'monitoring', count: 14},
      {name: 'ops', count: 9},
      {name: 'openstack', count: 51},
      {name: 'applications', count: 75},
      {name: 'misc', count: 63},
      {name: 'network', count: 11},
      {name: 'analytics', count: 7},
      {name: 'apache', count: 38},
      {name: 'security', count: 4},
      {name: 'storage', count: 17}
    ];
    var list = [];
    topics.forEach(function(topic, index) {
      let key = `tagItem-${index}`;
      let comma = index === topics.length - 1 ? '' : ',';
      list.push(<li className="inline-list__item" key={key}>
        <span className="link"
          data-filterkey="tags"
          data-filtervalue={topic.name}
          onClick={this._handleSearchClick.bind(this)}>
          {topic.name}
        </span>
        <span className="note">({topic.count})</span>
        {comma}
      </li>);
    }, this);
    return (<div className="eight-col prepend-two align-center">
      <ul className="no-bullets inline-list">
        {list}
      </ul>
    </div>);
  }

  /**
    The content for the description of what a charm and bundle are section
    of the page

    @method _charmAndBundleSection
    @return {Object} The contents of the section
  */
  _charmAndBundleSection() {
    return (<div className="row row--charm-and-bundle row--border-bottom">
      <div className="inner-wrapper equal-height">
        <div className="six-col box">
          <div className="one-col no-margin-bottom align-center">
            <img
              alt=""
              src={this._generateLocalImagePath('charm-icon.png')} />
          </div>
          <div className="five-col no-margin-bottom last-col">
            <p>Charms are sets of scripts that simplify the
                  deployment and management tasks of a service. They
                  are regularly reviewed and updated.</p>
            <span className="button--inline-neutral"
              data-filterkey="type"
              data-filtervalue="charm"
              onClick={this._handleSearchClick.bind(this)}>
                      View all the charms
            </span>
          </div>
        </div>
        <div className="six-col last-col box">
          <div className="one-col no-margin-bottom align-center">
            <img
              alt=""
              src={this._generateLocalImagePath('bundle-icon.png')} />
          </div>
          <div className="five-col no-margin-bottom last-col">
            <p>Bundles are collections of charms that link
                  applications together, so you can deploy whole
                  chunks of infrastructure in one go.</p>
            <span className="button--inline-neutral"
              data-filterkey="type"
              data-filtervalue="bundle"
              onClick={this._handleSearchClick.bind(this)}>
                      View all the bundles
            </span>
          </div>
        </div>
        {this._tagsSection()}
      </div>
    </div>);
  }

  /**
    The content for the operations section of the page

    @method _operationsSection
    @return {Object} The contents of the section
  */
  _operationsSection() {
    return (<div className="row">
      <div className="inner-wrapper">
        <h2>Operations</h2>
        <div className="box box--nagios clearfix">
          <div className="six-col no-margin-bottom align-center">
            <img
              alt=""
              src={this._generateLocalImagePath('nagios-promo.png')} />
          </div>
          <div className="six-col no-margin-bottom last-col">
            <h3>Nagios</h3>
            <p>
                      By <a className="link"
                href={this._generateUserPath('charmers')}
                target="_blank">
                          charmers
              </a>
            </p>
            <p>Nagios offers complete monitoring, management
                  and alerting of any service from the charm store
                  that is related to it.</p>
            <span
              className="button--inline-neutral"
              data-entity="nagios"
              onClick={this._handleEntityClick.bind(this)}>
                      View the charm
            </span>
          </div>
        </div>

        <ul className="twelve-col no-bullets equal-height">
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="kibana"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('kibana')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              kibana
                </h3>
                <p>by containers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="logstash"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('logstash')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              logstash
                </h3>
                <p>by containers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="elasticsearch"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('elasticsearch')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Elasticsearch
                </h3>
                <p>by onlineservices-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col last-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="prometheus"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath(
                    'prometheus')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                                Prometheus
                </h3>
                <p>by prometheus-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <a className="featured-entity__link link"
              data-entity="munin"
              onClick={this._handleEntityClick.bind(this)}>
              <div
                className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('munin')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                            Munin
                </h3>
                <p>by charmers</p>
              </div>
            </a>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="rsyslog"
              onClick={this._handleEntityClick.bind(this)}>
              <div
                className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('rsyslog')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                                Rsyslog
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="zabbix-server"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image control-size"
                  src={this._generateIconPath('zabbix-server')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Zabbix Server
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col last-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="u/ricardokirkner/sentry"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image control-size"
                  src={this._generateIconPath(
                    '~ricardokirkner/sentry')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Sentry
                </h3>
                <p>by ricardokirkner</p>
              </div>
            </span>
          </li>
        </ul>
        <p className="intro">
          <span className="link"
            data-filterkey="tags"
            data-filtervalue="ops"
            onClick={this._handleSearchClick.bind(this)}>
                  View all operations&nbsp;&rsaquo;
          </span>
        </p>
      </div>
    </div>);
  }

  /**
    The content for the bigdata section of the page

    @method _bigDataSection
    @return {Object} The contents of the section
  */
  _bigDataSection() {
    return (<div className="row row--containers">
      <div className="wrapper bigdata">
        <div className="inner-wrapper bigdata">
          <div className="text six-col">
            <h2>Container management</h2>
            <p>Juju makes it easy to deploy container management solutions
            by provisioning, installing and configuring all the systems in
            the cluster.</p>
            <p><span className="button--inline-neutral"
              data-query="containers"
              onClick={this._handleSearchClick.bind(this)}>
              View bundles
            </span></p>
          </div>
        </div>
        <div>
          <img src={this._generateLocalImagePath('kubernetes-promo.png')} />
        </div>
      </div>
    </div>);
  }

  /**
    The content for the analytics section of the page

    @method _analyticsSection
    @return {Object} The contents of the section
  */
  _analyticsSection() {
    return (<div className="row row--border-bottom">
      <div className="inner-wrapper">
        <h2>Analytics</h2>
        <div className="box box--realtime-syslog-analytics clearfix">
          <div className="six-col no-margin-bottom align-center">
            <object
              data={this._generateDiagramPath(
                'realtime-syslog-analytics')}
              type="image/svg+xml"
              width="100%"
              wmode="transparent">
            </object>
          </div>
          <div className="six-col no-margin-bottom last-col">
            <h3>Realtime Syslog Analytics</h3>
            <p>By <a className="link"
              href={this._generateUserPath('bigdata-charmers')}
              target="_blank">
                          bigdata-charmers
            </a>
            </p>
            <p>This bundle provides a big data environment for
                  analysing syslog events. Built around Apache Hadoop
                  components, it offers a repeatable and reliable way
                  to setup complex software across multiple
                  substrates.</p>
            <span className="button--inline-neutral"
              data-entity="realtime-syslog-analytics"
              onClick={this._handleEntityClick.bind(this)}>
                      View the bundle
            </span>
          </div>
        </div>

        <ul className="twelve-col no-bullets equal-height">
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="hive"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('hive')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                                Hive
                </h3>
                <p>by bigdata-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="spark"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('spark')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Spark
                </h3>
                <p>by bigdata-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="zeppelin"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('zeppelin')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Zeppelin
                </h3>
                <p>by bigdata-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col last-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="elasticsearch-cluster"
              onClick={this._handleEntityClick.bind(this)}>
              <ul className="featured-entity__image-list one-col">
                <li className="featured-entity__image-list-item">
                  <img
                    alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath(
                      'elasticsearch')} />
                </li>
                <li className="featured-entity__image-list-item">
                  <img alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath('kibana')} />
                </li>
              </ul>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Elasticsearch cluster
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="u/elasticsearch-charmers/elk-stack"
              onClick={this._handleEntityClick.bind(this)}>
              <ul className="featured-entity__image-list one-col">
                <li className="featured-entity__image-list-item">
                  <img alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath('zulu8')} />
                </li>
                <li className="featured-entity__image-list-item">
                  <img
                    alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath(
                      'elasticsearch')} />
                </li>
                <li className="featured-entity__image-list-item">
                  <img
                    alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath(
                      '~containers/logstash')} />
                </li>
                <li className="featured-entity__image-list-item">
                  <img alt=""
                    className="featured-entity__image"
                    src={this._generateIconPath('kibana')} />
                </li>
              </ul>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              elk stack
                </h3>
                <p>by containers</p>
              </div>
            </span>
          </li>
        </ul>
        <p className="intro">
          <span className="link"
            data-filterkey="tags"
            data-filtervalue="analytics"
            onClick={this._handleSearchClick.bind(this)}>
                  View all analytics&nbsp;&rsaquo;
          </span>
        </p>
      </div>
    </div>);
  }

  /**
    The content for the databases section of the page

    @method _databasesSection
    @return {Object} The contents of the section
  */
  _databasesSection() {
    return (<div className="row row--border-bottom">
      <div className="inner-wrapper">
        <h2>Databases</h2>
        <div className="box box--mysql clearfix">
          <div className="six-col no-margin-bottom align-center">
            <img
              alt=""
              src={this._generateLocalImagePath('mysql-promo.png')} />
          </div>
          <div className="six-col no-margin-bottom last-col">
            <h3>MySQL</h3>
            <p>By <a className="link"
              href={this._generateUserPath('mysql-charmers')}
              target="_blank">
                          mysql-charmers
            </a>
            </p>
            <p>MySQL is a fast, stable and true multi-user,
                  multi-threaded SQL database server. Its main goals
                  are speed, robustness and ease of use.</p>
            <span className="button--inline-neutral"
              data-entity="mysql"
              onClick={this._handleEntityClick.bind(this)}>
                      View the charm
            </span>
          </div>
        </div>

        <ul className="twelve-col no-bullets equal-height">
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="cassandra"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('cassandra')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Cassandra
                </h3>
                <p>by cassandra-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="mariadb"
              onClick={this._handleEntityClick.bind(this)}>
              <div
                className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('mariadb')} />
              </div>
              <div
                className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                            Mariadb
                </h3>
                <p>by mariadb-charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="mongodb"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('mongodb')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Mongodb
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col last-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="redis"
              onClick={this._handleEntityClick.bind(this)}>
              <div className="one-col no-margin-bottom">
                <img
                  alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('redis')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Redis
                </h3>
                <p>by charmers</p>
              </div>
            </span>
          </li>
          <li className="three-col last-col featured-entity">
            <span className="featured-entity__link link"
              data-entity="postgresql"
              onClick={this._handleEntityClick.bind(this)}>
              <div
                className="one-col no-margin-bottom">
                <img alt=""
                  className="featured-entity__image"
                  src={this._generateIconPath('postgresql')} />
              </div>
              <div className="two-col last-col no-margin-bottom">
                <h3 className="featured-entity__title">
                              Postgresql
                </h3>
                <p>by postgresql-charmers</p>
              </div>
            </span>
          </li>
        </ul>
        <p className="intro">
          <span className="link"
            data-filterkey="tags"
            data-filtervalue="databases"
            onClick={this._handleSearchClick.bind(this)}>
                  View all databases&nbsp;&rsaquo;
          </span>
        </p>
      </div>
    </div>);
  }

  render() {
    return (
      <div className="store">
        {this._featuredSection()}
        {this._charmAndBundleSection()}
        {this._operationsSection()}
        {this._bigDataSection()}
        {this._analyticsSection()}
        {this._databasesSection()}
        {this._developmentToolsSection()}
        {this._writeOurOwnSection()}
      </div>
    );
  }
};

Store.propTypes = {
  apiVersion: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstoreURL: PropTypes.string.isRequired,
  gisf: PropTypes.bool.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  staticURL: PropTypes.string
};

module.exports = Store;
