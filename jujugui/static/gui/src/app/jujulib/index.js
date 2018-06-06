// Copyright (C) 2016 Canonical Ltd.
'use strict';

const bakery = require('./bakery');
const bundleservice = require('./bundleservice');
const charmstore = require('./charmstore');
const identity = require('./identity');
const payment = require('./payment');
const plans = require('./plans');
const rates = require('./rates');
const ReconnectingWebSocket = require('./reconnecting-websocket');
const stripe = require('./stripe');
const terms = require('./terms');
const urls = require('./urls');

/**
  jujulib provides API access for services used by juju.

  jujulib provies access to the APIs for the following services:
  - the Juju Intelligent Model Manager (JIMM);.
  - the Juju charm store.
  - the Juju identity manager (Candid).
  - the Romulus rates service.
  - the Romulus plans service.
  - the Romulus terms service.
  - the payment service.
  - the Stripe service.
*/

/**
  Define the jujulib object, returned by this library and populated by
  submodules.
*/
module.exports = {
  Bakery: bakery.Bakery,
  BakeryStorage: bakery.BakeryStorage,
  BUNDLE_SERIES: urls.BUNDLE_SERIES,
  bundleservice,
  CHARM_SERIES: urls.CHARM_SERIES,
  charmstore: charmstore.charmstore,
  charmstoreAPIVersion: charmstore.charmstoreAPIVersion,
  identity,
  isValidName: urls.isValidName,
  isValidUser: urls.isValidUser,
  payment: payment.payment,
  paymentAPIVersion: payment.paymentAPIVersion,
  plans: plans.plans,
  plansAPIVersion: plans.plansAPIVersion,
  rates: rates.rates,
  ratesAPIVersion: rates.ratesAPIVersion,
  ReconnectingWebSocket,
  SERIES: urls.SERIES,
  stripe,
  terms: terms.terms,
  termsAPIVersion: terms.termsAPIVersion,
  URL: urls.URL
};
