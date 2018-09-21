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
    remoteApplications = {
      'mysql': {
        modelUUID: 'fe1060e8-0a10-424f-8007-d45c69ca04b5',
        name: 'mysql',
        offerUUID: 'efb9f9b7-65f3-4f6f-86a4-58bebf32c1f4',
        offerURL: 'localhost-localhost:admin/saas.mysql',
        life: 'alive',
        status: {
          current: 'waiting',
          message: 'waiting for machine',
          since: '2018-09-19T12:30:05.572836696Z',
          version: ''
        }
      }
    };
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
