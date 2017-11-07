# Juju GUI and multipass

This document describes how to set up a development environment for the Juju GUI
on macos with multipass. The *Initial setup* section must be done only once
initially. The *Working with the GUI* section describes the daily routine of
switching to GUI branches under review and QAing them.

## Initial setup

### Create an ubuntu instance

- Download and install multipass from
  <https://private-fileshare.canonical.com/~msawicz/multipass/current/>.
- Create an ubuntu instance, for example with
  `ubuntu create -n dev -c 4 -d 20G -m 8G`. This command will create an instance
  named "dev", assigning 4 cores, 20GB of disk space and 8GB of memory. Adjust
  based on your machine's specs.

### Make the instance discoverable

- In order to make the instance hostname discoverable from macos, run the
  following commands:
```shell
ubuntu exec dev -- sudo apt update
ubuntu exec dev -- sudo apt install avahi-daemon avahi-autoipd
```
- At this point you should be able to call the instance by name, for instance
  with `ping dev.local`.
- Import your SSH keys from launchpad into the instance with
  `ubuntu exec dev -- ssh-import-id {launchpad-id}`. Replace `{launchpad-id}`
  with your launchpad id, for instance mine is "frankban" (without quotes).
- At this point you should be able to ssh into the instance with
  `ssh ubuntu@dev.local`: do it!

### Set up the NFS export

- SSH into the instance with `ssh ubuntu@dev.local` as described above.
- Create a directory in which your code will live: `mkdir ~/code`.
- Install the NFS kernel support: `sudo apt install nfs-kernel-server`.
- Add the code directory to the exports and restart NFS:
```shell
sudo sh -c "echo '/home/ubuntu/code *(rw,sync,all_squash,anonuid=1000,anongid=1000)' >> /etc/exports"
sudo /etc/init.d/nfs-kernel-server restart
```
- Exit to get back to the host system (macos): you can either use `exit` or send
  the EOF signal with CTRL-D.
- Double check that the host can see the export: the command
  `showmount -e dev.local` should show an output like:
```shell
Exports list on dev.local:
/home/ubuntu/code                   *
```
- Create a directory where to mount the export: `mkdir -p ~/code/ubuntu`.
- Enable automatic mounting of this share by adding an entry to the host fstab
  file, and then mount it:
```shell
sudo sh -c "echo dev.local:/home/ubuntu/code /Users/frankban/code/ubuntu nfs resvport,rw,rsize=8192,wsize=8192,timeo=14,intr >> /etc/fstab"
sudo mount -a
```
- At this point you should have the code directory of the guest mounted in the
  host, so that you will be able, for instance, to build the GUI from the guest
  while still using your favorite visual editor for hacking in the GUI from the
  host. Try creating a file:
```shell
ssh ubuntu@dev2.local 'touch ~/code/it-works'
ll ~/code/ubuntu2/it-works # This should work.
rm ~/code/ubuntu2/it-works # Clean it up.
```

### Set up the Juju GUI

- SSH into the instance with `ssh ubuntu@dev.local`.
- Install some essential packages that will let you build the GUI:
  `sudo apt install build-essential`.
- Switch to the code directory: `cd ~/code`.
- Clone the GUI: `git clone https://github.com/juju/juju-gui.git`.
  Alternatively you can set up locally in the instance the SSH key you use with
  github and use `git clone git@github.com:juju/juju-gui.git`. Both commands
  will create a "juju-gui" directory with the git repository checked out on the
  "develop" branch, which is the main target when developing the Juju GUI.
- Switch to the GUI directory: `cd juju-gui`.
- Build the GUI: `make sysdeps gui`: the process should exit successfully after
  a while.
- Additionally, set up a git alias that will be useful later:
```shell
cat <<EOF > ~/.gitconfig
[alias]
review = "!f() { git fetch -fu origin refs/pull/\$1/head:pr/\$1 && git checkout pr/\$1; }; f"
EOF
```
  Don't worry about this for now: how to use the alias will be explained later.
  Also, feel free to edit your `~/.gitconfig` file (in both the guest and the
  host) to include your own aliases and preferred configuration.

