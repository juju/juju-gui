#!/usr/bin/env node
'use strict';
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');
const os = require('os');

const babel = require('babel-core');
const mkdirp = require('mkdirp');
// FILE_LIST will be a space delimited list of paths that need to be built.
const FILE_LIST = process.env.FILE_LIST;
const LAST_TRANSPILE = '.last-transpile';
const rootDir = path.join(__dirname, '/../');
let fileList = null;

const plugins = [
  'transform-react-jsx'
];

// 'touch' the canary file.
const touchCanary = () => fs.writeFileSync(LAST_TRANSPILE);
// Handler for the fileWrite calls.
const writeHandler = err => { if (err) { console.log(err); } };

if (process.argv.includes('--spawned')) {
  // We're spawned so just start the work with the supplied files.
  // Grab the list of files passed.
  const passedFilesList = process.argv[process.argv.indexOf('--files')+1];
  transpile(passedFilesList.split(','));
  // We're just a worker so exit when done.
  return;
}

if (FILE_LIST) {
  fileList = FILE_LIST.split(' ');
} else {
  // If no files were provided then we need to determine what files need to be built.
  if (fs.existsSync(LAST_TRANSPILE)) {
    fileList = childProcess.execSync(`find jujugui/static/gui/src/app -type f -name "*.js" -not -path "*app/assets/javascripts/*" -cnewer ${LAST_TRANSPILE}`); //eslint-disable-line max-len
  } else {
    console.log('Building all files, no last-transpile time found.');
    fileList = childProcess.execSync('find jujugui/static/gui/src/app -type f -name "*.js" -not -path "*app/assets/javascripts/*"'); //eslint-disable-line max-len
  }
  fileList = fileList.toString().split('\n');
  // There is an extra newline at the end of the string
  fileList = fileList.slice(0, fileList.length-1);
}

if (fileList.length === 0) {
  console.log('Nothing to transpile.');
  return;
}

let cpuCount = os.cpus().length;
// Divide up the work evenly.
let spliceLength = Math.floor(fileList.length / cpuCount);
// if the spliceLength is 0 then it's less than the number of cores so we might
// as well just use this process to transpile the files.
if (spliceLength == 0) {
  const suffix = fileList.length === 1 ? 'file' : 'files';
  console.log(`Using existing process to transpile ${fileList.length} ${suffix}`);
  transpile(fileList);
  touchCanary();
  return;
}

console.log(`Spawning ${cpuCount} processes to transpile ${fileList.length} files.`);
for (let i = 1; i <= cpuCount; i+=1) {
  if (fileList.length < spliceLength || i === cpuCount) {
    spliceLength = fileList.length;
  }
  let filesSubset = fileList.splice(0, spliceLength).join(',');
  const transpiler = childProcess.spawn(
    'node', ['scripts/transpile.js', '--spawned', '--files', filesSubset]);
  const onData = data => console.log(`${data}`);
  transpiler.stdout.on('data',onData);
  transpiler.stderr.on('data', onData);
  transpiler.on('close', code => {
    console.log(`child process exited with code ${code}`);
    touchCanary();
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
      const full = babel.transform(data, { plugins, compact: false });
      fs.writeFile(fullPath, full.code, writeHandler);
      const min = babel.transform(data, {
        presets: ['babel-preset-babili'],
        plugins,
        compact: true,
        comments: false
      });
      fs.writeFile(`${fullPath.replace('.js', '-min.js')}`, min.code, writeHandler);
    });
  });
}
