/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


describe.only('notifier widget', function() {
  var Notifier, notifierBox, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['notifier',
      'juju-tests-utils',
      'node-event-simulate'], function(Y) {
      Notifier = Y.namespace('juju.widgets').Notifier;
      done();
    });
  });

  // Create the notifier box and attach it as first element of the body.
  beforeEach(function() {
    notifierBox = Y.namespace('juju-tests.utils').makeContainer(this);
    notifierBox.addClass('notifier-box');
  });

  // Factory rendering and returning a notifier instance.
  var makeNotifier = function(title, message, timeout) {
    var notifier = new Notifier({
      title: title || 'mytitle',
      message: message || 'mymessage',
      timeout: timeout || 10000
    });
    notifier.render(notifierBox);
    return notifier;
  };

  // Assert the notifier box contains the expectedNumber of notifiers.
  var assertNumNotifiers = function(expectedNumber) {
    assert.equal(expectedNumber, notifierBox.get('children').size());
  };

  it('should be able to display a notification', function() {
    makeNotifier();
    assertNumNotifiers(1);
  });

  it('should display the given title and message', function() {
    makeNotifier('mytitle', 'mymessage');
    var notifierNode = notifierBox.one('*');
    assert.equal('mytitle', notifierNode.one('div:first-child').getContent());
    assert.equal('mymessage', notifierNode.one('div:last-child').getContent());
  });

  it('should be able to display multiple notifications', function() {
    var number = 5;
    for (var i = 0; i < number; i += 1) {
      makeNotifier();
    }
    assertNumNotifiers(number);
  });

  it('should display new notifications on top', function() {
    makeNotifier('mytitle1', 'mymessage1');
    makeNotifier('mytitle2', 'mymessage2');
    var notifierNode = notifierBox.one('*');
    assert.equal('mytitle2', notifierNode.one('div:first-child').getContent());
    assert.equal('mymessage2', notifierNode.one('div:last-child').getContent());
  });

  it('should destroy notifications after N milliseconds', function(done) {
    makeNotifier('mytitle', 'mymessage', 1);
    // A timeout is used so that we ensure the destroying animation can be
    // completed.
    setTimeout(function() {
      assertNumNotifiers(0);
      done();
    }, 500);
  });

  it('should destroy notifications on click', function(done) {
    makeNotifier();
    notifierBox.one('*').simulate('click');
    // A timeout is used so that we ensure the destroying animation can be
    // completed.
    setTimeout(function() {
      assertNumNotifiers(0);
      done();
    }, 500);
  });

  it('should prevent notification removal on mouse enter', function(done) {
    makeNotifier('mytitle', 'mymessage', 1);
    notifierBox.one('*').simulate('mouseover');
    // A timeout is used so that we ensure the destroying animation can be
    // completed.
    setTimeout(function() {
      assertNumNotifiers(1);
      done();
    }, 500);
  });

});

