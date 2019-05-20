/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const Analytics = require('../../../test/fake-analytics');
const CredentialAddEdit = require('./credential-add-edit');
const Spinner = require('../spinner/spinner');

describe('CredentialAddEdit', () => {
  let acl, controllerAPI, controllerIsReady;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    controllerIsReady = sinon.stub().returns(true);
    controllerAPI = {
      listClouds: sinon.stub().callsArgWith(0, null, {
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
      reshape: shapeup.reshapeFunc,
      updateCloudCredential: sinon.stub()
    };
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <CredentialAddEdit
      acl={acl}
      addNotification={options.addNotification || sinon.stub()}
      analytics={Analytics}
      controllerAPI={controllerAPI}
      controllerIsReady={controllerIsReady}
      credential={options.credential}
      credentials={['test1', 'test2']}
      onCancel={options.onCancel || sinon.stub()}
      onCredentialUpdated={options.onCredentialUpdated || sinon.stub()}
      username="spinach@external" />
  );

  it('can show cloud options when adding credentials', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can show the loading spinner', () => {
    controllerAPI.listClouds = sinon.stub();
    const wrapper = renderComponent();
    const expected = (
      <div className="credential-add-edit">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper, expected);
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
    controllerAPI.listClouds.callsArgWith(0, null, {
      aws: {
        cloudType: 'aws'
      }
    });
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._setCloud({title: 'aws'});
    assert.equal(wrapper.find('.credential-add-edit__choose-cloud').length, 0);
  });

  it('can handle errors when getting clouds', () => {
    controllerAPI.listClouds.callsArgWith(0, 'Uh oh!', null);
    const addNotification = sinon.stub();
    renderComponent({addNotification: addNotification});
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to list clouds',
      message: 'Unable to list clouds: Uh oh!',
      level: 'error'
    });
  });
});
