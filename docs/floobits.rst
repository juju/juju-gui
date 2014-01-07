===================
Setting up Floobits
===================

General setup
=============

First, create an account at https://floobits.com/.


Vim
===

Building the Floobits forked Vim
--------------------------------

As of the time of this writing, good Floobits integration requires a
custom-built Vim.  To build a Vim that works well with Floobits do the
following::

    sudo apt-get build-dep vim
    svn co https://github.com/Floobits/vim/trunk
    cd trunk
    ./configure --with-features=big --enable-pythoninterp --enable-gui=auto \
        --enable-cscope
    make

Vim behaves differently depending on the executable name, so linking the
executable to "gvim" is an easy way to start a GUI Vim::

    ln src/vim src/gvim


Missing runtime files
---------------------

If you see this error message when starting Vim it is because the
Vim runtime files are in a non-stock location::

    E484: Can't open file /usr/local/share/vim/syntax/syntax.vim

Because Ubutnu packagers changed the location of Vim's runtime files,
you have to tell the stock Vim where to find them when running Vim::

    VIMRUNTIME=/usr/share/vim/vim73/ src/vim

or to run GVim::

    VIMRUNTIME=/usr/share/vim/vim73/ src/gvim


This environment varaible is safe to add to your .bashrc/.zshrc or other
system configuration.


Installing the plugin
---------------------

The forked Vim does not include the Floobits functionality, just the
infrastructure for it to work.  Instead you'll have to install the
Floobits plugin.

The easiest way is to first install Pathogen
(https://github.com/tpope/vim-pathogen) and then install the plugin as
described at https://floobits.com/help/plugins/vim#install.


Using Floobits
--------------

The commands to create, join, and leave a shared worspace and the
all-important FlooToggleFollowMode are listed at
https://floobits.com/help/plugins/vim#usage.
