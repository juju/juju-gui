#/bin/sh
nova --no-cache image-list |grep ubuntu-precise-12.04-amd64-server |tail -1 |awk '{print $2}'
