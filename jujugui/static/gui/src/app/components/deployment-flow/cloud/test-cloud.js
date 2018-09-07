'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentCloud = require('./cloud');
const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('DeploymentCloud', function() {
  let acl, cloudList;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentCloud
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      cloud={options.cloud || null}
      controllerIsReady={options.controllerIsReady || sinon.stub().returns(true)}
      listClouds={options.listClouds || sinon.stub().callsArgWith(0, null, cloudList)}
      setCloud={options.setCloud || sinon.stub()}
      setCloudCount={options.setCloudCount} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
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
                height={44}
                name="aws"
                width={117} />
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
    const setCloudCount = sinon.stub();
    renderComponent({
      listClouds: sinon.stub().callsArgWith(0, null, cloudList),
      setCloud,
      setCloudCount
    });
    assert.strictEqual(setCloud.callCount, 1);
    assert.deepEqual(setCloud.args[0][0], {
      name: 'google'
    });
    assert.strictEqual(setCloudCount.callCount, 1);
    assert.strictEqual(setCloudCount.args[0][0], 1);
  });

  it('can select a cloud', function() {
    var setCloud = sinon.stub();
    const wrapper = renderComponent({
      setCloud
    });
    wrapper.find('.deployment-cloud__cloud').at(0).simulate('click');
    assert.strictEqual(setCloud.callCount, 1);
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
