Enketo Validate [![npm version](https://badge.fury.io/js/enketo-validate.svg)](http://badge.fury.io/js/enketo-validate) [![Build Status](https://travis-ci.org/enketo/enketo-validate.svg?branch=master)](https://travis-ci.org/enketo/enketo-validate) [![Dependency Status](https://david-dm.org/enketo/enketo-validate/status.svg)](https://david-dm.org/enketo/enketo-validate) [![devDependency Status](https://david-dm.org/enketo/enketo-validate/dev-status.svg)](https://david-dm.org/enketo/enketo-validate?type=dev)
==============

_Validate [ODK XForms](https://opendatakit.github.io/xforms-spec/) using Enketo's form engine_

This app can be used:

1. via the command-line, e.g. in a non-javascript form builder such as [pyxform](https://github.com/XLSForm/pyxform).
2. as a nodeJS module to be used in your own javascript application

Live demo web application (meant for testing purposes only) that uses Enketo Validate (and ODK Validate) as a module: [validate.enketo.org](https://validate.enketo.org) \([source code](https://github.com/enketo/enketo-validate-webapp)\)

### Via Command-line

#### Command-line Install

1. install nodeJS 6+
2. clone repo 
3. `npm install --production`

#### Command-line Use

```bash
$ ./validate ~/myform.xml
```

#### Command-line Help
```bash
$ ./validate --help
```

### As NodeJS module

#### Module installation 

```bash
npm install enketo-validate --save
```

#### Module Use

```js
const validator = require('enketo-validate');

// read the xform as string

let result = validator.validate( xformStr );

// The result has the following format:
// {
//      warnings: [ 'a warning', 'another warning'],
//      errors: ['an error', 'another error']
// }
// if errors.length is 0, the form passed validation
```

### How it works

In it's current iteration, the validator does the following:

* It checks whether the XForm is a valid XML document.
* It performs some basic ODK XForm structure checks.
* It checks if each bind `nodeset` exists in the primary instance.
* It checks for each `<bind>` whether the `relevant`, `constraint`, `calculate`, and `required` expressions are supported and valid\* XPath.

\* Note, that `/path/to/nonexisting/node` is perfectly valid XPath.

In the future, some ideas to extend validation further are:

* Check itemsets.
* Check more thoroughly whether XForms syntax is valid using an XML Schema.
* Check whether all itext elements referred to anywhere exist in model.

### Using a custom XPath Evaluator

The following example shows how to swap Enketo's XPath evaluator with OpenClinica's custom XPath evaluator in command-line mode:

1. Instead of using `npm install --production` do `npm install` which which will also install devDepencies.
2. Run `npm run oc-build`. This will replace the bundle file in the /build folder.

### Funding

The development of this application was funded by [OpenClinica](https://openclinica.com). 

### License

See [the license document](LICENSE) for this application's license.

### Change log

See [change log](./CHANGELOG.md)
