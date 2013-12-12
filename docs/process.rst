=============
Process Notes
=============

Checklist for Starting a Branch
===============================

- Understand the problem.  If you do not, ask and be persistent until you do.
- When determining a solution, consider this preferred `Software
  Architecture Cheat Sheet
  <http://gorban.org/post/32873465932/software-architecture-cheat-sheet>`_.
- Have a pre-implementation call with someone about your solution.  If you
  are not sure of your solution, prototype before the pre-implementation call.
- Use TDD (Test-Driven Development).  Your prototype might be perfect, but you
  can still move it aside and rebuild it gradually as you add tests.  It can
  go quickly.
- Update the ``CHANGES.yaml`` file with your changes.  The newest (topmost)
  section should have the version ``unreleased``.  If not and you are
  making changes, add an ``unreleased`` section at the top.  All other
  version numbers follow `Semantic Versioning <http://semver.org/>`_.

.. _preparing-reviews:

Checklist for Preparing for a Review
====================================

- Round-trips with reviewers are expensive. Try to eliminate them.

  - Pre-review your diff!  Tip: you can diff your branch against a local
    trunk named "trunk" with "bzr diff -r ancestor:../trunk/".

    - All new code should have tests.  If it does not, be prepared to explain
      why to skeptical reviewers.
    - Have you cleaned out temporary comments and debugging changes?
    - Is the code understandable?
    - Do you have superfluous or duplicated code?

- Make sure there is a bug for your branch.  Ideally there was one when you
  started, but if not, see the ``-new-bug`` option to the ``lbox propose -cr``
  command, which is introduced below.
- Aim for a branch diff size between 300 and 500 lines.
- Treat branch diff sizes of more than 800 lines as a problem.

  - Try to subdivide it now.  If you cannot, explain to your reviewers your
    reasoning.
  - Treat this as an opportunity to learn.  Consider what you could have
    done differently to make a smaller branch.

- Update the ``CHANGES.yaml`` file with a description of the changes you
  made.  Reference Launchpad bugs if appropriate.
- Propose your branch with lbox (see `this blog post`_) and Rietveld.  The
  command to use is ``lbox propose -cr``.  This will ask you to write a commit
  message/cover letter for the review (use the usual EDITOR environment
  variable to specify what to use for writing it).  It will then ask you to
  sign into a Google account so that it can create a Rietveld review request
  for you.
- If the branch is very minor, such as a documentation change, feel free to
  self-review.  However, *don't neglect to consider your responsibilities
  above*, especially the diff review and running tests (even if you think
  there is no way the tests could have been affected).

.. _`this blog post`:
    http://blog.labix.org/2011/11/17/launchpad-rietveld-happycodereviews

It is your responsibility to get reviewers of your branch!  Reviewers will
hopefully take it, but if they do not, rustle some up.

When you get your reviews back, be appreciative, and be sure to respond to
every request, even if it is to disagree.  If you do disagree, try to come to
a resolution with the reviewer.  If the reviewer is out for a day, you can try
to work it out with someone else instead, but it is much better to work
directly with the person who raised the concern.

Once you have two approving reviews (and no disapproving reviews, or a
resolution from someone else in lieu of an absent reviewer), you may land your
branch.  Use ``lbox submit``.

Checklist for Reviewing
=======================

Your goal is to help the coder land their code, so that we incrementally
improve the user experience and the codebase quality without user-facing
regressions.  Occasionally we might even have to consciously take a step
backwards in order to step forwards, as Kent Beck explains: `When Worse
Is Better: Incrementally Escaping Local Maxima
<http://www.facebook.com/notes/kent-beck/when-worse-is-better-incrementally-escaping-local-maxima/498576730175196>`_.

