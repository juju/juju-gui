/* Copyright (C) 2019 Canonical Ltd. */
'use strict';

module.exports = {
  addCategory: sinon.stub().returns({
    addCategory: sinon.stub().returns({
      sendEvent: sinon.stub()
    }),
    sendEvent: sinon.stub()
  }),
  sendEvent: sinon.stub()
};
