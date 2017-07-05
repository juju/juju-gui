/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('GitHub SSH key fetching', () => {
  let sendGetRequest, callback;

  beforeEach(() => {
    sendGetRequest = sinon.stub();
    callback = sinon.stub();
  });

  it('fetches github SSH keys', () => {
    window.jujugui.sshKeys.githubSSHKeys(
      {sendGetRequest: sendGetRequest},
      'rose',
      callback);
    const args = sendGetRequest.args[0];
    // Make sure the correct URL was called.
    assert.equal(args[0],
      'https://api.github.com/users/rose/keys');
    // Ensure a wrapped callback was provided.
    assert.equal(typeof args[6], 'function');
    // Call the wrapped callback with stubbed data.
    args[6]({
      currentTarget: {
        status: 200,
        response: JSON.stringify([
          {
            id: 123,
            key: 'ssh-rsa abc'
          }, {
            id: 234,
            key: 'ssh-dsa 345'
          }
        ])
      }
    });
    // Ensure the result was parsed.
    assert.deepEqual(callback.args[0], [null, [
      {
        id: 123,
        type: 'ssh-rsa',
        body: 'abc',
        text: 'ssh-rsa abc'
      }, {
        id: 234,
        type: 'ssh-dsa',
        body: '345',
        text: 'ssh-dsa 345'
      }
    ]]);
  });

  it('surfaces errors', () => {
    window.jujugui.sshKeys.githubSSHKeys(
      {sendGetRequest: sendGetRequest},
      'bad-wolf',
      callback);
    const args = sendGetRequest.args[0];
    // Ensure our URL is the bad one
    assert.equal(args[0],
      'https://api.github.com/users/bad-wolf/keys');
    assert.equal(typeof args[6], 'function');
    // Call the wrapped callback with errors.
    args[6]({
      currentTarget: {
        status: 404,
        response: '{"message": "Not Found"}'
      }
    });
    // Ensure the callback receives the errors.
    assert.deepEqual(callback.args[0], ['Not Found', {
      message: 'Not Found'
    }]);
  });
});
