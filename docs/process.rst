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
- Run ``python improv.py -f sample.json`` in the ``rapi-rollup`` Juju branch,
  and run ``make server`` with the ``juju-ui`` branch.

  - Do not forget to clear the browser cache: ``index.html`` may be sticking
    around because of the cache.manifest.
  - Verify that the browser reports no 404s and no Javascript errors in the
    console.
  - QA the changes if possible, exploring different use cases (and edge cases).
  - Spend between 60 and 120 seconds exploring the entire app.  Do different
    things every time.  Try to break the app, generally.

- [Once we support multiple browsers, try them all, at least briefly.]
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
- Verify that the top-most version in ``CHANGES.yaml`` specifies the expected
  version string.  It should be bigger than the most recent version found on
  <https://launchpad.net/juju-gui/stable>.  If the most recent version string
  is ``unreleased``, do the following.

  - Decide what the next version number should be (see `Semantic Versioning
    <http://semver.org/>`_) and change ``unreleased`` to that value.
  - Set a bzr tag for the release, e.g.: ``bzr tag 0.1.5``.
  - Commit to the branch with this checkin message:
    ``bzr commit -m 'Set version for release.'``
  - Push the branch directly to the parent (``bzr push :parent`` should work).

- Run the tests and verify they pass: ``make test-prod`` and then
  ``make test-debug``.
- Create the tarball: ``FINAL=1 make distfile``.  The process will end by
  reporting the name of the tarball it made.
- In an empty temporary directory somewhere else on your system, expand the
  tarball: ``tar xvzf PATH_TO_TARBALL``.
- Check that read permissions for all are present on all files and
  directories. (``find . ! -perm -a+r``)
- Ensure that the ``build-prod/juju-ui/version.js`` file contains a version
  string that combines the value in the branch's ``CHANGES.yaml`` with the
  branch's revno.
- Start the ``improv.py`` script as described in the HACKING file.
- While still in the directory where you extracted the tar file, change
  app/config-prod.js to specify apiBackend: 'python'.
- While still in the directory where you extracted the tar file, run the
  command: ``NO_BZR=1 make prod``.
- Go to the URL shown in the terminal.
- In Chrome and Firefox, QA the application.

  - Load the app, open the charm panel, go to an inner page, and make
    sure there are no 404s or Javascript errors in the console.
  - Ensure that the ``/juju-ui/version.js`` URL shows the same version
    string as before.
  - We want a real QA script for the future.

- Also do the same checks after running the command ``NO_BZR=1 make debug``.
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
- Set the version back to ``unreleased`` by doing the following.

  - Restore ``- unreleased:`` as most recent version string in
    ``CHANGES.yaml``.
  - Commit to the branch with this checkin message:
    ``bzr commit -m 'Set version back to unreleased.'``
  - Push the branch directly to the parent (``bzr push :parent`` should work).

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
- Go between fullscreen and minimized views in the charm browser.
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
