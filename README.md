[![npm version](https://badge.fury.io/js/enketo-validate.svg)](http://badge.fury.io/js/enketo-validate) ![Build Status](https://github.com/enketo/enketo-validate/actions/workflows/ci.yml/badge.svg)

Enketo Validate
==============

_Validate [ODK XForms](https://opendatakit.github.io/xforms-spec/) using Enketo's form engine_

This app can be used:

1. via the command-line
2. as a nodeJS module to be used in your own javascript application

Live demo web application (meant for testing purposes only) that uses Enketo Validate (and ODK Validate) as a module: [validate.enketo.org](https://validate.enketo.org) \([source code](https://github.com/enketo/enketo-validate-webapp)\)


**[Technical Documentation](https://enketo.github.io/enketo-validate)**

## Prerequisites

1. install Node 18 or 20 and Yarn 1 ("classic")
2. (if necessary) install build tools for native modules with `apt-get install build-essential`
3. (if necessary) install puppeteer (headless Chrome) prerequisites as mentioned [here](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix), e.g. for Ubuntu/Debian do `apt-get install ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils`

## Via Command-line

#### Command-line Install

Clone the repo and run `yarn install --production`. This will make the `./validate` command available from within the clone folder. Running `yarn link` makes the `enketo-validate` command available from any folder on your machine.

#### Command-line Use

```bash
$ enketo-validate path/to/form.xml
```

Errors are returned to `stderr` and warnings to `stdout`. If there is no `stderr` output the form is valid.

#### Command-line Help
```bash
$ enketo-validate --help
```

## As NodeJS module

#### Module installation

Add the following yarn resolutions to package.json:

```json
"resolutions": {
    "nan": "^2.17.0",
    "libxslt/nan": "^2.17.0",
    "node1-libxmljsmt-myh/nan": "^2.17.0"
},
```

```bash
yarn add enketo-validate
```

#### Module Use

```js
const validator = require('enketo-validate');

// Options:
// debug: [boolean] outputs unadulterated errors instead of cleaned ones
// openclinica: [boolean] runs the validator in a special OpenClinica mode
const options = {};

// Read the xform as string
const result = validator.validate( xformStr, options );

// The result has the following format:
// {
//      warnings: [ 'a warning', 'another warning'],
//      errors: ['an error', 'another error'],
//      version: "0.0.0"
// }
// if errors.length is 0, the form passed validation
```

## Develop

1. Clone repo and install [prerequisites](#prerequisites).
2. Run `yarn install`. If there is an error the first thing to do is to run `rm -R node_modules` and retry especially after changing Node versions or after earlier crashes during installation.
3. Run via command line, e.g. `./validate test/xform/xpath-fails.xml` or `./validate --help`.

## How it works

In it's current iteration, the validator does the following:

* It checks whether the XForm is a valid XML document.
* It performs some elementary ODK XForm structure checks.
* It checks if each bind `nodeset` exists in the primary instance.
* It checks if appearance values are supported or deprecated for that type of question.
* It checks for each `<bind>` whether the `relevant`, `constraint`, `calculate`, and `required` expressions are supported and valid\* XPath.
* It checks whether required `<label>` elements exist.
* It checks for duplicate question or group names.
* It checks for nested repeats.
* It checks for form controls that have a calculation but are not set as readonly.

\* Note, that `/path/to/a/nonexisting/node` is perfectly valid XPath.

## Funding

The development of this application was funded by [OpenClinica](https://openclinica.com).

## License

See [the license document](https://github.com/enketo/enketo-validate/blob/master/LICENSE) for this application's license.

## Change log

See [change log](https://github.com/enketo/enketo-validate/blob/master/CHANGELOG.md).
