'use strict';

const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
// const chai = require('chai');
// const chaiEnzyme = require('chai-enzyme');


Enzyme.configure({ adapter: new Adapter() });
// chai.use(chaiEnzyme());
