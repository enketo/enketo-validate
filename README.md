![coverage-shield-badge-1](https://img.shields.io/badge/coverage-95.78%25-brightgreen.svg)
[![npm version](https://badge.fury.io/js/enketo-validate.svg)](http://badge.fury.io/js/enketo-validate) [![Build Status](https://travis-ci.org/enketo/enketo-validate.svg?branch=master)](https://travis-ci.org/enketo/enketo-validate) [![Dependency Status](https://david-dm.org/enketo/enketo-validate/status.svg)](https://david-dm.org/enketo/enketo-validate) [![devDependency Status](https://david-dm.org/enketo/enketo-validate/dev-status.svg)](https://david-dm.org/enketo/enketo-validate?type=dev)

Enketo Validate
==============

_Validate [ODK XForms](https://opendatakit.github.io/xforms-spec/) using Enketo's form engine_

This app can be used:

1. via the command-line, e.g. in a non-javascript form builder such as [pyxform](https://github.com/XLSForm/pyxform).
2. as a nodeJS module to be used in your own javascript application

Live demo web application (meant for testing purposes only) that uses Enketo Validate (and ODK Validate) as a module: [validate.enketo.org](https://validate.enketo.org) \([source code](https://github.com/enketo/enketo-validate-webapp)\)


**[Technical Documentation](https://enketo.github.io/enketo-validate)**


## Prerequisites

1. install nodeJS 8+
2. install build tools for native modules with `apt-get install build-essential`

## Via Command-line

#### Command-line Install

To make the `enketo-validate` command available from any folder on your machine.
```bash
$ npm install -g --production enketo-validate`
```

Alternatively, you can clone the repo and run `npm install --production`. This will make the `./validate` command available from within the clone folder. Running `npm link` makes the `enketo-validate` command available from any folder on your machine.

#### Command-line Use

```bash
$ enketo-validate path/to/form.xml
```

Errors are returned to `stderr` and warnings to `stdout`. If there is no `stderr` output the form is valid.

#### Command-line Help
```bash
$ enketo-validate --help
```

#### Command-line update

1. `npm install -g --production enketo-validate`

## As NodeJS module

#### Module installation

```bash
npm install enketo-validate --save
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

## How it works

In it's current iteration, the validator does the following:

* It checks whether the XForm is a valid XML document.
* It performs some basic ODK XForm structure checks.
* It checks if each bind `nodeset` exists in the primary instance.
* It checks if appearance values are supported for that type of question.
* It checks for each `<bind>` whether the `relevant`, `constraint`, `calculate`, and `required` expressions are supported and valid\* XPath.
* It checks whether required `<label>` elements exist.

\* Note, that `/path/to/nonexisting/node` is perfectly valid XPath.

## Funding

The development of this application was funded by [OpenClinica](https://openclinica.com).

## License

See [the license document](https://github.com/enketo/enketo-validate/blob/master/LICENSE) for this application's license.

## Change log

See [change log](https://github.com/enketo/enketo-validate/blob/master/CHANGELOG.md)
