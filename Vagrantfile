# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # Every Vagrant virtual environment requires a box image to base.  Use a 64bit
  # box from the latest Ubuntu release; if it does not exist, vagrant up will
  # fetch a box and name it properly.
  config.vm.box = "ubuntu/trusty64"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  config.vm.network :private_network, ip: "192.168.33.10"

  # Provision with dependencies.
  config.vm.provision :shell, :path => "install-sysdeps.sh"

  config.vm.synced_folder ENV['HOME'], "/vagrant", type: "nfs"

  config.vm.provider :virtualbox do |vb|
    vb.memory = 1024
    vb.name = "Juju GUI Vagrant"
  end

  config.ssh.forward_agent = true
end
