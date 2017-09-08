/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Environment = function() {
  return (
    <div className="topology">
      <div className="topology-canvas">
        <div className="environment-help" style={{display: 'none'}}>
          <div className="environment-help__content">
            <p className="environment-help__tooltip">
              Add a charm or bundle to get started
            </p>
            <div className="environment-help__drop-message">
              <p className="environment-help__drop-message-content">
                  Drop file to add to model
              </p>
            </div>
            <svg className="environment-help__image"
              xmlns="http://www.w3.org/2000/svg"
              width="789.055"
              height="386.027"
              viewBox="0 0 789.055 386.027">
              <g className="plus-service">
                <circle fill="#FFF" stroke="#CECDCD" cx="374.527"
                  cy="96.438" r="63"/>
                <circle fill="#38b44a" cx="374.527" cy="96.438"
                  r="32" className="plus-service__plus-circle"/>
                <path fill="#FFF"
                  d="M383.527 95.438h-8v-8h-2v8h-8v2h8v8h2v-8h8"/>
              </g>
              <g fill="none" stroke="#CECDCD">
                <circle cx="129.527" cy="300.771" r="63"/>
                <circle strokeMiterlimit="10" cx="129.527"
                  cy="300.771" r="32"/>
              </g>
              <g fill="none" stroke="#CECDCD">
                <circle cx="679.295" cy="96.438" r="63"/>
                <circle strokeMiterlimit="10" cx="679.295"
                  cy="96.438" r="32"/>
              </g>
              <path fill="none" stroke="#CECDCD"
                strokeMiterlimit="10" d="M438.046 96.438h178"/>
              <circle fill="#CECDCD" cx="531.139" cy="96.438" r="7"/>
              <circle fill="#CECDCD" cx="250.712" cy="197.276" r="7"/>
              <path fill="none" stroke="#CECDCD"
                strokeMiterlimit="10" d="M175.28 257.708l150.865-120.865"/>
              <path fill="#CECDCD" d={
                'M172.805 255.233c1.367-1.367 3.583-1.367 4.95 0s1.367 ' +
                '3.583 0 4.95M328.62 139.318c-1.367 1.367-3.583 ' +
                '1.367-4.95 0s-1.367-3.583 0-4.95M436.99 92.938c1.933 0 ' +
                '3.5 1.567 3.5 3.5s-1.567 3.5-3.5 3.5M616.295 ' +
                '99.938c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5'}/>
            </svg>
          </div>
        </div>
        <div className="environment-menu" id="ambiguous-relation-menu">
          <div className="triangle">&nbsp;</div>
          <div className="menu-title">Select relation type:</div>
          <div id="ambiguous-relation-menu-content"></div>
        </div>
        <div className="environment-menu top" id="relation-menu"></div>
      </div>
    </div>
  );
};

module.exports = Environment;
