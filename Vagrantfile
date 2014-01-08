# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Every Vagrant virtual environment requires a box to build off of.  Use a
  # raring 64bit box; if it does not exist, vagrant up will fetch a box and
  # name it properly.
  config.vm.box = "raring64"

  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  # See https://bugs.launchpad.net/ubuntu/+source/virtualbox/+bug/1252872 for
  # why we need to use Raring.
  config.vm.box_url = "http://cloud-images.ubuntu.com/vagrant/raring/current/raring-server-cloudimg-amd64-vagrant-disk1.box"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  config.vm.network :private_network, ip: "192.168.33.10"

  # Provision with dependencies.
  config.vm.provision :shell, :path => "vagrant-provision.sh"

  config.vm.provider :virtualbox do |vb|
    vb.memory = 1024
  end
end
