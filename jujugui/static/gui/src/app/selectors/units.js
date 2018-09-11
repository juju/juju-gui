/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const selectors = {
  listForApplication: (units, application) =>
    selectors.listUnits(units).filter(unit => unit.application === application),
  listUnits: units => Object.keys(units).map(key => units[key])
};

module.exports = selectors;
