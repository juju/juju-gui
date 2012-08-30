/*
 * Generated code -- lib/views/templates.handlebars
*/
YUI.add('juju-templates', function (Y) {

    var Templates = Y.namespace('juju.views').Templates = {};

  
    Templates['unit'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <li class=\"span3\">\n          <div class=\"thumbnail well\" id=\"";
  foundHelper = helpers.id;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n        <h5>";
  foundHelper = helpers.id;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h5>\n        <span>";
  foundHelper = helpers.agent_state;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.agent_state; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span> <br/>\n        <span>";
  foundHelper = helpers.public_address;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.public_address; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n          </div>\n        </li>\n        ";
  return buffer;}

  buffer += " <div class=\"row\">\n    <div class=\"span8\">\n      <h1><a href=\"/service/";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/\"> Service ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h1>\n      <br/> <br/>\n    <div class=\"btn-group\">\n      <a href=\".\" class=\"btn\"><i class=\"icon-th\"></i> Units </a>\n      <a href=\"config\" class=\"btn\"><i class=\"icon-cog\"></i> Settings </a>\n      <a href=\"constraints\" class=\"btn\"><i class=\"icon-leaf\"></i> Constraints</a>\n      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\"\n         class=\"btn\"><i class=\"icon-book\"></i> Charm </a>\n      <button class=\"btn\"><i class=\"icon-ban-circle\"></i> Exposed </button>\n      <a href=\"relations\" class=\"btn\"><i class=\"icon-random\"></i> Relations </a>\n    </div>\n    </div>\n    <div class=\"span4\">\n      <div class=\"well\">\n        <span>\n          <b>Charm:</b>\n          <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></span>\n        <br/>\n        <span> <b>Units:</b></span>\n        <br/>\n        <span> <b>Relations:</b></span>\n        <br/>\n        <span><b>Exposed:</b> ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.exposed;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span>\n        <br/>\n      </div>\n    </div>\n </div>\n\n <div class=\"row\">\n    <div class=\"span12\">\n      <ul class=\"nav nav-tabs\">\n        <li class=\"active\"><a href=\".\">All</a></li>\n        <li><a href=\"?state=running\">Running</a></li>\n        <li><a href=\"?state=pending\">Pending</a></li>\n        <li><a href=\"?state=error\">Error</a></li>\n      </ul>\n    </div>\n </div>\n\n\n <div class=\"collection\">\n    <div class=\"charm\">\n      <ul class=\"thumbnails\">\n        ";
  foundHelper = helpers.units;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.units; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.units) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "      \n      </ul>\n    </div>\n </div>\n\n";
  return buffer;});
  
    Templates['service-constraints'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n        <div class=\"control-group\">\n          <div class=\"control-label\" for=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</div>\n          <div class=\"controls\">\n             <input type=\"text\" id=\"input-";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" value=\"";
  foundHelper = helpers.value;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"/>\n          </div>          \n        </div>\n      ";
  return buffer;}

  buffer += "<div class=\"row\">\n  <div class=\"span8\">\n    <h1><a href=\"/service/";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/\"> Service ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h1>\n    <br/> <br/>\n    <div class=\"btn-group\">\n      <a href=\".\" class=\"btn\"><i class=\"icon-th\"></i> Units </a>\n      <a href=\"config\" class=\"btn\"><i class=\"icon-cog\"></i> Settings </a>\n      <a href=\"constraints\" class=\"btn\"><i class=\"icon-leaf\"></i> Constraints</a>\n      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\"\n         class=\"btn\"><i class=\"icon-book\"></i> Charm </a>\n      <button class=\"btn\"><i class=\"icon-ban-circle\"></i> Exposed </button>\n      <a href=\"relations\" class=\"btn\"><i class=\"icon-random\"></i> Relations </a>\n    </div>\n  </div>\n    <div class=\"span4\">\n      <div class=\"well\">\n        <span>\n          <b>Charm:</b>\n          <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></span>\n        <br/>\n        <span> <b>Units:</b></span>\n        <br/>\n        <span> <b>Relations:</b></span>\n        <br/>\n        <span><b>Exposed:</b> ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.exposed;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span>\n        <br/>\n      </div>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"span12\">\n    <form class=\"form-horizontal\">\n      <legend>";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " constraints</legend>\n\n      ";
  foundHelper = helpers.constraints;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.constraints; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.constraints) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        <div class=\"control-group\">\n          <div class=\"controls\">\n            <button type=\"submit\" cls=\"btn\">Update</button>\n          </div>\n        </div>\n\n      </form> \n</div>\n\n</div>";
  return buffer;});
  
    Templates['charm'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n		  ";
  foundHelper = helpers.created;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.created; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " <br/> ";
  foundHelper = helpers.committer;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.committer; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " <br/> ";
  foundHelper = helpers.message;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.message; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n		  ";
  return buffer;}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	     <li>";
  foundHelper = helpers['interface'];
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0['interface']; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</li>\n	  ";
  return buffer;}

