const {join} = require('path');

const CI = !!process.env.CI
console.log(process.env.CI, CI)

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // On CI, cache puppeteer in a Github-cache-able location.
  ...(CI ? {cacheDirectory: join(__dirname, '.cache', 'puppeteer')} : {})
};
