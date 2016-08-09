#!/usr/bin/env node
'use strict';
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const babel = require('babel-core');
// FILE_LIST will be a space delimited list of paths that need to be built.
const fileList = process.env.FILE_LIST.split(' ');
const rootDir = path.join(__dirname, '/../');

const plugins = [
  'transform-react-jsx',
  'transform-es2015-template-literals',
  'transform-es2015-function-name',
  'transform-es2015-arrow-functions',
  'transform-es2015-block-scoped-functions',
  'transform-es2015-shorthand-properties',
  'transform-es2015-destructuring',
  'transform-es2015-parameters',
  'transform-es2015-block-scoping'
];

fileList.forEach(file => {
  const fileParts = file.split('/');
  const fileName = fileParts.pop();
  const directory = rootDir + fileParts.join('/').replace('/src/', '/build/');
  const fullPath = `${directory}/${fileName}`;

  fs.readFile(rootDir + file, {
    encoding: 'utf-8'
  }, (err, data) => {
    console.log('Transpiling', fullPath);
    childProcess.execSync('mkdir -p ' + directory);
    const full = babel.transform(data, { plugins });
    fs.writeFile(fullPath, full.code);
    const min = babel.transform(data, {
      plugins,
      compact: true,
      comments: false
    });
    fs.writeFile(`${fullPath.replace('.js', '-min.js')}`, min.code);
  });
});