- Run ``make test-prod`` and ``make test-debug`` and confirm that tests pass.
- Prepare for QA. Retrieve their pull request branch into your local checkout.

  ::

    # stash any current WIP you don't wish to commit
    git stash

    # This assumes you've set up the `juju` remote and `qa-pr`, as described
    # in the HACKING doc.
    # It  requests that git fetch the #6 pull request from the Juju repository
    # and merge it into a new branch called qa-sticky-headers
    git qa-pr juju 6 qa-sticky-headers

- Run ``make server`` with the qa branch.

  - Do not forget to clear the browser cache: ``index.html`` may be sticking
    around because of the cache.manifest.
  - Verify that the browser reports no 404s and no Javascript errors in the
    console.
  - QA the changes if possible, exploring different use cases (and edge cases).
  - Spend between 60 and 120 seconds exploring the entire app.  Do different
    things every time.  Try to break the app, generally.

- We support multiple browsers. Please try them all, at least briefly.
- Review the diff, including notes from the above as appropriate.

  - Make sure that new code has tests.
  - Make sure user-facing changes are described in ``CHANGES.yaml``.
  - Make sure you can understand the new code.  Ask for clarification if
    necessary.
  - Consider the advice in this preferred `Software Architecture Cheat Sheet
    <http://gorban.org/post/32873465932/software-architecture-cheat-sheet>`_
  - Make sure changes to a file correspond to the naming conventions and other
    stylistic considerations local to that file, and within our project.
  - Before you ask for a change, think and make sure you cannot compromise
    reasonably with the coder.  If there is a low importance disagreement, in
    general the coder's position should win.
  - Only make a rework request if absolutely necessary.  They are very
    expensive in time, money, and morale.  One way to think about it is to
    imagine filing a bug for the problem you see.  Are you confident it is a
    bug?  If not, reconsider.  If it would be a bug, how would you triage it?
    A critical bug almost certainly indicates something that should be
    reworked now.  A high bug might or might not.  If it is anything else,
    maybe it can wait, with a respectful email or bug that starts a
    discussion, or establishes a goal or standard, or reminds everyone about a
    previously agreed decision.

- In your summary message, thank the coder.
- In your summary message, if you ask for changes, make it clear whether you
  want to re-review after the changes, or if you automatically approve if the
  changes are made.  We have agreed to use these arbitrary code phrases, for
  clarity: "Land as is," "Land with changes," and "Request review".

.. _make-releases:

Making Releases
===============

Checklist for Making a Stable Release
-------------------------------------

- Get a clean branch of the trunk:: ``bzr branch lp:juju-gui``.
- If you are using a pre-existing branch, make sure it is up-to-date:
  ``bzr pull``.
- Visually QA the GUI against improv both with and without the --landscape
  switch.  Load the app, open the charm panel, go to an inner page, and make
  sure there are no 404s or Javascript errors in the console.  Verify that the
  Landscape icons, links, and badges are present when expected.  Additionally,
  run through the steps in the QA Checklist below.

- Verify that the section in ``CHANGES.yaml`` for the new release has the
  expected changelog news items, using the format described in the file.  If
  you suspect that the changelog does not adequately describe what we
  accomplished since the last release, do the following.

  - First, relax.  This is a matter of art.  Do your best, and focus on the
    end user.  These instructions will ask you to make tons of judgements.  Go
    for it. :-)
  - Identify the tag of the last release.  This should usually be a three-part
    identifier such as the one you made in the bzr tag above.  If you are not
    sure of the tags, try the bzr "tags" command, e.g. ``bzr tags`` or (for
    less cruft) ``bzr tags -r date:2013-10-17..``.
  - Look at the logs since the last release tag.  If the last release tag was
    0.11.0, for instance, use ``bzt log -r tag:'0.11.0'..``.  You might want
    to pipe this output through less or something similar.
  - Review each commit from those logs.  If the commit represents a new
    feature or fix that is interesting to end users, add a bullet for it in
    the changelog for this release.
  - Features should come first, working approximately from the features
    that are most compelling to end users down to the least.
  - Fixes should come next.  Prefix fixes with "(FIX)" so they are clearly
    marked.  Sometimes the difference between a feature and a fix is hard to
    gauge.  Think about it from the perspective of the end user and make your
    best shot.  Put big fixes first.
  - Flagged, unreleased features come last.  Mention the feature flag first
    ('Behind the "charmworldv3" flag, ...') and then summarize progress.  Even
    if many commits were behind a feature flag, just have a single bullet
    describing what we accomplished and, perhaps, what remains.

