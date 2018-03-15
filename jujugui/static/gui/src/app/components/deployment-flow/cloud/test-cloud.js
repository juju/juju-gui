/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentCloud = require('./cloud');
const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('DeploymentCloud', function() {
  let acl, cloudList, getCloudProviderDetails;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentCloud
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      cloud={options.cloud || null}
      controllerIsReady={options.controllerIsReady || sinon.stub().returns(true)}
      getCloudProviderDetails={options.getCloudProviderDetails || getCloudProviderDetails}
      listClouds={options.listClouds || sinon.stub().callsArgWith(0, null, cloudList)}
      setCloud={options.setCloud || sinon.stub()} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    getCloudProviderDetails = sinon.stub();
    getCloudProviderDetails.withArgs('gce').returns({
      id: 'google',
      showLogo: true,
      signupUrl: 'https://console.cloud.google.com/billing/freetrial',
      svgHeight: 33,
      svgWidth: 256,
      title: 'Google Compute Engine'
    });
    getCloudProviderDetails.withArgs('azure').returns({
      id: 'azure',
      showLogo: true,
      signupUrl: 'https://azure.microsoft.com/en-us/free/',
      svgHeight: 24,
      svgWidth: 204,
      title: 'Microsoft Azure'
    });
    getCloudProviderDetails.withArgs('ec2').returns({
      id: 'aws',
      showLogo: true,
      signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
      'registration/index.html',
      svgHeight: 48,
      svgWidth: 120,
      title: 'Amazon Web Services'
    });
    cloudList = {
      'google': {
        name: 'google',
        cloudType: 'gce'
      },
      'azure': {
        name: 'azure',
        cloudType: 'azure'
      },
      'aws': {
        name: 'aws',
        cloudType: 'ec2'
      }
    };
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const options = wrapper.find('.deployment-cloud__cloud');
    var expected = (
      <div>
        <ul className="deployment-cloud__list">
          <li className="deployment-cloud__cloud four-col"
            key="google"
            onClick={options.at(0).prop('onClick')}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <SvgIcon
                height={33}
                name="google"
                width={256} />
            </span>
          </li>
          <li className="deployment-cloud__cloud four-col"
            key="azure"
            onClick={options.at(1).prop('onClick')}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <SvgIcon
                height={24}
                name="azure"
                width={204} />
            </span>
          </li>
          <li className="deployment-cloud__cloud four-col last-col"
            key="aws"
            onClick={options.at(2).prop('onClick')}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <SvgIcon
                height={48}
                name="aws"
                width={120} />
            </span>
          </li>
        </ul>
        {undefined}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display the loading state', function() {
    const wrapper = renderComponent({ listClouds: sinon.stub() });
    var expected = (
      <div className="deployment-cloud__loading">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper.find('.deployment-cloud__loading'), expected);
  });

  it('can render with a chosen cloud', function() {
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'},
      listClouds: sinon.stub().callsArgWith(0, null, {})
    });
    var expected = (
      <div className="deployment-cloud__chosen">
        <SvgIcon
          height={33}
          name="google"
          width={256} />
      </div>);
    assert.compareJSX(wrapper.find('.deployment-cloud__chosen'), expected);
    assert.equal(wrapper.find('.deployment-cloud__list').length, 0);
  });

  it('automatically selects a cloud if there is only one', function() {
    cloudList = {
      'google': {name: 'google'}
    };
    const setCloud = sinon.stub();
    renderComponent({
      listClouds: sinon.stub().callsArgWith(0, null, cloudList),
      setCloud
    });
    assert.equal(setCloud.callCount, 1);
    assert.deepEqual(setCloud.args[0][0], {
      name: 'google'
    });
  });

  it('can select a cloud', function() {
    var setCloud = sinon.stub();
    const wrapper = renderComponent({
      setCloud
    });
    wrapper.find('.deployment-cloud__cloud').at(0).simulate('click');
    assert.equal(setCloud.callCount, 1);
    assert.deepEqual(setCloud.args[0][0], {
      name: 'google',
      cloudType: 'gce'
    });
  });

  it('can handle errors getting clouds', function() {
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      listClouds: sinon.stub().callsArgWith(0, 'Uh oh!', null)
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to list clouds',
      message: 'unable to list clouds: Uh oh!',
      level: 'error'
    });
  });
});
