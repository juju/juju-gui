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


(function() {

  describe('onboarding process', function() {
    var container, env_help, onboard, OnboardingView, views, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'node-event-simulate',
          'juju-tests-utils',
          'juju-view-onboarding',
          function(Y) {
            utils = Y.namespace('juju-tests.utils');
            views = Y.namespace('juju.views');
            OnboardingView = views.OnboardingView;
            done();
          });
    });

    beforeEach(function() {
      container = utils.makeContainer(this, 'onboarding');
      env_help = utils.makeContainer(this, 'environment-help');
      env_help.addClass('environment-help');
    });

    afterEach(function() {
      if (onboard) {
        onboard.destroy();
      }
    });

    it('should exist in the views namespace', function() {
      assert(views.OnboardingView);
    });

    it('inits values correctly', function() {
      onboard = new OnboardingView();
      assert.equal(onboard.onboardingIndex, 0);
    });

    it('increments screen index correctly', function() {
      onboard = new OnboardingView({
        container: container
      });
      onboard.render();
      onboard.nextHandler({halt: function() {}});
      assert.equal(onboard.onboardingIndex, 1);
      onboard.nextHandler({halt: function() {}});
      assert.equal(onboard.onboardingIndex, 2);
    });

    it('decrements screen index correctly', function() {
      onboard = new OnboardingView({
        container: container
      });

      onboard.render();
      onboard.onboardingIndex = 2;
      onboard.prevHandler({halt: function() {}});
      assert.equal(onboard.onboardingIndex, 1);
      onboard.prevHandler({halt: function() {}});
      assert.equal(onboard.onboardingIndex, 0);
    });

    it('renders correctly on first load', function() {
      onboard = new OnboardingView({
        container: container
      });

      onboard.render();
      var background = container.one('#onboarding-background');
      assert.isTrue(background instanceof Y.Node);
      assert.isTrue(env_help.hasClass('hidden'));
      assert.equal(container.getComputedStyle('display'), 'block');
      assert.isTrue(background.hasClass('state-0'));
      assert.equal(onboard.get('seen'), 'exists');
    });

    it('updates background css properly', function() {
      onboard = new OnboardingView({
        container: container
      });

      onboard.render();
      var background = container.one('#onboarding-background');
      onboard.nextHandler({halt: function() {}});
      assert.isTrue(background.hasClass('state-1'), 'should be state 1');
      onboard.nextHandler({halt: function() {}});
      assert.isTrue(background.hasClass('state-2'), 'should be 2');
      onboard.prevHandler({halt: function() {}});
      assert.isTrue(background.hasClass('state-1'), 'should be 1 again');
      onboard.prevHandler({halt: function() {}});
      assert.isTrue(background.hasClass('state-0'), 'should be 0 again');
      onboard.prevHandler({halt: function() {}});
      assert.isTrue(background.hasClass('state-0'), 'should stick to 0');
    });

    it('displays correct stage of onboarding', function() {
      onboard = new OnboardingView({
        container: container
      });

      onboard.render();

      var panel0 = container.one('.panel-0');
      var panel1 = container.one('.panel-1');
      var panel2 = container.one('.panel-2');
      assert.equal(
          panel0.getComputedStyle('display'), 'block');
      onboard.nextHandler({halt: function() {}});
      assert.equal(
          panel1.getComputedStyle('display'), 'block');
      onboard.nextHandler({halt: function() {}});
      assert.equal(
          panel2.getComputedStyle('display'), 'block');
      onboard.prevHandler({halt: function() {}});
      assert.equal(
          panel1.getComputedStyle('display'), 'block');
      onboard.prevHandler({halt: function() {}});
      assert.equal(
          panel0.getComputedStyle('display'), 'block');
      onboard.prevHandler({halt: function() {}});
      assert.equal(
          panel0.getComputedStyle('display'), 'block');
    });

    it('closes onboarding', function() {
      onboard = new OnboardingView({
        container: container
      });

      onboard.render();
      var onboardingCross = container.one('.onboarding-cross');
      assert.isTrue(onboardingCross instanceof Y.Node);
      onboard.closeHandler({halt: function() {}});
      assert.equal(container.getComputedStyle('display'), 'none');
      assert.isFalse(env_help.hasClass('hidden'));
      assert.equal(localStorage.getItem('force-onboarding'), '');
    });

    it('should not be shown if seen before', function() {
      onboard = new OnboardingView({
        container: container
      });

      localStorage.setItem('onboarding', true);
      onboard.render();
      var background = container.one('#onboarding-background');
      assert.isTrue(background instanceof Y.Node);
    });

    it('sets index to 0, clears out local storage on reset', function() {
      onboard = new OnboardingView({
        container: container
      }).render();
      onboard.nextHandler({halt: function() {}});
      assert.equal(onboard.onboardingIndex, 1);

      localStorage.setItem('onboarding', true);

      onboard.reset();
      assert.equal(onboard.onboardingIndex, 0);
      assert.equal(localStorage.getItem('onboarding'), '');
    });

  });
})();
