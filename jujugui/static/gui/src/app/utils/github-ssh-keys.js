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

if (typeof this.jujugui === 'undefined') {
  this.jujugui = {};
}

// Future-proof if we want to grab SSH keys from anywhere else
// (gitlab, gogs, etc).
if (typeof this.jujugui.sshKeys === 'undefined') {
  this.jujugui.sshKeys = {};
}

/**
  Fetch SSH keys from a user's GitHub account.

  @param username {String} the user whose keys need fetching.
  @param callback {Function} a function expecting an error and the parsed keys.
*/
const githubSSHKeys = (handler, username, callback) => {
  // On load, call the callback with munged data.
  const wrap = (response) => {
    let data = null;
    try {
      data = JSON.parse(response.currentTarget.response);
    } catch(e) {
      callback(`cannot retrieve SSH keys from gihub: invalid response: ${e}`,
        null);
      return;
    }

    // If there's an error, set it to the message from GitHub
    const error = response.currentTarget.status !== 200 ? 
      `cannot retrieve SSH keys from gihub: ${data.message}` : null;

    // If there's no error, pull the key into its respective parts for use by
    // the callback.
    if (error === null) {
      data = data.map((item) => {
        return {
          'id': item.id,
          'type': item.key.split(' ')[0],
          'body': item.key.split(' ')[1],
          'text': item.key
        };
      });
    }
    callback(error, data);
  };

  // See https://developer.github.com/v3/users/keys/
  handler.sendGetRequest(
    `https://api.github.com/users/${username}/keys`,
    null,
    null,
    null,
    false,
    null,
    wrap);

};

this.jujugui.sshKeys.githubSSHKeys = githubSSHKeys;
