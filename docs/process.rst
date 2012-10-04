=====================
Juju UI Process Notes
=====================

Checklist for Reviewing
=======================

- Get an idea of what the branch is doing from the diff.
- Run ``make test`` and confirm that tests pass. (This step can be removed once
  we have tarmac.)
- Run ``make lint`` and confirm that the output is clean. (This step can be
  removed once we have tarmac.)

- Run ``python improv.py -f sample.json`` in the rapi-delta juju branch,
  and run ``make server`` with the juju-ui branch.  QA the changes if
  appropriate, and then do some exploratory testing to make sure
  everything seems to work.  For extra points, try a few different
  browsers.  TODO: Document some manual QA scripts for some of the basic
  paths.

- Review the diff, including notes from the above as appropriate.

Checklist for Running a Daily Meeting
=====================================

Move quickly if possible. :-)

First part: Where are we right now?  We move over the kanban board roughly
right to left.

- Review Done Done cards.  For each card...

  - ask the people who implemented it if there is anything we should know about it (e.g., it changes how we do something, it unblocks some cards, etc.)
  - If it represents a problem, and in particular if it took more than 24 hours in an active lane, move the card to "Weekly review" for us to talk about on Friday.
  - Otherwise, move the card to "Archive".
- Review active and QA cards.  Have any of them been in the same place for more than 24 hours?  If so, problem solve (e.g., ask for details, ask if collaboration would help, and ask if anything else would help).  Who needs a review?
- Review active slack cards.  Anything we should know?  Who needs a review?
- Review Miscellaneous Done and Active cards.  Ask for comments.  Afterwards, move all Done cards to "Archive," or to "Weekly review" for discussion.

Second part: what are we going to do?

- Look for non-done cards with a deadline, or a critical or high priority.  Discuss as necessary.
- Review all blocked cards everywhere. Are any of them unblocked? Do we need to take action to unblock any of them?
- Does it at least look like we have cards ready to be started?  Are they divided into single-day chunks?
- Circle around the team.  For each person...

  - Encourage but do not require each person to mention what card they plan to work on for the next 24 hours, if that has not already been discussed.
  - Ask the person to mention any items that everyone should know: remind people of reduced availability, request help such as code reviews or pair requests, etc.

Checklist for Running a Weekly Retrospective
============================================

Do not go over allotted time.  Try to move quickly to discuss all
desired topics while they are still fresh on everyone's mind.  Consider
letting interested parties discuss later.

- Briefly review where we are in project plan.

  - Review any upcoming deadlines.
  - Review last week's goals.  Did we meet them?
  - Review availability and capacity of team members for the upcoming week.
  - Set goals for next week.  Mark cards with goals on kanban board with "high".

- Review cards in "Weekly review" lane.

  - If a card with a problem (e.g. active more than 24 hours), why did it happen?  Consider applying five whys or similar analysis.
  - If a topic card, let the person with the topic lead discussion.

Suggested sources for topic cards:

- Any new tricks learned?

  - Collaboration tricks?
  - Debugging tricks?
  - Communication tricks?
  - Checklists? Processes?

- Any nice successes?

  - Can you attribute your success to anything beyond the innate brilliance of yourself and your coworkers?
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

- The project should further Canonical in some aspect.  Examples include making yourself a more valuable employee to Canonical (i.e., studying a technology that is important to the company), improving processes or tools for our team, or building or improving something for another part of Canonical.
- Consider who you expect to maintain the project.

  - Yourself: Be skeptical of this, but if so, that's fine.
  - Our team: discuss design with team, and/or follow the "prototype, discuss, code" pattern we have for new projects (that is, prototype yourself and then discuss the prototype with the team).
  - Cloud Engineering team: make a LEP, consult with team lead (flacoste), and get acceptance from TA (lifeless) and/or any other stakeholders identified
