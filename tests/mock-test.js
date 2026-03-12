// Real automated tests for DYKCore logic
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Image = dom.window.Image;
global.jQuery = require('jquery')(dom.window);
global.$ = global.jQuery;

// Mock MediaWiki API
global.mw = {
  config: {
    get: (key) => {
      if (key === 'wgUserName') return 'TestUser';
      return '';
    }
  },
  Api: class Api {
    constructor() {}
    async get(params) {
      if (params.action === 'query' && params.titles === 'ExistPage') {
        return { query: { pages: [{ pageid: 1, ns: 0, title: 'ExistPage' }] } };
      }
      if (params.action === 'query' && params.titles === 'MissingPage') {
        return { query: { pages: [{ missing: true }] } };
      }
      return { query: { pages: [] } };
    }
    async post(params) {
      return { parse: { text: { '*': '<p>Preview HTML</p>' } } };
    }
    async postWithEditToken(params) {
      return { edit: { result: 'Success' } };
    }
  }
};

// Load DYKCore
const DYKCore = require('../src/dyk-core');

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    console.error('FAILED:', message);
    process.exit(1);
  }
  console.log('PASSED:', message);
}

async function runTests() {
  console.log('Running DYKCore tests...');

  // Test: toBengaliDigits
  assert(DYKCore.toBengaliDigits(123) === '১২৩', 'toBengaliDigits converts English numbers to Bengali');
  assert(DYKCore.toBengaliDigits(2026) === '২০২৬', 'toBengaliDigits converts English years to Bengali');

  // Test: generateWikitext
  const testData = {
    article: 'Test Article',
    mainHook: 'this is a test hook',
    altHooks: ['alternative hook'],
    image: 'Test.jpg',
    caption: 'Test Caption',
    status: 'নতুন',
    nominator: 'TestUser',
    articleCreator: 'TestUser'
  };
  const wikitext = DYKCore.generateWikitext(testData);
  assert(wikitext.includes('== Test Article =='), 'Wikitext includes article title');
  assert(wikitext.includes('*...this is a test hook?'), 'Wikitext includes main hook');
  assert(wikitext.includes('**\'\'\'বিকল্প:\'\'\' ...alternative hook?'), 'Wikitext includes alternative hook');
  assert(wikitext.includes('[[File:Test.jpg|100x100px|Test Caption]]'), 'Wikitext includes image and caption');
  assert(wikitext.includes('স্বমনোনীত;'), 'Wikitext handles self-nomination correctly');

  // Test: checkPageExists (Async)
  const existResult = await DYKCore.checkPageExists('ExistPage');
  assert(existResult.exists === true, 'checkPageExists identifies existing pages');

  const missingResult = await DYKCore.checkPageExists('MissingPage');
  assert(missingResult.exists === false, 'checkPageExists identifies missing pages');

  console.log('\nAll tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test suite failed with error:', err);
  process.exit(1);
});
