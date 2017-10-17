/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Lightbox = require('../../lightbox/lightbox');
const SvgIcon = require('../../svg-icon/svg-icon');

class Tour extends React.PureComponent {
  render() {
    const tourPath = '/static/gui/build/app/assets/images/non-sprites/tour';
    return (
      <div>
        <span className="back-to-help"
          onClick={this.props.endTour.bind(this)}>
          <SvgIcon
            name="chevron_down_16" size="16" className="back-to-help__icon" />
          Back to GUI help
        </span>
        <Lightbox
          close={this.props.close.bind(this)}
          extraClasses={['tour']}>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/welcome.png`}
              srcSet={`${tourPath}/welcome-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Welcome to JAAS. You've arrived at the empty canvas.
                 Click on the green button to visit the store and start building
                 your application.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/store.png`}
              srcSet={`${tourPath}/store-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Browse the store to find charms for the applications you use and
                pre-configured bundles that build the solutions you need.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/relations.png`}
              srcSet={`${tourPath}/relations-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Juju relations allow individual applications to share information,
                request resources, and coordinate operations.
                To create one, select one of the applications and grab the 'connect'
                symbol that appears above it. Then drag it to the other
                applications to make the relation.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/inspector.png`}
              srcSet={`${tourPath}/inspector-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                The inspector shows a list of all the applications in your model.
                Use it to scale, expose, and configure your applications.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/machine-app-view.png`}
              srcSet={`${tourPath}/machine-app-view-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Use the inspector to switch between application view,
                where you can see a visual representation of your workload,
                and machine view, where you can see and manage all of the instances
                your model is using.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/deploy.png`}
              srcSet={`${tourPath}/deploy-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Ready to deploy your workload? Click the blue Deploy button shown
                on the bottom right.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${tourPath}/post-deploy.png`}
              srcSet={`${tourPath}/post-deploy-mobile.png 620w` }
            />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Creating instances, deploying applications, and performing
                configuration can sometimes take several minutes. Pending units
                are outlined in <span className="u-pending">orange</span> &mdash;
                These are still in progress.
                Your model will be fully up and running once all application icons
                are outlined in gery.
              </p>
            </div>
          </div>
        </Lightbox>
      </div>
    );
  }
}

Tour.propTypes = {
  close: PropTypes.func.isRequired,
  endTour: PropTypes.func
};

module.exports = Tour;
