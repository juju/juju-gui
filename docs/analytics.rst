=========
Analytics
=========

In order to gauge exactly how the Juju GUI is being utilized, we are gathering
analytic data using Google Analytics.

Access and update rate
======================

To view the analytics go to http://google.com/analytics and sign in with your
Canonical credentials.  If you are denied access, contact Gary or Brad to have
it granted.

Once you've accessed the analytics site you should see on the left:

Juju GUI / Deployments / All Web Site Data

Select "All Web Site Data" and the "Reporting" tab.  The data under "Real
Time" are updated continuously and are appropriate for seeing if your tracking
events are being reported.

The actual reporting seems to happen on a daily basis, so if you change the
code to create a new event you won't be able to see what the data will look
like until 12-24 hours later.  It will eventually show up under "Contents /
Events / Overview".  The lag makes instrumenting the code slow and a bit
frustrating.

Unified reporting
=================

Our use of Google Analytics is a bit non-standard.  GA is intended to gather
statistics for a single site or cooperating group of sites.  They term the
latter "cross-domain tracking" [1]_ and its intended use is to provide the
ability to get a single set of statics for cooperating but disparate web
resources such as example.com, blog.example.com, and
example.shoppingcart.com.

What we are doing is completely different.  We don't want to analyze data from
a single web site or set of site but instead want to gather data from
completely different _deployments_ of Juju GUI.  Luckily we're able to exploit
the abilities provided to support cross-domain tracking to do what we need.

Initial setup
=============

For each tracking property, GA gives a unique ID (UA-XXXXX-Y) which must be
presented on each page for data gathering.  Each ID is registered to a
specific web site.  Before GA will activate that ID, their robots scan the
site and look for the tracking initialization at the top page.  Until it sees
that registration it will ignore any data sent using that ID.

We installed the tracking slug at http://uistage.jujucharms.com and that
registered the ID.  Once done, the same ID can be used at different "sites"
(really Juju GUI deployments) and the statistics are gathered under one
umbrella property.  For instance, running "make devel" on your local machine
or deploying the GUI to EC2 both allow statistics gathering.

Activation code
===============

The slug mentioned earlier is shown below.  It must appear on every page that
is to track data.  Luckily for us, we have a single page app so the following
has been installed in app/index.html.

::

    <script type="text/javascript">
      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-41463568-2']);
      _gaq.push(['_setDomainName', 'none']);
      _gaq.push(['_setAllowLinker', true]);
      _gaq.push(['_trackPageview']);
      window._gaq = _gaq;
      (function() {
      var ga = document.createElement('script');
      ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ?
                'https://ssl' : 'http://www') +
                '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(ga, s);
      })();
    </script>

GA works in a few modes, the currently preferred is called "asynchronous".  To
operate in that mode rather than making calls directly, a special array is
created and commands are pushed onto the array and are executed later but some
machinery in ga.js.  The calls above to _gaq.push() are examples.

ga.js looks for the object named "_gaq" (short for "Google Analytcs Queue").
To make our linter happy it is added to the "window" object and used in our
code as "window._gaq".

Opting out
==========

GA allows a property to be set on the window object that disables all
tracking.  This is nice because the code can be left in place and each call
doesn't need to have a trap like a feature flag wrapping it.  We expose the
disabling of tracking using a config value:

use-analytics: true|false

Once Juju GUI is deployed a user can change that config setting to turn off
analytics.

Custom events
=============

The easiest way for a traditional web site to use GA is to track page views.
You can get a good deal of information just by using the default registration
snippet shown above.

For our needs, since we aspire to be a single-page app, page views are kind of
meaningless.  The data we want to gather are event-driven and must be tracked
via custom events.

The first event we tracked was the number of units deployed for a service and
the code (in app/models/models.js update_service_unit_aggregates) looks like:

::

      // Set Google Analytics tracking event.
      if (previous_unit_count !== sum) {
        window._gaq.push(['_trackEvent', 'Service Stats', 'Update',
          service.get('id'), sum]);
      }

Note that some additional code was added to ensure an event wasn't created
unless the data actually changed.  Our goal should be to minimize the amount
of new processing we do to support the instrumentation so as to not affect the
performance of the actual app.

The calls to _trackEvent [2]_ look like:

_trackEvent(category, action, opt_label, opt_value, opt_noninteraction)

Our challenge will be to come up with a meaningful vocabulary for the
groupings of category, action, and labels.  The example call shown above
gathers data for a given service about the number of units deployed ('sum' in
this case).  If the optional value were not sent then a count of events would
be logged.

When this code is deployed in multiple places we'll get an aggregate for the
number of units deployed for a given service in all locations which is not
very helpful.  A unique, and possibly opaque, site identifier should be added
to one of those specifiers.  The best way to do that remains an open
question.

A-B Testing
===========

GA can be used for A-B testing [3]_.

Questions
=========

Anonymizing
-----------

Should we take advantage of the anonymizeIp feature [4]_?  Using it will report 0
for the last octet of an IPv4 address.  The city-level accuracy of geography
reporting will be affected but country data should still be accurate.

Site identification
-------------------

If we want to identify statistics for a particular site, what is the best way
to do that?  We need an address or name for the location where Juju GUI is
deployed, not the address of the client.

References
==========

.. [1] https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingSite
.. [2] https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide
.. [3] http://analytics.blogspot.com/2013/01/multi-armed-bandit-experiments.html
.. [4] https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApi_gat#_gat._anonymizeIp
