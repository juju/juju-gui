/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusRemoteApplicationList = require('./remote-application-list');

describe('StatusRemoteApplicationList', () => {
  let remoteApplications;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusRemoteApplicationList
      remoteApplications={options.remoteApplications || remoteApplications}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    remoteApplications = [{
      getAttrs: sinon.stub().withArgs().returns({
        service: 'haproxy',
        status: {current: 'unknown'},
        url: 'local:admin/saas.haproxy'
      })
    }, {
      getAttrs: sinon.stub().withArgs().returns({
        service: 'mongo',
        status: {current: 'corrupting data'},
        url: 'local:admin/my.mongo'
      })
    }];
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
