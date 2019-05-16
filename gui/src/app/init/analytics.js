/* Copyright (C) 2019 Canonical Ltd. */
'use strict';



class Analytics {
  constructor(data) {
    if (data) {
      this.categories = data.categories || [];
      this.getLabel = data.getLabel;
      this.label = data.label;
      // Common events.
      this.CANCEL = 'Cancel';
      this.CLICK = 'Click';
      this.UPDATE = 'Update';
      this.VIEW = 'View';
    }
  }

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
    return new Analytics({
      categories: this.categories.concat([name]),
      getLabel: this.getLabel,
      label: this.label
    });
  }

  sendEvent(action, options={}) {
    if (!action) {
      console.error('Analytics action not provided');
      return;
    }
    let label = this.label;
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
    console.log('send event', event);
    // DISABLED FOR TESTING.
    // dataLayer.push(event);
  }
}

module.exports = {
  Analytics
};
