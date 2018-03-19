/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSSHKey = require('./sshkey');
const InsetSelect = require('../../inset-select/inset-select');
const SvgIcon = require('../../svg-icon/svg-icon');
const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');
const Notification = require('../../notification/notification');

describe('DeploymentSSHKey', function() {
  let addNotification;
  let setSSHKeys;
  let setLaunchpadUsernames;
  let getGithubSSHKeys;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSSHKey
      addNotification={options.addNotification || addNotification}
      cloud={options.cloud === undefined ? {cloudType: 'aws'} : options.cloud}
      getGithubSSHKeys={options.getGithubSSHKeys || getGithubSSHKeys}
      setLaunchpadUsernames={options.setLaunchpadUsernames || setLaunchpadUsernames}
      setSSHKeys={options.setSSHKeys || setSSHKeys}
      username={options.username}
      WebHandler={options.WebHandler || sinon.stub()} />
  );

  beforeEach(() => {
    addNotification = sinon.stub();
    setSSHKeys = sinon.stub();
    setLaunchpadUsernames = sinon.stub();
    getGithubSSHKeys = sinon.stub();
  });

  it('does not render without a cloud', function() {
    const wrapper = renderComponent({
      cloud: null
    });
    assert.strictEqual(wrapper.html(), null);
  });

  it('renders with a cloud', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-ssh-key">
        <p className="deployment-ssh-key__description">
          Keys will allow you SSH access to the machines
          provisioned by Juju for this model.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <InsetSelect
              disabled={false}
              label="Source"
              onChange={wrapper.find('InsetSelect').prop('onChange')}
              options={[
                {
                  label: 'GitHub',
                  value: 'github'
                },
                {
                  label: 'Manual',
                  value: 'manual'
                },
                {
                  label: 'Launchpad',
                  value: 'launchpad'
                }
              ]}
              ref="sshSource" />
          </div>
          <div className="deployment-ssh-key__username three-col last-col no-margin-bottom">
            <GenericInput
              autocomplete={true}
              key="githubUsername"
              label="GitHub username"
              multiLine={false}
              onKeyUp={wrapper.find('GenericInput').prop('onKeyUp')}
              ref="githubUsername"
              required={false}
              type="text" />
          </div>
          <div className="deployment-ssh-key__add-key right">
            <GenericButton
              action={wrapper.find('GenericButton').prop('action')}
              disabled
              type="positive">Add keys</GenericButton>
          </div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('prefills Launchpad username if available', () => {
    const wrapper = renderComponent({
      username: 'rose'
    });
    const instance = wrapper.instance();
    instance.refs = {
      launchpadUsername: {getValue: () => 'rose'},
      sshSource: {getValue: () => 'launchpad'}
    };
    instance.componentDidUpdate();
    instance._handleSourceChange();
    wrapper.update();
    const expected = (
      <div className="deployment-ssh-key__username three-col last-col no-margin-bottom">
        <GenericInput
          autocomplete
          key="launchpadUsername"
          label="Launchpad username"
          multiLine={false}
          onKeyUp={wrapper.find('GenericInput').prop('onKeyUp')}
          ref="launchpadUsername"
          required={false}
          type="text"
          value="rose" />
      </div>
    );
    assert.compareJSX(wrapper.find('.deployment-ssh-key__username'), expected);
  });

  it('renders with azure', function() {
    const wrapper = renderComponent({
      cloud: {cloudType: 'azure'}
    });
    const expected = (
      <p className="deployment-ssh-key__description">
        Keys will allow you SSH access to the machines provisioned on Azure.
      </p>
    );
    assert.compareJSX(wrapper.find('.deployment-ssh-key__description'), expected);
  });

  describe('github', () => {
    it('handles errors when getting keys', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance._addGithubKeysCallback('Uh oh!', null);
      assert.equal(addNotification.callCount, 1);
      assert.deepEqual(addNotification.args[0][0], {
        title: 'could not get SSH keys',
        message: 'could not get SSH keys: Uh oh!',
        level: 'error'
      });
    });

    it('shows an error if no keys found', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance._addGithubKeysCallback(null, []);
      wrapper.update();
      const expected = (
        <span className="deployment-ssh-key__notification">
          <Notification
            content={(
              <span>
                <b>Error:</b>
                <span>
                  No keys found.
                  <a className="link" href="https://github.com/settings/keys"
                    target="_blank">Create an SSH Key</a>.
                </span>
              </span>
            )}
            type="negative" />
        </span>);
      assert.compareJSX(wrapper.find('.deployment-ssh-key__notification'), expected);
    });

    it('shows an error if user not found', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance._addGithubKeysCallback('Not Found', {
        message: 'Not Found'
      });
      wrapper.update();
      const expected = (
        <span className="deployment-ssh-key__notification">
          <Notification
            content={(<span><b>Error:</b> Not Found</span>)}
            type="negative" />
        </span>);
      assert.compareJSX(wrapper.find('.deployment-ssh-key__notification'), expected);
    });

    it('creates a table if keys present', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance.refs = {
        githubUsername: {
          getValue: sinon.stub(),
          focus: sinon.stub(),
          setValue: sinon.stub()
        }
      };
      instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'}
      ]);
      wrapper.update();
      const expected = (
        <div className="deployment-ssh-key__added-keys">
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col">
              <div className="two-col">Type</div>
              <div className="ten-col last-col">Key</div>
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="two-col">ssh-rsa</div>
              <div className="nine-col added-keys__key-value" title="thekey">
                thekey
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={wrapper.find('.added-keys__key-remove').prop('onClick')}
                  role="button"
                  title="Remove key">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
      assert.compareJSX(wrapper.find('.deployment-ssh-key__added-keys'), expected);
    });

    it('removes key from table', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance.refs = {
        githubUsername: {
          getValue: sinon.stub(),
          focus: sinon.stub(),
          setValue: sinon.stub()
        }
      };
      instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'}
      ]);
      wrapper.update();
      assert.equal(wrapper.find('.deployment-ssh-key__added-keys').length, 1);
      const expected = (
        <span className="added-keys__key-remove right"
          onClick={wrapper.find('.added-keys__key-remove').prop('onClick')}
          role="button"
          title="Remove key">
          <SvgIcon name="close_16" size="16" />
        </span>
      );
      assert.compareJSX(wrapper.find('.added-keys__key-remove'), expected);
      instance._removeKey(1);
      wrapper.update();
      assert.equal(wrapper.find('.deployment-ssh-key__added-keys').length, 0);
    });

    it('stores the SSH keys', function() {
      const wrapper = renderComponent({ cloud: { cloudType: 'gce' } });
      const instance = wrapper.instance();
      instance.refs = {
        githubUsername: {
          getValue: sinon.stub(),
          focus: sinon.stub(),
          setValue: sinon.stub()
        }
      };
      instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'},
        {id: 2, type: 'ssh-rsa', body: 'thekey2', text: 'ssh-rsa thekey2'}
      ]);
      expect(instance.props.setSSHKeys.callCount).toEqual(1);
      expect(instance.props.setSSHKeys.args[0][0]).
        toEqual([
          {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'},
          {id: 2, type: 'ssh-rsa', body: 'thekey2', text: 'ssh-rsa thekey2'}
        ]);
    });

    it('disables the add key button after keys stored', function() {
      const wrapper = renderComponent({ cloud: { cloudType: 'gce' } });
      const instance = wrapper.instance();
      let githubUsername = 'spinach';
      instance.refs = {
        githubUsername: {
          getValue: () => githubUsername,
          focus: sinon.stub(),
          setValue: value => {
            githubUsername = value;
          }
        }
      };
      instance.componentDidUpdate();
      wrapper.update();
      assert.equal(wrapper.find('GenericButton').prop('disabled'), false);
      instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'}
      ]);
      expect(instance.props.setSSHKeys.callCount).toEqual(1);
      wrapper.update();
      assert.equal(wrapper.find('GenericButton').prop('disabled'), true);
    });
  });

  it('changes source and disables the button', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {sshSource: {getValue: () => 'manual'}};
    instance._handleSourceChange();
    expect(instance.state.addSource).toEqual('manual');
    expect(instance.state.buttonDisabled).toEqual(true);
  });

  describe('launchpad', () => {
    let instance, wrapper;

    beforeEach(() => {
      wrapper = renderComponent({ cloud: { cloudType: 'gce' } });
      instance = wrapper.instance();
      instance.refs = {
        sshSource: {getValue: () => 'launchpad'},
        launchpadUsername: {
          setValue: () => sinon.stub(),
          focus: () => sinon.stub(),
          getValue: () => 'rose'
        }
      };
      instance.setState({buttonDisabled: false});
    });

    it('stores the Launchpad username', () => {
      instance._handleAddMoreKeys(wrapper.instance);
      expect(instance.props.setLaunchpadUsernames.callCount).toEqual(1);
      assert.deepEqual(
        instance.props.setLaunchpadUsernames.args[0][0],
        ['rose']);
    });

    it('shows a table if usernames are present', () => {
      instance._handleAddMoreKeys(wrapper.instance);
      wrapper.update();
      const expected = (
        <div className="deployment-ssh-key__added-keys">
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col last-col">
              Launchpad Users
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="eleven-col">
                rose
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={wrapper.find('.added-keys__key-remove').prop('onClick')}
                  role="button"
                  title="Remove username">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
      assert.compareJSX(wrapper.find('.deployment-ssh-key__added-keys'), expected);
    });

    it('removes key from table', () => {
      instance._handleAddMoreKeys(wrapper.instance);
      wrapper.update();
      const expected = (
        <div className="deployment-ssh-key__added-keys">
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col last-col">
              Launchpad Users
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="eleven-col">
                rose
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={wrapper.find('.added-keys__key-remove').prop('onClick')}
                  role="button"
                  title="Remove username">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
      assert.compareJSX(wrapper.find('.deployment-ssh-key__added-keys'), expected);
      wrapper.find('.added-keys__key-remove').props().onClick('rose');
      wrapper.update();
      assert.equal(wrapper.find('.deployment-ssh-key__added-keys').length, 0);
    });

    it('shows a table for usernames and keys', () => {
      instance.setState({SSHkeys: [{
        body: 'thekey',
        text: 'ssh-rsa thekey',
        type: 'ssh-rsa',
        id: 0
      }]});
      instance._handleAddMoreKeys(wrapper.instance);
      wrapper.update();
      const expected = (
        <div className="deployment-ssh-key__added-keys">
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col">
              <div className="two-col">Type</div>
              <div className="ten-col last-col">Key</div>
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="two-col">ssh-rsa</div>
              <div className="nine-col added-keys__key-value" title="thekey">
                thekey
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={wrapper.find('.added-keys__key-remove').at(0).prop('onClick')}
                  role="button"
                  title="Remove key">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col last-col">
              Launchpad Users
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="eleven-col">
                rose
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={wrapper.find('.added-keys__key-remove').at(1).prop('onClick')}
                  role="button"
                  title="Remove username">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
      assert.compareJSX(wrapper.find('.deployment-ssh-key__added-keys'), expected);
    });
  });

  describe('manual', () => {
    let instance, wrapper;

    beforeEach(() => {
      wrapper = renderComponent({ cloud: { cloudType: 'gce' } });
      instance = wrapper.instance();
      instance.refs = {
        sshSource: {getValue: () => 'manual'},
        sshKey: {
          setValue: () => sinon.stub(),
          focus: () => sinon.stub(),
          getValue: () => 'ssh-rsa thekey'
        }
      };
      instance.setState({buttonDisabled: false});
    });

    it('stores the SSH key', function() {
      instance._handleAddMoreKeys(instance);
      expect(instance.props.setSSHKeys.callCount).toEqual(1);
      assert.deepEqual(
        instance.props.setSSHKeys.args[0][0],
        [{
          body: 'thekey',
          text: 'ssh-rsa thekey',
          type: 'ssh-rsa',
          id: 0
        }]);
    });

    it('shows a table if keys present', () => {
      instance._handleAddMoreKeys(instance);
      wrapper.update();
      const expected = (
        <div className="deployment-ssh-key__added-keys">
          <ul className="deployment-machines__list clearfix">
            <li className="deployment-flow__row-header twelve-col">
              <div className="two-col">Type</div>
              <div className="ten-col last-col">Key</div>
            </li>
            <li className="deployment-flow__row twelve-col">
              <div className="two-col">ssh-rsa</div>
              <div className="nine-col added-keys__key-value" title="thekey">
                thekey
              </div>
              <div className="one-col last-col">
                <span className="added-keys__key-remove right"
                  onClick={instance._removeKey.bind(instance)}
                  role="button"
                  title="Remove key">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
      assert.compareJSX(wrapper.find('.deployment-ssh-key__added-keys'), expected);
    });
  });

  it('can disable and enable the add', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    let expected = (
      <div className="deployment-ssh-key__add-key right">
        <GenericButton
          action={wrapper.find('GenericButton').prop('action')}
          disabled={true}
          type="positive">
          Add keys
        </GenericButton>
      </div>
    );
    assert.compareJSX(wrapper.find('.deployment-ssh-key__add-key'), expected);
    instance.setState({
      buttonDisabled: false
    });
    wrapper.update();
    expected = (
      <div className="deployment-ssh-key__add-key right">
        <GenericButton
          action={wrapper.find('GenericButton').prop('action')}
          disabled={false}
          type="positive">
          Add keys
        </GenericButton>
      </div>
    );
    assert.compareJSX(wrapper.find('.deployment-ssh-key__add-key'), expected);
  });

});
