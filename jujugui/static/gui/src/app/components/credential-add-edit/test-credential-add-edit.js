/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const CredentialAddEdit = require('./credential-add-edit');

describe('CredentialAddEdit', () => {
  let acl, controllerAPI;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <CredentialAddEdit
      acl={acl}
      addNotification={options.addNotification || sinon.stub()}
      cloudFacade={{
        clouds: options.cloudFacadeClouds || sinon.stub().callsArgWith(0, null, {
          aws: {
            cloudType: 'aws'
          },
          gce: {
            cloudType: 'gce'
          },
          guimaas: {
            cloudType: 'maas'
          }
        }),
        updateCredentials: sinon.stub()
      }}
      credential={options.credential}
      credentials={['test1', 'test2']}
      onCancel={options.onCancel || sinon.stub()}
      onCredentialUpdated={options.onCredentialUpdated || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      username="spinach@external" />
  );

  it('can show cloud options when adding credentials', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can show the loading spinner', () => {
    const wrapper = renderComponent({
      cloudFacadeClouds: sinon.stub()
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can show the form when adding credentials', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._setCloud({title: 'aws'});
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });

  it('can show the form for updating credentials', () => {
    const wrapper = renderComponent({
      credential: {
        name: 'cred-name',
        cloud: 'aws'
      }
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('does not show the change cloud button when only one cloud', () => {
    const wrapper = renderComponent({
      cloudFacadeClouds: sinon.stub().callsArgWith(0, null, {
        aws: {
          cloudType: 'aws'
        }
      })
    });
    const instance = wrapper.instance();
    instance._setCloud({title: 'aws'});
    assert.equal(wrapper.find('.credential-add-edit__choose-cloud').length, 0);
  });

  it('can handle errors when getting clouds', () => {
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      cloudFacadeClouds: sinon.stub().callsArgWith(0, 'Uh oh!', null)
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to list clouds',
      message: 'Unable to list clouds: Uh oh!',
      level: 'error'
    });
  });
});