- Verify that the top-most version in ``CHANGES.yaml`` specifies the expected
  version string.  It should be bigger than the most recent version found on
  <https://launchpad.net/juju-gui/stable>.  If the most recent version string
  is ``unreleased``, decide what the next version number should be (see
  `Semantic Versioning   <http://semver.org/>`_) and change ``unreleased`` to
  that value.
- Set a bzr tag for the release, e.g.: ``bzr tag 0.1.5``.
- Verify that your changes to the YAML work by running ``make docs``.  Fix
  any problems identified.
- Commit to the branch with this checkin message:
  ``bzr commit -m 'Set version for release.'``
- Push the branch directly to the parent (``bzr push :parent`` should work).

- Run the tests and verify they pass: ``make test-prod`` and then
  ``make test-debug``.
- Create the tarball: ``FINAL=1 make distfile``.  The process will end by
  reporting the name of the tarball it made.
- In an empty temporary directory somewhere else on your system, expand the
  tarball: ``tar xvaf PATH_TO_TARBALL``.
- Check that read permissions for all are present on all files and
  directories. (``find . ! -perm -a+r``)
- Ensure that the ``build-prod/juju-ui/version.js`` file contains a version
  string that combines the value in the branch's ``CHANGES.yaml`` with the
  branch's revno.
- While still in the directory where you extracted the tar file, change
  build-prod/juju-ui/assets/config.js to specify sandbox: true,
  user: 'admin', password: 'admin',
  simulateEvents: false, and showGetJujuButton: true.
- Configure a webserver to serve the files, if you have not already.  For
  example, these are nginx instructions.

  - ``sudo apt-get install nginx``
  - Create a jujugui file in /etc/nginx/sites-available with content similar to
    the following, but replacing the root with the path to the build-prod
    directory of where you have expanded the tarball::

      server {
        listen 80 default_server;
        listen [::]:80 default_server ipv6only=on;
        root /home/gary/tmp/juju-gui/build-prod;
        index index.html;
        server_name localhost;
        location / {
          try_files $uri $uri/ /index.html;
        }
      }

  - In /etc/nginx/sites-enabled, remove any existing symlinks (such as to
    "default") and add a symlink to /etc/nginx/sites-avilable/jujugui.
  - ``sudo service nginx restart`` (or ``sudo service nginx start``).

- Go to the localhost port on which the app is running (80 if you use the
  instructions above).
- In Chrome and Firefox, QA the application.

  - Load the app, open the charm panel, go to an inner page, and make
    sure there are no 404s or Javascript errors in the console.
  - Ensure that the ``/juju-ui/version.js`` URL shows the same version
    string as before.
  - We want a real QA script for the future.

- Now it is time to upload the release.  Head back to your branch and
  run ``FINAL=1 PROD=1 make dist``.  The computer will again walk you
  through the process and upload the release, this time to production.

  - Note that, one time per computer, you will again have to accept the
    Launchpadlib security token: In Launchpad, the staging site and the
    production have fully separate databases, including authentication.  What
    is done in production will in many cases eventually be copied over to
    staging, but never vice versa.  Staging data is destroyed periodically.

- Go to <https://launchpad.net/juju-gui/stable> and verify that you see
  a new release and a new download file.
- Download the file and compare it to the original tarball in the
  ``release/`` directory, verifying that they are identical (hint: use
  the ``cmp`` command).
