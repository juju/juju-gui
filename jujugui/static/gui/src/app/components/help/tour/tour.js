/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Lightbox = require('../../lightbox/lightbox');
const SvgIcon = require('../../svg-icon/svg-icon');

class Tour extends React.PureComponent {
  render() {
    const staticURL = this.props.staticURL;
    const basePath = `${staticURL}/static/gui/build/app/assets/images/non-sprites/tour`;
    return (
      <div>
        <span className="back-to-help"
          onClick={this.props.endTour.bind(this)}>
          <SvgIcon
            className="back-to-help__icon" name="chevron_down_16" size="16" />
          Back to GUI help
        </span>
        <Lightbox
          close={this.props.close.bind(this)}
          extraClasses={['tour']}>
          <div className="tour__slide">
            <img className="tour__slide-image"
              src={`${basePath}/welcome@1x.png`}
              srcSet={`${basePath}/welcome@2x.png 2x`} />
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
              sizes="(max-width: 768px) 347w"
              src={`${basePath}/store@1x.png`}
              srcSet={`
${basePath}/store@2x.png 2x,
${basePath}/store-mobile@1x.png 347w,
`} />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Browse the store to find charms for the applications you use and
                pre-configured bundles that build the solutions you need.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              sizes="(max-width: 768px) 335w"
              src={`${basePath}/relations@1x.png`}
              srcSet={`
${basePath}/relations@2x.png 2x,
${basePath}/relations-mobile@1x.png 335w,
`} />
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
              sizes="(max-width: 768px) 307w"
              src={`${basePath}/inspector@1x.png`}
              srcSet={`
${basePath}/inspector@2x.png 2x,
${basePath}/inspector-mobile@1x.png 307w,
`} />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                The inspector shows a list of all the applications in your model.
                Use it to scale, expose, and configure your applications.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              sizes="(max-width: 768px) 431w"
              src={`${basePath}/machine-app-view@1x.png`}
              srcSet={`
${basePath}/machine-app-view@2x.png 2x,
${basePath}/machine-app-view-mobile@1x.png 431w,
`} />
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
              sizes="(max-width: 768px) 341w"
              src={`${basePath}/deploy@1x.png`}
              srcSet={`
${basePath}/deploy@2x.png 2x,
${basePath}/deploy-mobile@1x.png 341w,
`} />
            <div className="tour__slide-description clearfix">
              <p className="ten-col">
                Ready to deploy your workload? Click the blue Deploy button shown
                on the bottom right.
              </p>
            </div>
          </div>
          <div className="tour__slide">
            <img className="tour__slide-image"
              sizes="(max-width: 768px) 375w"
              src={`${basePath}/post-deploy@1x.png`}
              srcSet={`
${basePath}/post-deploy@2x.png 2x,
${basePath}/post-deploy-mobile@1x.png 375w,
`} />
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
  endTour: PropTypes.func,
  staticURL: PropTypes.string.isRequired
};

module.exports = Tour;
