/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('Sharing', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('sharing', () => { done(); });
  });

  it('can render with no users', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, []);
    const closeHandler = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        closeHandler={closeHandler}
        getModelUserInfo={getModelUserInfo} />, true);
    const output = renderer.getRenderOutput();
    const expectedButtons = [{
      title: 'Done',
      action: closeHandler,
      type: 'positive'
    }];
    const expected = (
      <juju.components.Popup
        className="sharing__popup"
        title="Share"
        buttons={expectedButtons}>
        <h5 className="sharing__users-header">Users with access</h5>
        <div className="sharing__users">
          {undefined}
        </div>
      </juju.components.Popup>
    );
    assert.deepEqual(output, expected);
  });

  it('can render with a spinner', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, []);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        getModelUserInfo={getModelUserInfo} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({loadingUsers: true});
    const output = renderer.getRenderOutput();
    const spinner = output.props.children[1].props.children;
    const expected = (
      <div className="sharing__loading">
        <juju.components.Spinner />
      </div>
    );
    assert.deepEqual(spinner, expected);
  });

  it('can render with users', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, [
      {
        name: 'drwho@external',
        displayName: 'drwho',
        domain: 'Ubuntu SSO',
        lastConnection: {
          toUTCString: sinon.stub().withArgs().returns(
            'Thu, 09 Feb 2017 09:51:18 GMT')
        },
        access: 'admin'
      }, {
        name: 'rose',
        displayName: 'Rose',
        domain: 'local',
        lastConnection: null,
        access: 'write',
      }, {
        name: 'dalek',
        displayName: 'Dalek',
        lastConnection: null,
        access: 'write',
        err: 'exterminate!'
      }
    ]);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        getModelUserInfo={getModelUserInfo} />, true);
    const output = renderer.getRenderOutput();
    // Get all the children except the header, which is the first item in the
    // array.
    const obtained = output.props.children[1].props.children;
    const expected = [(
      <div key="drwho@external" className="sharing__user">
        <div className="sharing__user-name">
          drwho
        </div>
        <div className="sharing__user-displayname">
          {'Ubuntu SSO'} user
        </div>
        <div className="sharing__user-displayname">
          last connection:  09 Feb 2017 09:51:18 GMT
        </div>
        <div className="sharing__user-access">
          admin
        </div>
      </div>
    ), (
      <div key="rose" className="sharing__user">
        <div className="sharing__user-name">
          Rose
        </div>
        <div className="sharing__user-displayname">
          {'local'} user
        </div>
        <div className="sharing__user-displayname">
          never connected
        </div>
        <div className="sharing__user-access">
          write
        </div>
      </div>
    ), (
      <div key="dalek" className="sharing__user">
        <div className="sharing__user-name">
          Dalek
        </div>
        <div className="sharing__user-displayname">
          exterminate!
        </div>
      </div>
    )];
    assert.deepEqual(obtained, expected);
  });

  it('can handle an API call error', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, 'boom', []);
    const addNotification = sinon.stub();
    const closeHandler = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={addNotification}
        closeHandler={closeHandler}
        getModelUserInfo={getModelUserInfo} />);
    assert.equal(addNotification.called, true);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to load users.',
      message: 'Unable to load user information for this model: boom',
      level: 'error'
    });
    assert.equal(closeHandler.called, true);
  });

});