- Go to https://readthedocs.org/builds/juju-gui/ and request a new build.
- Set the version back to ``unreleased`` by doing the following.

  - Restore ``- unreleased:`` as most recent version string in
    ``CHANGES.yaml``.
  - Verify that your changes to the YAML work by running ``make docs``.  Fix
    any problems identified.
  - Commit to the branch with this checkin message:
    ``bzr commit -m 'Set version back to unreleased.'``
  - Push the branch directly to the parent (``bzr push :parent`` should work).

- Make a new release of the juju-gui charm by doing the following.

  - Get a clean branch of the charm trunk owned by juju-gui:
    ``bzr branch lp:~juju-gui/charms/precise/juju-gui/trunk/ juju-gui-trunk``.
  - Get a clean branch of the released branch trunk (from charmers):
    ``bzr branch lp:charms/juju-gui charmers-trunk``.
  - Merge possible changes from the charmers' charm to trunk:
    ``bzr merge -d juju-gui-trunk charmers-trunk``.
  - If required, commit the changes by running the following from the
    juju-gui-trunk directory:
    ``bzr ci -m "Merged changes from the released charm."``
  - Copy the new release to the releases directory of the charm
    (i.e. ``juju-gui-trunk/releases``).
  - Remove the old release present in the same directory, and add the new one
    to the repository, e.g.:
    ``bzr rm releases/juju-gui-0.10.1.tgz && bzr add``.
  - Bump the charm revision up.
  - Commit the changes:
    ``bzr ci -m "Updated to the newest juju-gui release."``.
  - Switch to the charmers' charm directory (charmers-trunk).
  - Merge the new changes from trunk: ``bzr merge ../juju-gui-trunk/``.
  - Set a bzr tag for the release, e.g.: ``bzr tag 0.11.0``.
  - Commit the changes: ``bzr ci -m "New charm release."``
  - If the merge step above shows more changes than just the new GUI release,
    it is worth live testing the "upgrade charm" steps. This way we ensure any
    production deployment (e.g. jujucharms.com) can upgrade to the new charm
    without problems. This is done by deploying from a local repository the old
    released juju-gui charm, setting up the options as described in
    <https://wiki.canonical.com/InformationInfrastructure/WebOps/CDO/JujuGui>,
    and then upgrading the charm to the new local version, verifying the hooks
    are executed correctly and the resulting GUI works well. Please ping
    GUI developers on the Freenode's #juju-gui channel for further explanation
    of the process.
  - Run the charm linter: ``make lint``.
  - Run the charm unit and functional tests, passing the name of the Juju
    environment you want to use (this step takes ~1 hour):
    ``make test JUJU_ENV=ec2``. Note that, since juju-core requires root
    privileges to bootstrap and destroy an environment when you use the local
    provider, and since juju-test does not yet support this use case, you have
    to use another provider type (like AWS in the example above).
  - juju-test might leave the environment alive at the end of the test run:
    destroy it with ``juju destroy-environment -e ec2 -y``.
  - if any error occurs while trying the "upgrade charm" story or in the test
    suite, fix the errors before proceeding. If it ends up not being a trivial
    fix, stop this process and create a critical bug/card.
  - if everything went well, push the branch directly to the parent:
    ``bzr push :parent`` should work.
  - Align the ~juju-gui branch to the ~charmers one:
    ``cd ../juju-gui-trunk && bzr merge ../charmers-trunk/``.
  - Commit: bzr ci -m "Merged back the new charm release."
  - Push the branch directly to the parent: ``bzr push :parent`` should work.
  - In a few minutes, the new charm revision should be available in
    <https://jujucharms.com/search/precise/juju-gui/> and
    <http://manage.jujucharms.com/charms/precise/juju-gui>.


You are done!

Checklist for Making a Developer Release
----------------------------------------

- Get a clean branch of the trunk:: ``bzr branch lp:juju-gui``.
- If you are using a pre-existing branch, make sure it is up-to-date:
  ``bzr pull``.
