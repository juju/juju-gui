=============
Process Notes
=============

Checklist for Starting a Branch
===============================

- Understand the problem.  If you don't, ask and be persistent until you do.
- When determining a solution, consider this preferred `Software
  Architecture Cheat Sheet
  <http://gorban.org/post/32873465932/software-architecture-cheat-sheet>`_
- Have a pre-implementation call with someone about your solution.  If you
  are not sure of your solution, prototype before the pre-implementation call.
- Use TDD.  Your prototype might be perfect, but you can still move it aside
  and rebuild it gradually as you add tests.  It can go quickly.
- Update the CHANGES.yaml file with your changes.  The newest (topmost)
  section should have the version "unreleased".  If not and you are
  making changes, add an "unreleased" section at the top.  All other
  version numbers follow `Semantic Versioning <http://semver.org/>`_.

Checklist for Preparing for a Review
====================================

- Round-trips with reviewers are expensive. Try to eliminate them.

  - Pre-review your diff!  Tip: you can diff your branch against a local
    trunk named "trunk" with "bzr diff -r ancestor:../trunk/".

    - All new code should have tests.  If it doesn't, be prepared to explain
      why to skeptical reviewers.
    - Have you cleaned out temporary comments and debugging changes?
    - Is the code understandable?
    - Do you have superfluous or duplicated code?

  - Run tests!  Someday we'll have that in the lbox hook...

- Make sure there is a bug for your branch.  Ideally there was one when you
  started, but if not, see the "-new-bug" option to "lbox propose".
- Aim for a branch diff size between 300 and 500 lines.
- Treat branch diff sizes of more than 800 lines as a problem.

  - Try to subdivide it now.  If you can't, explain to your reviewers your
    reasoning.
  - Treat this as an opportunity to learn.  Consider what you could have
    done differently.

- Update the CHANGES.yaml file with a description of the changes you
  made.  Reference Launchpad bugs if appropriate.
