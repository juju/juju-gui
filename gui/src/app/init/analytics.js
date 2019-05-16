/* Copyright (C) 2019 Canonical Ltd. */
'use strict';

class Analytics {
  /**
    Set up the analytics instance.
    @param {String} dataLayer - The Google Tag Manager dataLayer instance.
    @param {Object} data - Optional parameters:
      - categories: an array of categories;
      - getLabel: a function that will be used to generate the label string.
  */
  constructor(dataLayer, data={}) {
    this.dataLayer = dataLayer;
    this.categories = data.categories || [];
    this.getLabel = data.getLabel;
    // Common events.
    this.CANCEL = 'Cancel';
    this.CLICK = 'Click';
    this.UPDATE = 'Update';
    this.VIEW = 'View';
  }

  /**
    Append a category. This will be displayed in the analytics as
    something like: Charmbrowser > Search Results > Filter
    @param {Object|String} categoryOrComponent - A category name or React
      component.
    @returns {Object} A new Analytics instance including the old and new data.
  */
  addCategory(categoryOrComponent) {
    let name;
    if (typeof categoryOrComponent === 'string') {
      name = categoryOrComponent;
    } else {
      // Let's just be helpful for React components so that we don't have to
      // specify the name each time.
      name = categoryOrComponent._reactInternalFiber.elementType.name;
    }
    // Return a new Analytics instance with the new data. This is so that we
    // don't overwrite a top level instance with every fork as the analytics is
    // passed into nested components.
    return new Analytics(this.dataLayer, {
      categories: this.categories.concat([name]),
      getLabel: this.getLabel
    });
  }

  /**
    Send an analytics event.
    @param {String} action - An action e.g. Click or Delete.
    @param {Object} options - Optional parameters:
      - value: as an int;
      - label: a string that will be appended to the existing label.
  */
  sendEvent(action, options={}) {
    // It's possible the analytics tracking code isn't available.
    if (!this.dataLayer) {
      return;
    }
    if (!action) {
      console.error('Analytics action not provided');
      return;
    }
    let label;
    if (this.getLabel) {
      label = this.getLabel();
    }
    if (options.label) {
      if (label) {
        label = `${label}, ${options.label}`;
      } else {
        label = options.label;
      }
    }
    const event = {
      'event': 'GAEvent',
      'eventCategory': this.categories.join(' > '),
      'eventAction': action,
      'eventLabel': label,
      'eventValue': options.value
    };
    this.dataLayer.push(event);
  }
}

module.exports = {
  Analytics
};