- Run through the QA Checklist (below).
- Verify that the top-most version in ``CHANGES.yaml`` is ``unreleased``.
- Run ``bzr revno``.  The revno should be bigger than the most recent release
  found on `Launchpad <https://launchpad.net/juju-gui/trunk>`_.
- Run the tests and verify they pass: ``make test-prod`` and then
  ``make test-debug``.
- Create the tarball: ``make distfile``.  The process will end by reporting
  the name of the tarball it made.
- In an empty temporary directory somewhere else on your system, expand the
  tarball: ``tar xvzf PATH_TO_TARBALL``.
- Check that read permissions for all are present on all files and
  directories. (``find . ! -perm -a+r``)
- Ensure that the ``build-prod/juju-ui/version.js`` file contains a version
  string that combines the value in the branch's ``CHANGES.yaml`` with the
  branch's revno.
- While still in the directory where you extracted the tar file, run the
  command: ``NO_BZR=1 make prod``.
- Start the ``improv.py`` script as described in the HACKING file.
- Go to the URL shown in the terminal.
- In Chrome and Firefox, QA the application.

  - Load the app, open the charm panel, go to an inner page, and make
    sure there are no 404s or Javascript errors in the console.
  - Ensure that the ``/juju-ui/version.js`` URL shows the same version
    string as before.
  - We want a real QA script for the future.

- Also do the same checks after running the command ``NO_BZR=1 make debug``.
- Now it is time to upload the release.  Head back to your branch and
  run ``PROD=1 make dist``.  The computer will again walk you through the
  process and upload the release.

  - Note that, one time per computer, you will again have to accept the
    Launchpadlib security token: In Launchpad, the staging site and the
    production have fully separate databases, including authentication.  What
    is done in production will in many cases eventually be copied over to
    staging, but never vice versa.  Staging data is destroyed periodically.

- Go to <https://launchpad.net/juju-gui/trunk> and verify that you see
  a new release and a new download file.
- Download the file and compare it to the original tarball in the
  ``release/`` directory, verifying that they are identical (hint: use
  the ``cmp`` command).

You are done!

QA Checklist
------------

The following is a quick checklist to run through to ensure that the default
story of a new user is clean when they experience the GUI for the first time.
In addition to this, one might want to go through the cards in the Releasable
lane and try to break new (and old) features.  Any breakages would stop the
release process and be worthy of a test in their own right.

Using whatever branch will be used for the release, run ``make prod`` while
improv is running.  Additionally, these steps may be completed with both
``sandbox`` and ``simulateEvents`` set to ``true``.

- Add MySQL.
- Drag MySQL ghost.
- Confirm adding MySQL.
- Confirm it retains position.
- Add WordPress.
- Drag WordPress ghost.
- Confirm adding WordPress.
- Confirm it retains position.
- Drag both services to ensure they retain position and that the service menu
  is not shown on drag end.
- Add a relation between the two services.
- Drag both services to ensure the relation line follows.
- Add another charm.
- Cancel adding.
- Add another charm.
- Confirm adding it.
- Delete it.
- Leave the simulator running for a minute or so to ensure nothing weird
  happens (only applicable if the simulator is running).
- Pan and zoom around the canvas.
- Hit ')' to re-center the services in the viewport.
- Log out and back in.
- Search for apache.
- Ensure results look sane.
- Go between sidebar and minimized views in the charm browser.
- Visit the internal pages by double clicking a service, ensure
  sanity (this step will go away with future designs).

Making NPM Cache Files
======================

We use archives of NPM caches to speed up deployment of non-release
branches of the Juju GUI via charm.  This section describes how to
update the cache file stored in Launchpad.

Checklist for Uploading a Cache File
------------------------------------

- Get a clean branch of the trunk:: ``bzr branch lp:juju-gui``.
- If you are using a pre-existing branch, make sure it is up-to-date:
  ``bzr pull``.
- Run the tests and verify they pass: ``make test-prod`` and then
  ``make test-debug``.
