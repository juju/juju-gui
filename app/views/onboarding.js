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

/**
 * Provide the OnboardingView class.
 *
 * @module onboarding
 * @submodule views.onboarding
 */

YUI.add('juju-view-onboarding', function(Y) {

  var views = Y.namespace('juju.views');

  /**
   * The OnboardingView class.
   *
   * @class OnboardingView
   */
  views.OnboardingView = Y.Base.create('OnboardingView', Y.View, [], {
    template: views.Templates.onboarding,
    events: {
      '.onboarding-close': {
        click: 'closeHandler'
      },
      '.onboarding-start': {
        click: 'nextHandler'
      },
      '.onboarding-next': {
        click: 'nextHandler'
      },
      '.onboarding-prev': {
        click: 'prevHandler'
      },
      '.onboarding-cross': {
        mousedown: 'crossHandler',
        mouseout: 'crossHandler',
        mouseover: 'crossHandler',
        mouseup: 'closeHandler'
      }
    },
    onboardingIndex: 0,
    states: ['state-0', 'state-1', 'state-2', 'state-3'],

    /**
     * Onboarding event handler. When clicking the close button,
     * remove the onboarding and put the user back into the environment,
     *
     * @method closeHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    closeHandler: function(ev) {
      ev.halt();
      var container = this.get('container');
      container.hide();
      Y.one('#environment-help').removeClass('hidden');
      localStorage.setItem('force-onboarding', '');
    },

    /**
     * Show the container and hide the enviroment help.
     *
     * @method open
     * @return {undefined} Mutates only.
     */
    open: function() {
      this.onboardingIndex = 0;
      this.drawContent();
      this.onboarding.show();
      Y.one('#environment-help').addClass('hidden');
    },

    /**
     * Onboarding event handler. When clicking the next button,
     * update the index counter, and update to the next step of onboarding.
     *
     * @method nextHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    nextHandler: function(ev) {
      ev.halt();
      this.incrementIndex();
      this.drawContent();
    },

    /**
     * Onboarding event handler. When clicking the prev button,
     * update the index counter, and update to the prev step of onboarding.
     *
     * @method prevHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    prevHandler: function(ev) {
      ev.halt();
      this.decrementIndex();
      this.drawContent();
    },

    /**
     * Onboarding event handler. When hover and click the close cross.
     *
     * @method crossHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    crossHandler: function(ev) {
      var container = this.get('container');
      var close_button = container.one('.onboarding-cross');
      switch (ev._event.type) {
        case 'mouseover':
          close_button.replaceClass('close-inspector-normal',
              'close-inspector-hover');
          break;
        case 'mouseout':
          close_button.replaceClass('close-inspector-hover',
              'close-inspector-normal');
          break;
        case 'mousedown':
          close_button.replaceClass('close-inspector-hover',
              'close-inspector-click');
          break;
      }
    },

    /**
     * @method destructor
     * @return {undefined} Mutates only.
     */
    destructor: function() {
      var container = this.get('container');
      if (container) {
        container.empty();
      }
    },

    /**
     * @method drawContent
     * @return {undefined} Mutates only.
     */
    drawContent: function() {
      var container = this.get('container');
      var container_bg = container.one('#onboarding-background');

      this.states.forEach(function(state, idx) {
        container_bg.removeClass(state);
      });
      container_bg.addClass(this.states[this.onboardingIndex]);
    },

    /**
     * @method incrementIndex
     * @return {undefined} Mutates only.
     */
    incrementIndex: function() {
      this.onboardingIndex = Math.min(
          this.onboardingIndex + 1, this.states.length - 1);
    },

    /**
     * @method decrementIndex
     * @return {undefined} Mutates only.
     */
    decrementIndex: function() {
      this.onboardingIndex = Math.max(this.onboardingIndex - 1, 0);

    },

    /**
      Sets the onboarding index back to 0, and the localstorage onboarding
      flag to undefined.

      @method reset
    */
    reset: function() {
      this.onboardingIndex = 0;
      localStorage.setItem('onboarding', '');
      this.get('container').empty();
    },

    /**
     * Render the page.
     *
     * Reveal the mask element, and show the onboarding window.
     *
     * @method render
     * @return {undefined} Mutates only.
     */
    render: function() {
      // In order to have the mask cover everything, it needs to be an
      // immediate child of the body.  In order for it to render immediately
      // when the app loads, it needs to be in index.html.
      this.onboarding = Y.one('body > #onboarding');
      if (!this.onboarding) {
        // No mask in the DOM, as is the case in tests.
        return this;
      }

      this.get('container').setHTML(this.template());
      this.open();
      localStorage.setItem('onboarding', 'exists');

      return this;
    }

  }, {
    ATTRS: {
      /**
         @attribute seen
         @default undefined
         @type {Function}
       */
      seen: {
        /**
         The "getter" function returns if onboarding localStorage
         value set.

         @attribute getter
         @default undefined
         @type {Function}
       */
        getter: function() {
          return localStorage.getItem('onboarding');
        }
      }
    }
  });


}, '0.1.0', {
  requires: [
    'juju-templates',
    'juju-view-utils',
    'node',
    'view'
  ]
});
