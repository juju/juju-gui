#!/usr/bin/env node
'use strict';
/* eslint-disable max-len */

/*
  Builds the tarball in the format that is expected by the Juju Controller.
  https://github.com/juju/juju/blob/70253d19ae06e67a64a066ddc3a220aeb5e788d3/apiserver/gui.go#L43
*/

const {execSync} = require('child_process');
const fs = require('fs');

const version = JSON.parse(fs.readFileSync('package.json')).version;
const baseName = `jujugui-${version}`;
const fullpath = `dist/${baseName}.tar.bz2`;

console.log('Generating GUI distribution for Juju core.');
console.log(`Version: ${version}`);
console.log(`Path: ${fullpath}`);


if (fs.existsSync(fullpath)) {
  console.log('\nError: dist file already exists\n');
  return;
}

/*
  The following commented out command should be all that's necessary however
  there appears to be an issue with using --transform when generating a tar
  and how the golang stdlib parses the folder structure. This prevents it from
  successfully determining the version number from the folder structure.
  Resulting in us needing to copy the values into a temporary folder structure.
*/
// const command = `tar -jcvf ${fullpath} --transform 's,^,${baseName}/jujugui/,' templates static`;

const basePath = `dist/${baseName}/jujugui`;
fs.mkdirSync(basePath, {recursive: true});

execSync(`cp -r templates ${basePath}`);
execSync(`cp -r static ${basePath}`);

const command = `tar -jcvf ${fullpath} -C dist ${baseName}`;
execSync(command);
