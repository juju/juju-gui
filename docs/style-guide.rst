===========
Style Guide
===========

This guide is an attempt to describe a code style that both works well with the
JavaScript beautifier and helps developers avoid pitfalls.


Indentation
===========

For the most part two space indents are enforced by the beautifier.  When in
doubt, completely dedent the section of code in question and run it through the
beautifier ("make beautify").  The lowest (least leading whitespace) acceptable
indention will be applied.


For Loops
=========

Unless you are counting something, for loops (and for-in loops) are a trap.
Use Y.Object.each instead.


Whitespace
==========

No trailing whitespace on lines or at the end of the file (i.e., the file
should end with a non-blank line).


Object Literal Formatting
=========================

Things you should do:

- object literals have their opening brace on a new line and the first
  value (if any) is on the same line (i.e., the opening brace is not on
  a line by itself)
- there is a space after the opening brace of an object literal
- object literals have their closing brace on the same line as their
  last value (i.e., the closing brace is not on a line by itself)

Things the beautifier should do (given an input line with no indentation
at all):

- all of the keys of an object literal line up (the second and
  subsequent key names are indented 2 spaces more than the indentation
  of the opening brace of the object literal
- lines after a line that ends in an equals sign are indented 4 (more)
  spaces
- lines after a line that ends in a colon are indented 6 (more) spaces

An example::

    var values =
        { int_good: '1',
          int_bad: 'nope!'},
        schema =
        { int_good:
              { description: 'The first option.',
                type: 'int'},
          int_bad:
              { description: 'The second option.',
                type: 'int'}},
        errors = utils.validate(values, schema);


Chaining Method Calls
=====================

Some APIs are designed such that mutating method calls return the object being
acted upon so that multiple calls can be "chained" together.  When an API
offers chainable method calls they should be chained when possible.

The expression that evaluates to the object being mutated should be placed on
the first line of the chain and each method call should be placed on its own
line::

    getFoo()
        .frob()
        .bash()
        .squish();

The "expression" rule above applies if the object is already available in a
variable.  In that case the variable should be the sole entity on the first
line::

    foo
        .frob()
        .bash()
        .squish();

Some more advanced method chaining APIs provide for returning an object other
than the original "root" object.  If a new object is returned then the
subsequent chained calls should be indented::

    getFoo()
        .frob()
        .add(makeBar())
            .bash()
            .squish();

If instead, the .add() method does not return the object added, we can still
use method chaining, but we would instead place the chained method calls
*inside* the call to .add()::

    getFoo()
        .frob()
        .add(makeBar()
            .bash()
            .squish());

The above scenario would then allow us to add multiple objects to the "root"
object without breaking the method chain::

    getFoo()
        .frob()
        .add(makeBar()
            .bash()
            .squish())
        .add(makeBaz()
            .bing()
            .zing());


Creating HTML
=============

Don't.  Generating HTML is fraught with danger.  Instead build DOM nodes::

    container.one('#message-area')
        .appendChild(Y.Node.create('<div/>'))
            .addClass('alert')
            .addClass('alert-error')
            .set('text', message)
            .appendChild(Y.Node.create('<a/>'))
                .addClass('close')
                .set('text', '×');

More complex structures can also be created.  For example, if you want a <div>
with two spans inside it::

    var thing = Y.Node.create('<div/>')
        .append(Y.Node.create('<span/>')
            .set('text', 'first span'))
        .append(Y.Node.create('<span/>')
            .set('text', 'second span'));

Note how the first example used .appendChild() which returns the child
that was appened and chains calls from there, while the second example uses
.append() but places the child node's chained method calls *inside* the
parameter list of .append().

It is important that the indentation of the calls communicates the structure of
the resulting DOM tree.  Compare and contrast the above examples.


.. _embedded-docs:

Embedded documentation
======================

We use YUIDoc to document the application's internals.  YUIDoc comment
blocks start with ``/**`` and end with ``*/``. Once you add or change
comment blocks, generate the HTML pages and check them (as described in
the `HACKING`_ document).

Full documentation for the various `YUIDoc directives`_ is available.
Note that YUIDoc also supports the `Markdown syntax`_.

.. _`YUIDoc directives`:
    http://yui.github.com/yuidoc/syntax/
.. _`Markdown syntax`:
    http://daringfireball.net/projects/markdown/syntax


Format
------

The Makefile includes a simple linter that enforces YUIDoc comment blocks
for each function in the application. This simple linting sometimes means
that functions that we might not otherwise document require documentation.

Unfortunately one-line comment blocks cannot be used, because the YUIDoc
compiler needs a type directive for each block, or else it emits "Missing
item type" warnings.

Multi-line YUIDoc comment blocks like this will be needed::

    /**
      Frob the thingy.

      @method frob
      @param {object} type How the thingy should be frobbed.
      @return {undefined} Side-effects only, eturns nothing.
    */

In this case, the type directive is the ``@method`` one. It is placed at
the end of the comment block, because it is little more than noise
required by the YUIDoc compiler, and is best placed close to the name it
repeats.


Notes
-----

Check that the comment blocks actually appear in the generated HTML pages.
If they do not, check that the ``@class`` directives in the comment
blocks use the actual names in the code. If the class name used in the
``@class`` is not the actual one, the comment blocks in the class will
not be included in the generated HTML pages.

On the other hand, while the ``@method`` directives for actual methods
should also be the same as the method names, we also misuse that
directive in place of the not available ``@function`` one. The comment
block will appear in the HTML pages, albeit with a few not-working links.

For instance, for a closure named ``callback``, you may want to use the
``@method behaviors.timestamp.callback`` directive for greater
expressiveness.


.. _HACKING: https://github.com/juju/juju-gui/blob/develop/HACKING.rst