function program5(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	     <li>";
  foundHelper = helpers['interface'];
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0['interface']; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</li>\n	  ";
  return buffer;}

  buffer += "<h1> Charm </h1>\n      <div class=\"row\">\n	<div class=\"span8\">\n	  <form class=\"form-horizontal\">\n	    <fieldset>\n	      <div class=\"control-group\">\n		<label class=\"control-label\">Name</label>\n		<div class=\"controls\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</div>\n	      </div>\n	      <div class=\"control-group\">\n		<label class=\"control-label\">Series</label>\n		<div class=\"controls\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.series;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</div>\n	      </div>\n	      <div class=\"control-group\">\n		<label class=\"control-label\">Summary</label>\n		<div class=\"controls\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.summary;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</div>\n	      </div>\n	      <div class=\"control-group\">\n		<label class=\"control-label\">Description</label>\n		<div class=\"controls\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.description;
  foundHelper = helpers.markdown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "markdown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\n	      </div>\n	      \n	      <div class=\"control-group\">\n		<label class=\"control-label\">Last Change</label>\n		<div class=\"controls\">\n		  ";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.last_change;
  stack1 = helpers['with'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</div>\n	      </div>\n	    </fieldset>\n	  </form>\n	</div>\n	<div class=\"span4\">\n	  <input id=\"charm-deploy\" value=\"Deploy\" type=\"submit\" class=\"btn btn-inverse\"></input>\n\n	  <hr/>\n	  <b>Provides</b>\n	  <ul>\n	  ";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.provides;
  foundHelper = helpers.iflat;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)}) : helperMissing.call(depth0, "iflat", stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	  </ul>\n\n	  <b>Requires</b>\n	  <ul>\n	  ";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.requires;
  foundHelper = helpers.iflat;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)}) : helperMissing.call(depth0, "iflat", stack1, {hash:{},inverse:self.noop,fn:self.program(5, program5, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	  </ul>\n	</div>\n      </div>\n";
  return buffer;});
  
    Templates['service-config'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n\n        <div class=\"control-group\">\n          <div class=\"well\">\n            ";
  foundHelper = helpers.description;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.description; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n          </div>\n          <div class=\"control-label\" for=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.type;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + ": ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</div>\n          <div class=\"controls\">\n             <input type=\"text\" id=\"input-";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" value=\"";
  foundHelper = helpers.value;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.value; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"/>\n          </div>          \n        </div>\n \n      ";
  return buffer;}

  buffer += "<div class=\"row\">\n  <div class=\"span8\">\n    <h1><a href=\"/service/";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/\"> Service ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h1>\n    <br/> <br/>\n    <div class=\"btn-group\">\n      <a href=\".\" class=\"btn\"><i class=\"icon-th\"></i> Units </a>\n      <a href=\"config\" class=\"btn\"><i class=\"icon-cog\"></i> Settings </a>\n      <a href=\"constraints\" class=\"btn\"><i class=\"icon-leaf\"></i> Constraints</a>\n      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\"\n         class=\"btn\"><i class=\"icon-book\"></i> Charm </a>\n      <button class=\"btn\"><i class=\"icon-ban-circle\"></i> Exposed </button>\n      <a href=\"relations\" class=\"btn\"><i class=\"icon-random\"></i> Relations </a>\n    </div>\n  </div>\n    <div class=\"span4\">\n      <div class=\"well\">\n        <span>\n          <b>Charm:</b>\n          <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></span>\n        <br/>\n        <span> <b>Units:</b></span>\n        <br/>\n        <span> <b>Relations:</b></span>\n        <br/>\n        <span><b>Exposed:</b> ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.exposed;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span>\n        <br/>\n      </div>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"span12\">\n    <form class=\"form-horizontal\">\n      <legend>";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " settings</legend>\n\n       ";
  foundHelper = helpers.settings;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.settings; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.settings) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        <div class=\"control-group\">\n          <div class=\"controls\">\n            <button type=\"submit\" cls=\"btn\">Update</button>\n          </div>\n        </div>\n      </form> \n</div>";
  return buffer;});
  
    Templates['service-relations'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n         <tr>\n            <td>";
  foundHelper = helpers.ident;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.ident; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td>\n            <td>";
  foundHelper = helpers.role;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.role; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td>\n            <td><a href=\"/service/";
  foundHelper = helpers.endpoint;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.endpoint; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/\">";
  foundHelper = helpers.endpoint;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.endpoint; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a></td>\n            <td>";
  foundHelper = helpers.scope;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.scope; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</td>\n         </tr>\n         ";
  return buffer;}

  buffer += "<div class=\"row\">\n  <div class=\"span8\">\n    <h1><a href=\"/service/";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/\"> Service ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h1>\n    <br/> <br/>\n    <div class=\"btn-group\">\n      <a href=\".\" class=\"btn\"><i class=\"icon-th\"></i> Units </a>\n      <a href=\"config\" class=\"btn\"><i class=\"icon-cog\"></i> Settings </a>\n      <a href=\"constraints\" class=\"btn\"><i class=\"icon-leaf\"></i> Constraints</a>\n      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\"\n         class=\"btn\"><i class=\"icon-book\"></i> Charm </a>\n      <button class=\"btn\"><i class=\"icon-ban-circle\"></i> Exposed </button>\n      <a href=\"relations\" class=\"btn\"><i class=\"icon-random\"></i> Relations </a>\n    </div>\n  </div>\n    <div class=\"span4\">\n      <div class=\"well\">\n        <span>\n          <b>Charm:</b>\n          <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.charm_name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></span>\n        <br/>\n        <span><b>Units:</b></span>\n        <br/>\n        <span><b>Relations:</b></span>\n        <br/>\n        <span><b>Exposed:</b> ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.exposed;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span>\n        <br/>\n      </div>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"span12\">\n      <h5>Service Relations</h5>\n      <table class=\"table table-striped table-bordered\">\n       <thead>\n         <tr>\n          <th>Id</th>\n          <th>Role</th>\n          <th>Remote</th>\n          <th>Scope</th>\n       </thead>\n\n       <tbody>\n         ";
  foundHelper = helpers.relations;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.relations; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.relations) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n       </tbody>\n      </table>\n    </div>\n</div>";
  return buffer;});
  
    Templates['charm-collection'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n              <li class=\"span3\">\n		<div class=\"thumbnail\" data-charm-url=\"";
  foundHelper = helpers.data_url;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.data_url; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n		  <h5>~";
  foundHelper = helpers.owner;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.owner; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.series;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.series; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "/";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " <i class=\"icon-user\"></i></h5>\n		  <span>";
  foundHelper = helpers.summary;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.summary; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n		</div>\n	      </li>\n              ";
  return buffer;}

  buffer += "      <div>\n        <h1>Charm Collection</h1>\n	<form class=\"well form-inline\">\n	  <label>Series <input type=\"text\" class=\"input-small\" placeholder=\"Precise\"></label>\n	  <label>Owner <input type=\"text\" class=\"input-small\" placeholder=\"Ubuntu\"></label>\n	  <label>Provides <input type=\"text\" class=\"input-small\" placeholder=\"Owner\"></label>\n	  <label>Requires <input type=\"text\" class=\"input-small\" placeholder=\"Owner\"></label>\n	  <label>\n	    Sort \n	    <select class=\"input-small\">\n	      <option>Match</option>\n	      <option>Modified</option>\n	      <option>Owner</option>\n	      <option>Series</option>\n	    </select>\n	  </label>\n	  <button type=\"submit\" class=\"btn\">Search</button>\n	</form>\n	<div class=\"collection\">\n	  <div class=\"charm\">\n	    <ul class=\"thumbnails\">\n              ";
  foundHelper = helpers.charms;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.charms; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.charms) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	    </ul>\n	  </div>\n	</div>\n      </div>\n";
  return buffer;});
  
    Templates['service'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n	    <li class=\"span3\">\n	      <div class=\"thumbnail well\" id=\"";
  foundHelper = helpers.id;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n		<h5>";
  foundHelper = helpers.id;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h5>\n		<span>";
  foundHelper = helpers.agent_state;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.agent_state; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span> <br/>\n		<span>";
  foundHelper = helpers.public_address;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.public_address; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</span>\n	      </div>\n	    </li>\n	    ";
  return buffer;}

  buffer += " <div class=\"row\">\n	<div class=\"span8\">\n	  <h1><a href=\"/service/";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/\"> Service ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></h1>\n	  <br/> <br/>\n    <div class=\"btn-group\">\n      <a href=\".\" class=\"btn\"><i class=\"icon-th\"></i> Units </a>\n      <a href=\"config\" class=\"btn\"><i class=\"icon-cog\"></i> Settings </a>\n      <a href=\"constraints\" class=\"btn\"><i class=\"icon-leaf\"></i> Constraints</a>\n      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\"\n         class=\"btn\"><i class=\"icon-book\"></i> Charm </a>\n      <button class=\"btn\"><i class=\"icon-ban-circle\"></i> Exposed </button>\n      <a href=\"relations\" class=\"btn\"><i class=\"icon-random\"></i> Relations </a>\n    </div>\n	</div>\n	<div class=\"span4\">\n	  <div class=\"well\">\n	    <span>\n	      <b>Charm:</b>\n	      <a href=\"/charms/charms/";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "/json\">";
  stack1 = depth0.charm;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a></span>\n	    <br/>\n	    <span> <b>Units:</b></span>\n	    <br/>\n	    <span> <b>Relations:</b></span>\n	    <br/>\n	    <span><b>Exposed:</b> ";
  stack1 = depth0.service;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.exposed;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</span>\n	    <br/>\n	  </div>\n	</div>\n </div>\n\n <div class=\"row\">\n	<div class=\"span12\">\n	  <ul class=\"nav nav-tabs\">\n	    <li class=\"active\"><a href=\".\">All</a></li>\n	    <li><a href=\"?state=running\">Running</a></li>\n	    <li><a href=\"?state=pending\">Pending</a></li>\n	    <li><a href=\"?state=error\">Error</a></li>\n	  </ul>\n	</div>\n </div>\n\n\n <div class=\"collection\">\n	<div class=\"charm\">\n	  <ul class=\"thumbnails\">\n	    ";
  foundHelper = helpers.units;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  else { stack1 = depth0.units; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if (!helpers.units) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "	    \n	  </ul>\n	</div>\n </div>\n\n";
  return buffer;});
  
    Templates['overview'] = Y.Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  


  return "<div id=\"canvas\"></div>\n";});
  

  

}, '3.6.0', {
    requires: ['handlebars-base']
});
