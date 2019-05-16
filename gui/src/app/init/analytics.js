/* Copyright (C) 2019 Canonical Ltd. */
'use strict';



class Analytics {
  constructor(data) {
    if (data) {
      this.category = data.category;
      this.label = data.label;
      this.getLabel = data.getLabel;
    }
  }

  addComponent(component) {
    let categories = this.category ? [this.category] : [];
    categories.push(component._reactInternalFiber.elementType.name);
    // Return a new analytics instance with the new data. This is so that we
    // don't overwrite a top level instance with every fork as the analytics is
    // passed into nested components.
    return new Analytics({
      category: categories.join(' > '),
      getLabel: this.getLabel,
      label: this.label
    });
  }

  sendEvent(action, value) {
    if (!action) {
      console.error('Analytics action not provided');
      return;
    }
    let label = this.label;
    if (this.getLabel) {
      label = this.getLabel();
    }
    const event = {
      'event': 'GAEvent',
      'eventCategory': this.category,
      'eventAction': action,
      'eventLabel': label,
      'eventValue': value
    };
    console.log('send event', event);
    // DISABLED FOR TESTING.
    // dataLayer.push(event);
  }
}

const commonEvents = {
  UPDATE: 'Update',
  CANCEL: 'Cancel',
  VIEW: 'View'
};

module.exports = {
  Analytics,
  commonEvents
};
