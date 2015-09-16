# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
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
    vb.cpus = 2
    vb.memory = 2048
    vb.name = "Juju GUI Vagrant"
  end

  config.ssh.forward_agent = true
end
