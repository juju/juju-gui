/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentSSHKey = require('./sshkey');
const InsetSelect = require('../../inset-select/inset-select');
const SvgIcon = require('../../svg-icon/svg-icon');
const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');
const Notification = require('../../notification/notification');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentSSHKey', function() {
  let addNotification;
  let setSSHKeys;
  let setLaunchpadUsernames;
  let getGithubSSHKeys;

  beforeEach(() => {
    addNotification = sinon.stub();
    setSSHKeys = sinon.stub();
    setLaunchpadUsernames = sinon.stub();
    getGithubSSHKeys = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = (cloudType, _getGithubSSHKeys, username) => {
    let cloud = null;
    if (cloudType) {
      cloud = {cloudType: cloudType};
    }
    const renderer = jsTestUtils.shallowRender(
      <DeploymentSSHKey
        WebHandler={sinon.stub()}
        addNotification={addNotification}
        cloud={cloud}
        getGithubSSHKeys={_getGithubSSHKeys || getGithubSSHKeys}
        setSSHKeys={setSSHKeys}
        setLaunchpadUsernames={setLaunchpadUsernames}
        username={username}
      />, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput(),
      renderer: renderer
    };
  };

  it('does not render without a cloud', function() {
    const comp = render(null);
    assert.strictEqual(comp.output, null);
  });

  it('renders with a cloud', function() {
    const comp = render('aws');
    const expectedOutput = (
      <div className="deployment-ssh-key">
        <p>
          Keys will allow you SSH access to the machines
          provisioned by Juju for this model.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <InsetSelect
              disabled={false}
              ref="sshSource"
              label="Source"
              onChange={comp.instance._handleSourceChange.bind(comp.instance)}
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
              ]} />
          </div>
          <div className="three-col last-col no-margin-bottom">
            <GenericInput
              ref="githubUsername"
              autocomplete
              key="githubUsername"
              label="GitHub username"
              onKeyUp={comp.instance._onKeyUp.
                bind(comp.instance)}
              type="text" />
          </div>
          <div className="right">
            <GenericButton
              action={comp.instance._handleAddMoreKeys.bind(comp.instance)}
              disabled
              type="positive">Add Keys</GenericButton>
          </div>
        </div>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('prefills Launchpad username if available', () => {
    const comp = render('aws', null, 'rose');
    comp.instance.refs = {
      launchpadUsername: {getValue: () => 'rose'},
      sshSource: {getValue: () => 'launchpad'}
    };
    comp.instance._handleSourceChange();
    comp.instance._updateButtonState();
    const expectedOutput = (
      <div className="deployment-ssh-key">
        <p>
          Keys will allow you SSH access to the machines
          provisioned by Juju for this model.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <InsetSelect
              disabled={false}
              ref="sshSource"
              label="Source"
              onChange={comp.instance._handleSourceChange.bind(comp.instance)}
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
              ]} />
          </div>
          <div className="three-col last-col no-margin-bottom">
            <GenericInput
              ref="launchpadUsername"
              autocomplete
              key="launchpadUsername"
              label="Launchpad username"
              onKeyUp={comp.instance._onKeyUp.
                bind(comp.instance)}
              value="rose"
              type="text" />
          </div>
          <div className="right">
            <GenericButton
              action={comp.instance._handleAddMoreKeys.bind(comp.instance)}
              type="positive">Add Keys</GenericButton>
          </div>
        </div>
      </div>
    );
    expect(comp.renderer.getRenderOutput()).toEqualJSX(expectedOutput);
  });

  it('renders with azure', function() {
    const comp = render('azure');
    const expectedOutput = (
      <div className="deployment-ssh-key">
        <p>
          Keys will allow you SSH access to the machines provisioned on Azure.
        </p>
        {false}
        {false}
        <div className="twelve-col no-margin-bottom">
          <div className="three-col no-margin-bottom">
            <InsetSelect
              ref="sshSource"
              label="Source"
              onChange={comp.instance._handleSourceChange.bind(comp.instance)}
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
              ]} />
          </div>
          <div className="three-col last-col no-margin-bottom">
            <GenericInput
              ref="githubUsername"
              autocomplete
              label="GitHub username"
              onKeyUp={comp.instance._onKeyUp.
                bind(comp.instance)}
              type="text" />
          </div>
          <div className="right">
            <GenericButton
              action={comp.instance._handleAddMoreKeys.bind(comp.instance)}
              disabled
              type="positive">Add Keys</GenericButton>
          </div>
        </div>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  describe('github', () => {
    it('handles errors when getting keys', () => {
      const comp = render('aws');
      comp.instance._addGithubKeysCallback('Uh oh!', null);
      comp.renderer.getRenderOutput();
      assert.equal(addNotification.callCount, 1);
      assert.deepEqual(addNotification.args[0][0], {
        title: 'could not get SSH keys',
        message: 'could not get SSH keys: Uh oh!',
        level: 'error'
      });
    });

    it('shows an error if no keys found', () => {
      const comp = render('aws');
      comp.instance._addGithubKeysCallback(null, []);
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[2]).toEqualJSX(
        <Notification
          content={<span><b>Error:</b>
            <span>No keys found.
              <a className="link" href="https://github.com/settings/keys"
                target="_blank">Create an SSH Key</a>.
            </span>
          </span>}
          type="negative" />);
    });

    it('shows an error if user not found', () => {
      const comp = render('aws');
      comp.instance._addGithubKeysCallback('Not Found', {
        message: 'Not Found'
      });
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[2]).toEqualJSX(
        <Notification
          content={(<span><b>Error:</b> Not Found</span>)}
          type="negative" />);
    });

    it ('creates a table if keys present', () => {
      const comp = render('aws');
      comp.instance.refs = {
        githubUsername: {
          getValue: sinon.stub(),
          focus: sinon.stub(),
          setValue: sinon.stub()
        }
      };
      comp.instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'}
      ]);
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[1]).toEqualJSX(
        <div>
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
                  onClick={comp.instance._removeKey.bind(comp.instance)}
                  role="button"
                  title="Remove key">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
    });

    it('stores the SSH keys', function() {
      const comp = render('gce');
      comp.instance.refs = {
        githubUsername: {
          getValue: sinon.stub(),
          focus: sinon.stub(),
          setValue: sinon.stub()
        }
      };
      comp.instance._addGithubKeysCallback(null, [
        {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'},
        {id: 2, type: 'ssh-rsa', body: 'thekey2', text: 'ssh-rsa thekey2'}
      ]);
      expect(comp.instance.props.setSSHKeys.callCount).toEqual(1);
      expect(comp.instance.props.setSSHKeys.args[0][0]).
        toEqual([
          {id: 1, type: 'ssh-rsa', body: 'thekey', text: 'ssh-rsa thekey'},
          {id: 2, type: 'ssh-rsa', body: 'thekey2', text: 'ssh-rsa thekey2'}
        ]);
    });
  });

  it('changes source and disables the button', function() {
    const comp = render('aws');
    comp.instance.refs = {sshSource: {getValue: () => 'manual'}};
    comp.instance._handleSourceChange();
    expect(comp.instance.state.addSource).toEqual('manual');
    expect(comp.instance.state.buttonDisabled).toEqual(true);
  });

  describe('launchpad', () => {
    let comp;
    beforeEach(() => {
      comp = render('gce');
      comp.instance.refs = {
        sshSource: {getValue: () => 'launchpad'},
        launchpadUsername: {
          setValue: () => sinon.stub(),
          focus: () => sinon.stub(),
          getValue: () => 'rose'
        }
      };
      comp.instance.setState({buttonDisabled: false});
    });

    it('stores the Launchpad username', () => {
      comp.instance._handleAddMoreKeys.call(comp.instance);
      expect(comp.instance.props.setLaunchpadUsernames.callCount).toEqual(1);
      assert.deepEqual(
        comp.instance.props.setLaunchpadUsernames.args[0][0],
        ['rose']);
    });

    it('shows a table if usernames are present', () => {
      comp.instance._handleAddMoreKeys.call(comp.instance);
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[1]).toEqualJSX(
        <div>
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
                  onClick={comp.instance._removeLPUsername.bind(comp.instance)}
                  role="button"
                  title="Remove username">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
    });

    it('shows a table for usernames and keys', () => {
      comp.instance.setState({SSHkeys: [{
        body: 'thekey',
        text: 'ssh-rsa thekey',
        type: 'ssh-rsa',
        id: 0
      }]});
      comp.instance._handleAddMoreKeys.call(comp.instance);
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[1]).toEqualJSX(
        <div>
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
                  onClick={comp.instance._removeKey.bind(comp.instance)}
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
                  onClick={comp.instance._removeLPUsername.bind(comp.instance)}
                  role="button"
                  title="Remove username">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
    });
  });

  describe('manual', () => {
    let comp;
    beforeEach(() => {
      comp = render('gce');
      comp.instance.refs = {
        sshSource: {getValue: () => 'manual'},
        sshKey: {
          setValue: () => sinon.stub(),
          focus: () => sinon.stub(),
          getValue: () => 'ssh-rsa thekey'
        }
      };
      comp.instance.setState({buttonDisabled: false});
    });

    it('stores the SSH key', function() {
      comp.instance._handleAddMoreKeys.call(comp.instance);
      expect(comp.instance.props.setSSHKeys.callCount).toEqual(1);
      assert.deepEqual(
        comp.instance.props.setSSHKeys.args[0][0],
        [{
          body: 'thekey',
          text: 'ssh-rsa thekey',
          type: 'ssh-rsa',
          id: 0
        }]);
    });

    it ('shows a table if keys present', () => {
      comp.instance._handleAddMoreKeys.call(comp.instance);
      const output = comp.renderer.getRenderOutput();
      expect(output.props.children[1]).toEqualJSX(
        <div>
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
                  onClick={comp.instance._removeKey.bind(comp.instance)}
                  role="button"
                  title="Remove key">
                  <SvgIcon name="close_16" size="16" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      );
    });
  });

});
