/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const ComponentRenderersMixin = (superclass) => class extends superclass {
  _clearRoot() {}
  _renderUserProfile() {}
  _clearUserProfile() {}
  _clearUserEntity() {}
  _renderCharmbrowser() {}
  _clearCharmbrowser() {}
  _renderAccount() {}
  _clearAccount() {}
  _clearAllGUIComponents() {}
  _renderMachineView() {}
  _clearMachineView() {}
  _renderInspector() {}
  _renderDeployment() {}
  _clearDeployment() {}
  _renderDeploymentBar() {}
};

module.exports = ComponentRenderersMixin;