- If the branch is very minor, such as a documentation change, feel free to
  self-review.  However, *don't neglect to consider your responsibilities
  above*, especially the diff review and running tests (even if you think
  there's no way the tests could have been affected).

It is your responsibility to get reviewers of your branch!  Reviewers will
hopefully take it, but if they don't, rustle some up.

When you get your reviews back, be appreciative, and be sure to respond to
every request, even if it is to disagree.

Once you have two approving reviews (and no disapproving reviews), you may
land your branch.

Checklist for Reviewing
=======================

Your goal is to help the coder land their code, so that we incrementally
improve the user experience and the codebase quality without user-facing
regressions.  Occasionally we might even have to consciously take a step
backwards in order to step forwards, `as Kent Beck explains
<http://goo.gl/DBDtJ>`_.

- Run ``make test-prod`` and ``make test-debug`` and confirm that tests pass.
- Run ``python improv.py -f sample.json`` in the rapi-rollup juju branch, and
  run ``make server`` with the juju-ui branch.

  * Don't forget to clear the browser cache: index.html may be sticking around
    because of the cache.manifest.
  * Verify that the browser reports no 404s and no Javascript errors in the
    console.
  * QA the changes if possible, exploring different use cases (and edge cases).
  * Spend between 60 and 120 seconds exploring the entire app.  Do different
    things every time.  Try to break the app, generally.

- [Once we support multiple browsers, try them all, at least briefly.]
- Review the diff, including notes from the above as appropriate.

  * Make sure that new code has tests.
  * Make sure user-facing changes are described in CHANGES.yaml.
  * Make sure you can understand the new code.  Ask for clarification if
    necessary.
  * Consider the advice in this preferred `Software Architecture Cheat Sheet
    <http://gorban.org/post/32873465932/software-architecture-cheat-sheet>`_
  * Make sure changes to a file correspond to the naming conventions and other
    stylistic considerations local to that file, and within our project.
  * Before you ask for a change, think and make sure you can't compromise
    reasonably with the coder.  If there is a low importance disagreement, in
    general the coder's position should win.

- In your summary message, thank the coder.
- In your summary message, if you ask for changes, make it clear whether you
  want to re-review after the changes, or if you automatically approve if the
  changes are made.  We've agreed to use these arbitrary code phrases, for
  clarity: "Land as is," "Land with changes," and "Request review".

Checklist for Making a Stable Release
=====================================

- Get a clean branch of the trunk:: ``bzr branch lp:juju-gui``.
- If you are using a pre-existing branch, make sure it is up-to-date:
  ``bzr pull``.
- Verify that the top-most version in CHANGES.yaml specifies the expected
  version string.  It should be bigger than the most recent version found on
  https://launchpad.net/juju-gui/stable .  If the most recent version string
  is "unreleased," do the following.

  * Decide what the next version number should be (see http://semver.org/) and
    change "unreleased" to that value.
  * Commit to the branch with this checkin message:
    ``bzr commit -m 'Set version for release.'``
  * Push the branch directly to the parent (``bzr push :parent`` should work).

- Run the tests and verify they pass: ``FINAL=1 make test-prod`` and then
  ``FINAL=1 make test-debug``.
- Create the tarball: ``FINAL=1 make distfile``.  The process will end by
  reporting the name of the tarball it made.
- In an empty temporary directory somewhere else on your system, expand the
  tarball: ``tar xvzf PATH_TO_TARBALL``
- In the ``build-prod`` directory, under the uncompressed one, start a server:
  ``python -m SimpleHTTPServer 8888``
- In Chrome and Firefox, QA the application.  At the very least, load the app,
  open the charm panel, go to an inner page, and make sure there are no 404s
  or Javascript errors in the console.  We want a real QA script for the
  future.
- For now, we will assume you would like to verify the release on the
  Launchpad staging server.  As we become more confident with this process,
  this step may become unnecessary.  In the branch, run ``FINAL=1 make
  dist``.  This will step you through signing the tarball, connecting
  to Launchpad, and uploading the release.

  * Note that you may need to ask the webops to turn off the two-factor
    authentication on your Launchpad staging account in order for this to
    work. Go to the #launchpad-ops channel on the Canonical IRC server and ask
    something like "webops, could you disable 2FA on my staging account?"
  * When Launchpad asks you what level of permissions to grant, assuming you
    are running on your own computer that you manage securely, the easiest
    thing to do is hopefully also reasonably safe: accept that the computer
    may perform all actions, indefinitely.

- Go to https://staging.launchpad.net/juju-gui/stable and verify that you see
  a new release and a new download file.
- Download the file, expand it in a temporary directory, run ``python -m
  SimpleHTTPServer 8888``, and do a quick double-check in the browser that it
  is what you expect.  Looking at juju-ui/version.js should also show you the
  version you expect.
- This is a final release.  Consider asking others to verify the package on
  staging.
- Now it is time for the actual, real release.  Head back to your branch and
  run ``FINAL=1 PROD=1 make dist``.  The computer will again walk you
  through the process.

  * Note that, one time per computer, you will again have to accept the
    Launchpadlib security token: In Launchpad, the staging site and the
    production have fully separate databases, including authentication.  What
    is done in production will in many cases eventually be copied over to
    staging, but never vice versa.  Staging data is destroyed periodically.

- Go to https://launchpad.net/juju-gui/stable and verify that you see
  a new release and a new download file.

- Set the version back to ``unreleased`` by doing the following.

  * Restore ``- unreleased:`` as most recent version string in CHANGES.yaml.
  * Commit to the branch with this checkin message:
    ``bzr commit -m 'Set version back to unreleased.'``
  * Push the branch directly to the parent (``bzr push :parent`` should work).

You are done!

Checklist for Making a Developer Release
========================================

- Get a clean branch of the trunk:: ``bzr branch lp:juju-gui``.
- If you are using a pre-existing branch, make sure it is up-to-date:
  ``bzr pull``.
- Verify that the top-most version in CHANGES.yaml is "unreleased."
- Run ``bzr revno``.  The revno should be bigger than the most recent release
  found on `Launchpad <https://launchpad.net/juju-gui/trunk>`_.
- Run the tests and verify they pass: ``make test-prod`` and then
  ``make test-debug``.
- Create the tarball: ``make distfile``.  It will end by reporting the name of
  the tarball it made.
- In an empty temporary directory somewhere else on your system, expand the
  tarball: ``tar xvzf PATH_TO_TARBALL``.
- Looking at ``build-prod/juju-ui/version.js`` should show you a version string
  that combines the value in the branch's CHANGES.yaml with the branch's revno.
- In the ``build-prod`` directory, start a server:
  ``python -m SimpleHTTPServer 8888``
- In Chrome and Firefox, QA the application.  At the very least, load the app,
  open the charm panel, go to an inner page, and make sure there are no 404s
  or Javascript errors in the console.  We want a real QA script for the
  future.
- For now, we will assume you would like to verify the release on the
  Launchpad staging server.  As we become more confident with this process,
  this step may become unnecessary.  In the branch, run ``make dist``.
  This will step you through signing the tarball, connecting to
  Launchpad, and uploading the release.

  * Note that you may need to ask the webops to turn off the two-factor
    authentication on your Launchpad staging account in order for this to
    work. Go to the #launchpad-ops channel on the Canonical IRC server and ask
    something like "webops, could you disable 2FA on my staging account?"
  * When Launchpad asks you what level of permissions to grant, assuming you
    are running on your own computer that you manage securely, the easiest
    thing to do is hopefully also reasonably safe: accept that the computer
    may perform all actions, indefinitely.

- Go to https://staging.launchpad.net/juju-gui/trunk and verify that you see
  a new release and a new download file.
- Download the file, expand it in a temporary directory, run ``python -m
  SimpleHTTPServer 8888``, and do a quick double-check in the browser that it
  is what you expect.  Looking at juju-ui/version.js should also show you the
  version you expect, as seen in the similar earlier step above.
- Now it is time for the actual, real release.  Head back to your branch and
  run ``PROD=1 make dist``.  The computer will again walk you through the
  process.

  * Note that, one time per computer, you will again have to accept the
    Launchpadlib security token: In Launchpad, the staging site and the
    production have fully separate databases, including authentication.  What
    is done in production will in many cases eventually be copied over to
    staging, but never vice versa.  Staging data is destroyed periodically.

- Go to https://launchpad.net/juju-gui/trunk and verify that you see
  a new release and a new download file.

You are done!

Making Targets Quickly Without ``bzr``
======================================

Within a checkout, a lightweight checkout, or a branch, you may run make as
``NO_BZR=1 make [target]`` in order to prevent the Makefile from running
any bzr commands, all of which access the parent branch over the network.
Where bzr may have provided information such as the revno, sensible defaults
are used instead.  As many of these bzr commands are used to populate
variables regardless of the target, defining NO_BZR will have an effect on
all targets, except dist, which will refuse to complete.

- Note that this allows one to run any make target from the working copy,
  even if it is a lightweight checkout, by skipping steps that involve
  network access through bzr.  Because of this, make will assume that
  the revno is 0 and that the branch is clean and up to date without
  checking that it is a checkout of trunk.  The resulting tarball or build
  may be used to test releases by hand or in the charm.

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

  - If a card with a problem (e.g. active more than 24 hours), why did it
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
  - Cloud Engineering team: make a LEP, consult with team lead (flacoste), and
    get acceptance from TA (lifeless) and/or any other stakeholders identified