- Create the tarball: ``PROD=1 make npm-cache``.  The cache
  file (and a signature thereof) will be created and uploaded to
  Launchpad.  If you wish to upload to staging.launchpad.net instead,
  omit "PROD=1".

Checklist for Running a Daily Meeting
=====================================

Move quickly if possible. :-)

First part: Where are we right now?  We move over the kanban board roughly
right to left.

- Review Done Done cards.  For each card:

  - ask the people who implemented it if there is anything we should know about
    it (e.g., it changes how we do something, it unblocks some cards, etc.)
  - If it represents a problem, and in particular if it took more than 24 hours
    in an active lane, move the card to "Weekly review" for us to talk about on
    Friday.
  - Otherwise, move the card to "Archive".

- Review active and QA cards.  Have any of them been in the same place for more
  than 24 hours?  If so, problem solve (e.g., ask for details, ask if
  collaboration would help, and ask if anything else would help).  Who needs a
  review?
- Review active slack cards.  Anything we should know?  Who needs a review?
- Review Miscellaneous Done and Active cards.  Ask for comments.  Afterwards,
  move all Done cards to "Archive," or to "Weekly review" for discussion.

Second part: what are we going to do?

- Look for non-done cards with a deadline, or a critical or high priority.
  Discuss as necessary.
- Review all blocked cards everywhere. Are any of them unblocked? Do we need to
  take action to unblock any of them?
- Does it at least look like we have cards ready to be started?  Are they
  divided into single-day chunks?
- Circle around the team.  For each person...

  - Encourage but do not require each person to mention what card they plan to
    work on for the next 24 hours, if that has not already been discussed.
  - Ask the person to mention any items that everyone should know: remind
    people of reduced availability, request help such as code reviews or pair
    requests, etc.

Checklist for Running a Weekly Retrospective
============================================

Do not go over allotted time.  Try to move quickly to discuss all
desired topics while they are still fresh on everyone's mind.  Consider
letting interested parties discuss later.

- Briefly review where we are in project plan.

  - Review any upcoming deadlines.
  - Review last week's goals.  Did we meet them?
  - Review availability and capacity of team members for the upcoming week.
  - Set goals for next week.  Mark cards with goals on kanban board with
    "high".

- Review cards in "Weekly review" lane.

  - If a card had a problem (e.g. active more than 24 hours), why did it
    happen?  Consider applying five whys or similar analysis.
  - If a topic card, let the person with the topic lead discussion.

Suggested sources for topic cards:

- Any new tricks learned?

  - Collaboration tricks?
  - Debugging tricks?
  - Communication tricks?
  - Checklists? Processes?

- Any nice successes?

  - Can you attribute your success to anything beyond the innate brilliance of
    yourself and your coworkers?

- Any pain experienced?

  - Are there any cards that are/were taking too long to move?

    - Are they blocked?
    - Are we spinning our wheels?
    - How long is too long?

  - Are we not delivering value incrementally?
  - Are we not collaborating?
  - Did we duplicate any work?
  - Did we have to redo any work?

    - Did we misunderstand the technical requirements, the goal, or a process?
    - Was the ordering of tasks that we chose broken?

- Can we learn from it?

  - Checklist?
  - Experiment?
  - Another process change?

Slack Project Policy
====================

- The project should further Canonical in some aspect.  Examples include
  making yourself a more valuable employee to Canonical (i.e., studying a
  technology that is important to the company), improving processes or
  tools for our team, or building or improving something for another part
  of Canonical.
- Consider who you expect to maintain the project.

  - Yourself: Be skeptical of this, but if so, that's fine.
  - Our team: discuss design with team, and/or follow the "prototype, discuss,
    code" pattern we have for new projects (that is, prototype yourself and
    then discuss the prototype with the team).
  - Cloud Engineering team: make a LEP, consult with team lead (deryck), and
    get acceptance from TA (lifeless) and/or any other stakeholders identified
