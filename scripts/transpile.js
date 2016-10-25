#!/usr/bin/env node
'use strict';
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');
const os = require('os');

const babel = require('babel-cli/node_modules/babel-core');
const mkdirp = require('mkdirp');
// FILE_LIST will be a space delimited list of paths that need to be built.
const fileList = process.env.FILE_LIST.split(' ');
const rootDir = path.join(__dirname, '/../');

const plugins = [
  'transform-react-jsx'
];

if (process.argv.includes('--spawned')) {
  // We're spawned so just start the work with the supplied files.
  // Grab the list of files passed.
  const passedFilesList = process.argv[process.argv.indexOf('--files')+1];
  transpile(passedFilesList.split(','));
  // We're just a worker so exit when done.
  return;
}

let cpuCount = os.cpus().length;
// Divide up the work evenly.
let spliceLength = Math.floor(fileList.length / cpuCount);
// if the spliceLength is 0 then it's less than the number of cores so we might
// as well just use this process to transpile the files.
if (spliceLength == 0) {
  transpile(fileList);
  return;
}

for (let i = 0; i < cpuCount; i+=1) {
  if (fileList.length < spliceLength) {
    spliceLength = fileList.length;
  }
  const filesSubset = fileList.splice(0, spliceLength).join(',');
  // If this is the last loop then skip spwaning and use this instance
  // to transpile the remaining code.
  if (i === cpuCount) {
    transpile(filesSubset);
    return;
  }
  const transpiler = childProcess.spawn(
    'node', ['scripts/transpile.js', '--spawned', '--files', filesSubset]);
  const onData = data => console.log(`${data}`);
  transpiler.stdout.on('data',onData);
  transpiler.stderr.on('data', onData);
  transpiler.on('close', code => {
    console.log(`child process exited with code ${code}`);
  });
}

function transpile (fileList) {
  fileList.forEach(file => {
    const fileParts = file.split('/');
    const fileName = fileParts.pop();
    const directory = rootDir + fileParts.join('/').replace('/src/', '/build/');
    const fullPath = `${directory}/${fileName}`;

    fs.readFile(rootDir + file, {
      encoding: 'utf-8'
    }, (err, data) => {
      console.log('Transpiling', fullPath);
      mkdirp.sync(directory);
      const full = babel.transform(data, { plugins });
      fs.writeFile(fullPath, full.code);
      const min = babel.transform(data, {
        presets: ['babel-preset-babili'],
        plugins,
        compact: true,
        comments: false
      });
      fs.writeFile(`${fullPath.replace('.js', '-min.js')}`, min.code);
    });
  });
}