### Install guiproxy

The guiproxy server is used to connect the GUI to a real Juju controller that
could live anywhere. As guiproxy is a Go project, installing it requires having
Go installed. That can be accomplished following the instructions below.
- Install Go and set up a GOPATH environment variable:
```shell
sudo apt install golang-go
echo -e '\nexport GOPATH=$HOME/code/go\nexport PATH=$PATH:$GOROOT/bin:$GOPATH/bin\n' >> ~/.bashrc
. ~/.bashrc
```
- Install guiproxy with `go get github.com/juju/guiproxy`.
- Double check guiproxy is correctly installed with `guiproxy -version`: you
  should have at least version 0.7.5.

## Working with the GUI

As mentioned, while development can be done using your favorite macos editor
(if you wish), the GUI can be run exclusively from ubuntu. So, from now on, this
document assumes you are working from inside the dev instance. As usual, to run
commands in the instance, you first need to SSH into it with
`ssh ubuntu@dev.local`.

### Switching between develop branch and branches under review

The GUI branch used for development is called "develop". New branches are
created based on "develop" in order to add features or fix bugs, then proposed
for merging into "develop". When a pull request is created on github, reviewing
and QAing the branch is required before we can land the change. A github pull
request is identified by a numeric id, which is visible in both the github URL
(for instance <https://github.com/juju/juju-gui/pull/4247>) and the page (close
to the PR title). The instructions below refer to this id as the `{PR id}`.

- Move to the GUI directory: `cd ~/code/juju-gui`.
- To switch to a branch currently on review (in order to QA it, hack with the
  code, or review the changes locally), run `git review {PR id}`. For instance,
  try `git review 3297`: at this point `git log` should show that the last log
  is "Allow a custom jujushell url to be provided as a config." from Jeff
  Pihach. This means that you successfully checked out the branch Jeff proposed:
  in this case it is code that's already merged into develop, but for pending
  pull requests the process is the same. Continue reading for instructions on
  how to actually run your current branch.
- To switch back to latest "develop", do the following:
```shell
git checkout develop
git pull origin
```

### Running the GUI against production JAAS

- Move to the GUI directory: `cd ~/code/juju-gui`.
- Check out the branch you want to run as described above.
- Run `make clean-all run`, and wait for the process to complete: thousands of
  node modules will be installed (typical npm), the GUI files will be babelified
  (no, it's not a real word...) and then the process will complete with a
  "serving on http://0.0.0.0:6543" (or similar) message. At this point the GUI
  is built and assets are being served by a static HTTP server that can be
  stopped by pressing CTRL-C. This server has the ability to automatically
  rebuild GUI assets each time a code change is detected; it could take a couple
  of seconds sometimes, check its output!
- In another terminal tab, ssh into the dev instance again, and run guiproxy:
  `guiproxy -env prod`. The proxy will start and suggest to you a set of URLs to
  use for opening the GUI, something like
```shell
2017/11/07 11:19:10 visit the GUI at any of the following addresses:
  http://127.0.0.1:8042/
  http://192.168.64.7:8042/
```
  Do not use the localhost URL (it will only work from inside the instance);
  select a URL that can be reached from the macos host instead, and point your
  favorite browser to it: you'll get access to the GUI and it will be connected
  to the production JAAS, because we are running guiproxy with `-env prod`.
  CTRL-C is used to quit guiproxy as well.

### Advanced guiproxy

Try `guiproxy -h` for a list of parameters you can pass. Often new GUI features
under review can only be accessed by enabling one or more specific feature
flags, and this can be done with the `-flags` parameter, for instance with
`guiproxy -env staging -flags greens,blues`. The default GUI configuration
values can be overridden/extended with the `-config` parameter.
