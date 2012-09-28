'use strict';

(function() {
  describe('juju-views-utils', function() {
    var views, Y;
    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-view-utils', 'node-event-simulate',
          function(Y) {
            views = Y.namespace('juju.views');
            done();
          });
    });

    it('should create a confirmation panel',
       function() {
          var confirmed = false;
          var panel = views.createModalPanel(
              'Description',
              '#main',
              'Action Label',
              function() {confirmed = true;}
         );
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.one('.btn-danger');
          button.getHTML().should.equal('Action Label');
          button.simulate('click');
          confirmed.should.equal(true);
          panel.destroy();
       });

    it('should hide the panel when the Cancel button is clicked',
       function() {
          var confirmed = false;
          var panel = views.createModalPanel(
              'Description',
              '#main',
              'Action Label',
              function() {confirmed = true;});
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.one('.btn:not(.btn-danger)');
          button.getHTML().should.equal('Cancel');
          button.simulate('click');
          confirmed.should.equal(false);
          panel.destroy();
       });

    it('should allow you to reset the buttons', function() {
          var confirmed = false;
          var panel = views.createModalPanel(
              'Description',
              '#main',
              'First Action Label',
              function() {confirmed = false;});
          panel.get('buttons').footer.length.should.equal(2);
          views.setModalButtons(
            panel, 'Second Action Label', function() { confirmed=true; });
          panel.get('buttons').footer.length.should.equal(2);
          panel.show();
          var panel_node = panel.get('boundingBox'),
              button = panel_node.one('.btn-danger');
          button.getHTML().should.equal('Second Action Label');
          button.simulate('click');
          confirmed.should.equal(true);
          panel.destroy();
    });

  });
}) ();

describe('utilities', function() {
  var Y, views, models, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'], function(Y) {
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju.views.utils');
      done();
    });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = Y.Lang.now();
    // Javascript timestamps are in milliseconds
    views.humanizeTimestamp(now).should.equal('less than a minute ago');
    views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');
  });

  it('shows a relation from the perspective of a service', function() {
    var db = new models.Database(),
        service = new models.Service({
          id: 'mysql',
          charm: 'cs:mysql',
          unit_count: 1,
          loaded: true});
    db.relations.add({
      'interface': 'mysql',
      scope: 'global',
      endpoints: [
        ['mysql', {role: 'server', name: 'mydb'}],
        ['mediawiki', {role: 'client', name: 'db'}]],
      'id': 'relation-0000000002'
    });
    db.services.add([service]);
    var res = utils.getRelationDataForService(db, service);
    res.length.should.equal(1);
    res = res[0];
    res['interface'].should.eql('mysql');
    res.scope.should.equal('global');
    res.id.should.equal('relation-0000000002');
    res.ident.should.equal('mydb:2');
    res.near.service.should.equal('mysql');
    res.near.role.should.equal('server');
    res.near.name.should.equal('mydb');
    res.far.service.should.equal('mediawiki');
    res.far.role.should.equal('client');
    res.far.name.should.equal('db');
  });

});
