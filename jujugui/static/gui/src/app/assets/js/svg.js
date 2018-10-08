// This file is used to load the svg sprites into the template.

const sprite = require('../stack/svg/sprite.css.svg');

const node = document.createElement('div');
node.innerHTML = sprite;
document.querySelector('#svg-sprite').appendChild(node);
