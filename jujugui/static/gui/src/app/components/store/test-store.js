/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Store', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('store', function() { done(); });
  });

  it('can render correctly', function() {
    /*eslint-disable max-len */
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Store
        changeState={changeState} />);
    var expected = (<div className="store">
          <div className="row equal-height">
              <div className="box box--kibana align-center four-col">
                  <img src="/static/gui/build/app/assets/images/store/kabana-promo.png"
                    alt="" className="box__image" />
                  <div className="align-bottom">
                      <h2>Kibana</h2>
                      <a href="/?store=kibana"
                        className="button--inline-neutral">
                        View the charm
                      </a>
                  </div>
              </div>
              <div className="box box--kubernetes align-center four-col">
                  <img src="/static/gui/build/app/assets/images/store/kubernetes-promo.png"
                    alt="" className="box__image" />
                  <div className="align-bottom">
                      <h2>Observable Kubernetes</h2>
                      <a href="/?store=observable-kubernetes"
                        className="button--inline-neutral">
                        View the bundle
                      </a>
                  </div>
              </div>
              <div
                className="box box--openstack align-center four-col last-col">
                  <img src="/static/gui/build/app/assets/images/store/openstack-promo.png"
                    alt="" className="box__image" />
                  <div className="align-bottom">
                      <h2>OpenStack</h2>
                      <a href="/?search=openstack&type=bundle"
                        className="button--inline-neutral">
                        View bundles
                      </a>
                  </div>
              </div>
          </div>
          <div className="row row--charm-and-bundle row--border-bottom">
            <div className="inner-wrapper equal-height">
                <div className="six-col box">
                    <div className="one-col no-margin-bottom align-center">
                        <img
                          src="/static/gui/build/app/assets/images/store/charm-icon.png"
                          alt="" />
                    </div>
                    <div className="five-col no-margin-bottom last-col">
                        <p>Charms are sets of scripts that simplify the
                        deployment and management tasks of a service. They
                        are regularly reviewed and updated.</p>
                        <a href="/?search=&type=charm"
                          className="button--inline-neutral">
                          View all the charms
                        </a>
                    </div>
                </div>
                <div className="six-col last-col box">
                    <div className="one-col no-margin-bottom align-center">
                        <img
                          src="/static/gui/build/app/assets/images/store/bundle-icon.png"
                          alt="" />
                    </div>
                    <div className="five-col no-margin-bottom last-col">
                        <p>Bundles are collections of charms that link
                        applications together, so you can deploy whole
                        chunks of infrastructure in one go.</p>
                        <a href="/?search=&type=bundle"
                          className="button--inline-neutral">
                          View all the bundles
                        </a>
                    </div>
                </div>
                <div className="eight-col prepend-two align-center">
                    <ul className="no-bullets inline-list">
                        <li className="inline-list__item" key="tagItem-0">
                            <a href="/?search=&tags=databases">databases</a>
                            <span className="note">({19})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-1">
                            <a href="/?search=&tags=app-servers">app-servers</a>
                            <span className="note">({19})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-2">
                            <a href="/?search=&tags=file-servers">file-servers</a>
                            <span className="note">({16})</span>,
                        </li>
                        <li className="inline-list__item"  key="tagItem-3">
                            <a href="/?search=&tags=monitoring">monitoring</a>
                            <span className="note">({14})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-4">
                            <a href="/?search=&tags=ops">ops</a>
                            <span className="note">({9})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-5">
                            <a href="/?search=&tags=openstack">openstack</a>
                            <span className="note">({51})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-6">
                            <a href="/?search=&tags=applications">applications</a>
                            <span className="note">({75})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-7">
                            <a href="/?search=&tags=misc">misc</a>
                            <span className="note">({63})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-8">
                            <a href="/?search=&tags=network">network</a>
                            <span className="note">({11})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-9">
                            <a href="/?search=&tags=analytics">analytics</a>
                            <span className="note">({7})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-10">
                            <a href="/?search=&tags=apache">apache</a>
                            <span className="note">({38})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-11">
                            <a href="/?search=&tags=security">security</a>
                            <span className="note">({4})</span>,
                        </li>
                        <li className="inline-list__item" key="tagItem-12">
                            <a href="/?search=&tags=storage">storage</a>
                            <span className="note">({17})</span>,
                        </li>
                    </ul>
                </div>
            </div>
          </div>
          <div className="row">
            <div className="inner-wrapper">
                <h2>Operations</h2>
                <div className="box box--nagios clearfix">
                    <div className="six-col no-margin-bottom align-center">
                        <img
                          src="/static/gui/build/app/assets/images/store/nagios-promo.png"
                          alt="" />
                    </div>
                    <div className="six-col no-margin-bottom last-col">
                        <h3>Nagios</h3>
                        <p>
                          By <a href="https://jujucharms.com/u/charmers">
                            charmers
                          </a>
                        </p>
                        <p>Nagios offers complete monitoring, management
                        and alerting of any service from the charm store
                        that is related to it.</p>
                        <a href="/?store=nagios"
                          className="button--inline-neutral">
                          View the charm
                        </a>
                    </div>
                </div>

                <ul className="twelve-col no-bullets equal-height">
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link" href="/?store=kibana">
                            <div className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/kibana/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  kibana
                                </h3>
                                <p>by containers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=logstash">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/logstash/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  logstash
                                </h3>
                                <p>by containers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=elasticsearch">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/elasticsearch/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Elasticsearch
                                </h3>
                                <p>by onlineservices-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col last-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=~canonical-bootstack/prometheus">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/~canonical-bootstack/prometheus/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Prometheus
                                </h3>
                                <p>by canonical-bootstack</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link" href="/?store=munin">
                            <div
                              className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/munin/icon.svg"
                                alt=""
                                className="featured-entity__image" />
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
                        <a className="featured-entity__link"
                          href="/?store=rsyslog">
                            <div
                              className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/rsyslog/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Rsyslog
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=zabbix-server">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/zabbix-server/icon.svg"
                                  alt=""
                                  className="featured-entity__image control-size"/>
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Zabbix Server
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col last-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=~ricardokirkner/sentry">
                            <div
                              className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/~ricardokirkner/sentry/icon.svg"
                                  alt=""
                                  className="featured-entity__image control-size"/>
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Sentry
                                </h3>
                                <p>by ricardokirkner</p>
                            </div>
                        </a>
                    </li>
                </ul>
                <p className="intro">
                    <a href="/?search=&tags=ops">
                        View all operations&nbsp;&rsaquo;
                    </a>
                </p>
            </div>
          </div>
          <div className="row row--bigdata">
            <div className="inner-wrapper clearfix">
                <div className="six-col">
                    <h2>Big data charms and bundles</h2>
                    <p>Spend time testing, evaluating, and using your Big
                    Data solutions to benefit your business by using one of
                    Juju&rsquo;s pre-configured bundles or expertly
                    created charms.</p>
                    <p><a href="/?search=&tags=bigdata">
                      Big data charms and bundles&nbsp;&rsaquo;
                    </a></p>
                </div>
                <div className="four-col last-col prepend-one append-one">
                    <img
                      src="/static/gui/build/app/assets/images/store/hadoop-elephant.png"
                      className="for-small"
                      alt="Hadoop logo" />
                </div>
            </div>
          </div>
          <div className="row row--border-bottom">
            <div className="inner-wrapper">
                <h2>Analytics</h2>
                <div
                  className="box box--realtime-syslog-analytics clearfix">
                    <div className="six-col no-margin-bottom align-center">
                        <object
                          wmode="transparent"
                          width="100%"
                          type="image/svg+xml"
                          data="https://api.jujucharms.com/charmstore/v5/bundle/realtime-syslog-analytics/diagram.svg">
                        </object>
                    </div>
                    <div className="six-col no-margin-bottom last-col">
                        <h3>Realtime Syslog Analytics</h3>
                        <p>By <a href="https://jujucharms.com/u/bigdata-charmers">
                            bigdata-charmers
                          </a>
                        </p>
                        <p>This bundle provides a big data environment for
                        analysing syslog events. Built around Apache Hadoop
                        components, it offers a repeatable and reliable way
                        to setup complex software across multiple
                        substrates.</p>
                        <a href="/?store=realtime-syslog-analytics"
                          className="button--inline-neutral">
                          View the bundle
                        </a>
                    </div>
                </div>

                <ul className="twelve-col no-bullets equal-height">
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=apache-analytics-sql">
                            <ul className="featured-entity__image-list one-col">
                                <li className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/apache-hadoop-slave/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/apache-hive/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/mariadb/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li
                                  className="featured-entity__image-list-item">
                                  +3
                                </li>
                            </ul>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Apache analytics SQL
                                </h3>
                                <p>by bigdata-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=apache-spark">
                            <div className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/apache-spark/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Apache Spark
                                </h3>
                                <p>by bigdata-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=apache-zeppelin">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/apache-zeppelin/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Apache Zeppelin
                                </h3>
                                <p>by bigdata-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col last-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=elasticsearch-cluster/">
                            <ul
                              className="featured-entity__image-list one-col">
                                <li
                                  className="featured-entity__image-list-item">
                                    <img
                                      src="https://api.jujucharms.com/charmstore/v5/elasticsearch/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li
                                  className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/kibana/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                            </ul>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Elasticsearch cluster
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=~containers/elk-stack">
                            <ul
                              className="featured-entity__image-list one-col">
                                <li
                                  className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/zulu8/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li className="featured-entity__image-list-item">
                                    <img
                                      src="https://api.jujucharms.com/charmstore/v5/elasticsearch/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li className="featured-entity__image-list-item">
                                    <img
                                      src="https://api.jujucharms.com/charmstore/v5/~containers/logstash/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                                <li className="featured-entity__image-list-item">
                                    <img src="https://api.jujucharms.com/charmstore/v5/kibana/icon.svg"
                                      alt=""
                                      className="featured-entity__image" />
                                </li>
                            </ul>
                            <div className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  elk stack
                                </h3>
                                <p>by containers</p>
                            </div>
                        </a>
                    </li>
                </ul>
                <p className="intro">
                    <a href="/?search=&tags=analytics">
                        View all analytics&nbsp;&rsaquo;
                    </a>
                </p>
            </div>
          </div>
          <div className="row row--border-bottom">
            <div className="inner-wrapper">
                <h2>Databases</h2>
                <div className="box box--mysql clearfix">
                    <div className="six-col no-margin-bottom align-center">
                        <img
                          src="/static/gui/build/app/assets/images/store/mysql-promo.png"
                          alt="" />
                    </div>
                    <div className="six-col no-margin-bottom last-col">
                        <h3>MySQL</h3>
                        <p>By <a href="https://jujucharms.com/u/mysql-charmers">
                            mysql-charmers
                          </a>
                        </p>
                        <p>MySQL is a fast, stable and true multi-user,
                        multi-threaded SQL database server. Its main goals
                        are speed, robustness and ease of use.</p>
                        <a href="/?store=mysql"
                          className="button--inline-neutral">
                          View the charm
                        </a>
                    </div>
                </div>

                <ul className="twelve-col no-bullets equal-height">
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=cassandra">
                            <div className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/cassandra/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Cassandra
                                </h3>
                                <p>by cassandra-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=mariadb">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/mariadb/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Mariadb
                                </h3>
                                <p>by mariadb-charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=mongodb">
                            <div className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/mongodb/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Mongodb
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col last-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=redis">
                            <div className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/redis/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Redis
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col last-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=postgresql">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/postgresql/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Postgresql
                                </h3>
                                <p>by postgresql-charmers</p>
                            </div>
                        </a>
                    </li>
                </ul>
                <p className="intro">
                    <a href="/?search=&tags=databases">
                        View all databases&nbsp;&rsaquo;
                    </a>
                </p>
            </div>
          </div>
          <div className="row row--border-bottom">
            <div className="inner-wrapper">
                <h2>Development tools</h2>
                <ul className="twelve-col no-bullets equal-height">
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=gitlab">
                            <div
                              className="one-col no-margin-bottom">
                                <img src="https://api.jujucharms.com/charmstore/v5/gitlab/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Gitlab
                                </h3>
                                <p>by charmers</p>
                            </div>
                        </a>
                    </li>
                    <li className="three-col featured-entity">
                        <a className="featured-entity__link"
                          href="/?store=jenkins">
                            <div
                              className="one-col no-margin-bottom">
                                <img
                                  src="https://api.jujucharms.com/charmstore/v5/jenkins/icon.svg"
                                  alt=""
                                  className="featured-entity__image" />
                            </div>
                            <div
                              className="two-col last-col no-margin-bottom">
                                <h3 className="featured-entity__title">
                                  Jenkins
                                </h3>
                                <p>by Creative</p>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>
          </div>
          <div className="row row--write-your-own">
              <div className="inner-wrapper clearfix">
                  <div className="six-col">
                      <h2>Write a charm and join the ecosystem</h2>
                      <p>Creating new charms it easy. Charms can be written
                      in your choice of language and adapting existing
                      scripts is straightforward. You can keep new charms
                      private, or share them back with the community.</p>
                      <p>
                      <a
                        href="https://www.jujucharms.com/docs/stable/authors-charm-writing">
                        Learn more about writing charms&nbsp;&rsaquo;
                      </a></p>
                  </div>
              </div>
          </div>
      </div>);
    /*eslint-enable max-len */
    assert.deepEqual(output, expected);
  });
});
