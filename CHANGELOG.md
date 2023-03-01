## Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

[2.1.2] - 2023-03-01
--------------------------
##### Changed
- Updated dependencies.

[2.1.1] - 2023-02-03
--------------------------
##### Changed
- Updated dependencies.

[2.1.0] - 2023-02-03
--------------------------
##### Added
- Check for missing value elements in choice options.
- Check that only one of OpenClinica's _external signature_ questions are present.
- Check that value of OpenClinica's _external signature_ question is "1".

[2.0.1] - 2022-11-07
--------------------------
##### Changed
- The wording of the error message for OpenClinica's _external signature_ feature.

[2.0.0] - 2022-09-21
--------------------------
##### Changed
- No longer compatible with node 12
- Updated dependencies

[1.15.3] - 2022-09-21
--------------------------
##### Fixed
- Not working in Node 12

[1.15.2] - 2022-09-07
--------------------------
##### Added
- Check for repeats with w-values less than w4.

##### Changed
- Tweaked error/warning output messages to use "group" and "repeat" instead of "question" for issues with appearances.

[1.15.1] - 2022-07-28
-------------------------
##### Added
- Check for a custom OpenClinica _external signature_ feature.

##### Changed
- Updated dependencies

[1.15.0] - 2022-05-30
-------------------------
##### Added
- Basic checks to catch common XLSForm authoring mistakes when adding a value to the wrong column or misspelling a value.

##### Changed
- Updated dependencies

##### Removed
- Binary building.

[1.14.2] - 2022-02-11
---------------------
##### Changed
- Updated dependencies.

[1.14.1] - 2021-10-27
---------------------
##### Changed
- Updated dependencies.

[1.14.0] - 2021-08-05
---------------------
##### Added
- Output error in openclinica mode when last-saved feature is used.

##### Fixed
- Various XPath issues by updating enketo-core.

[1.13.1] - 2021-04-21
---------------------
##### Fixed
- Various XPath issues by updating enketo-core.

[1.13.0] - 2021-04-06
---------------------
##### Changed
- Updated to Enketo Core with new XPath evaluator.

[1.12.2] - 2021-03-04
---------------------
##### Changed
- Temporarily allow missing `<label>` element if a hint is present.

[1.12.1] - 2021-01-21
---------------------
##### Changed
- In OpenClinica mode, `instance('clinicaldata')` queries as part of a setvalue action are also considered valid.

##### Fixed
- In OpenClinica mode, some errors output question "null" instead of the question name.

[1.12.0] - 2020-10-16
---------------------
##### Added
- A check for search() appearance usage.
- A check for external app "ex:" appearance or intent attribute usage.
- A check for validity of setvalue logic.
- OpenClinica mode checks for validity of custom multiple constraints.
- A check for new analog-scale disallowed appearance combinations.

##### Changed
- Some previously reported warnings are now reported as errors.

##### Fixed
- The 'calculation-without-readonly' error message shows "null" as question name.

[1.11.1] - 2020-08-21
---------------------
##### Added
- Duration field to module response.

##### Fixed
- Path error when using library in an app such as enketo-validate-webapp.

[1.11.0] - 2020-07-31
----------------------
##### Changed
- Switched to using puppeteer to evaluate XPath (major).

##### Fixed
- Binary builds for Mac OS and Linux
- Some forms containing nodenames starting with an underscore crash the app.

[1.10.2] - 2020-05-28
---------------------
##### Changed
- Improved performance of check to see if bind has matching model node.

##### Fixed
- Forms with repeat templates without a first instance of those repeats, report false warning for missing model nodes.

[1.10.1] - 2020-05-22
---------------------
##### Changed
- In OC mode appearance errors are no output as warnings.
- In OC mode deprecated appearance warnings are no longer suppressed.

##### Fixed
- False warning for "field-list" appearance on repeat.
- False warning for w-value appearance on repeat.
- Unhelpful warning when using "horizontal" appearance on select/select1.

[1.9.2] - 2020-05-01
---------------------
##### Fixed
- Setvalue elements are incorrectly reported as errors because they have no label.

[1.9.1] - 2020-04-27
---------------------
##### Fixed
- Empty external instance is output as an error.

[1.9.0] - 2020-04-27
---------------------
##### Changed
- Updated libxslt, enketo-core and other dependencies. **WARNING: NodeJS 12 is required now**

##### Fixed
- Falsely detects nested repeats for sibling repeats where one repeat nodeName starts with the nodeName of another repeat.

[1.8.1] - 2019-11-06
---------------------
##### Changed
- Updated Enketo-core engine and OpenClinica XPath extensions.
- Always try to evaluate expressions even if XForm structure errors were found.

[1.8.0] - 2019-09-12
---------------------
##### Added
- Check for duplicate question/group names (warning).
- Check for nested repeats (warning).

[1.7.0] - 2019-08-02
---------------------
##### Added
- Check for missing label elements.

##### Changed
- Updated appearances rules with new columns, columns-pack, no-buttons etc.

[1.6.1] - 2019-07-24
---------------------
##### Changed
- Updated form engine and other dependencies.

[1.6.0] - 2019-02-21
---------------------
##### Removed
- Badly broken self-reference check.

[1.5.1] - 2018-12-22
---------------------
##### Fixed
- Installation of this library with `npm install enketo-validate` fails.

[1.5.0] - 2018-12-21
---------------------
##### Added
- Detect disallowed logic references to node itself.

#### Changed
- Added version property to CommonJS module validation output.
- Updated to Enketo Core 5.0.x

[1.4.0] - 2018-06-13
--------------------
##### Added
- Version property to CommonJS module.
- Validation for appearances that depend on other appearances.

##### Changed
- Ignore deprecated appearance usage errors in --oc mode.
- No longer providing final 'Valid' or 'Invalid' line in output in --oc mode.

##### Fixed
- Analog-scale appearance outputs warning.
- False error for repeat without ref attribute.

[1.3.0] - 2018-06-07
---------------------
###### Added
- Appearance validation.

###### Changed
- Updated Enketo libraries.

[1.2.2] - 2018-05-01
---------------------
##### Changed
- Updated Enketo libraries.

[1.2.1] - 2018-02-15
---------------------
##### Fixed
- Complex jr:choice-name() calls are not properly ignored causing false errors to be shown.

[1.2.0] - 2018-01-31
---------------------
##### Added
- Custom OC rule for binds with oc:external="clinicaldata".

[1.1.0] - 2018-01-30
---------------------
##### Removed
- Separate OC build

##### Added
- Custom OC rule for external clinical data.
- Rule to require calculations without form control to have readonly="true" attribute.

##### Changed
- The `--oc` flag will now run all OC customizations. No separate build/binary required any more.

[1.0.3] - 2017-01-03
---------------------
##### Changed
- Executable-friendly version of enketo-xslt

##### Fixed
- Cannot build on Windows

[1.0.2] - 2017-12-20
---------------------
##### Changed
- Minor syntax changes.

[1.0.1] - 2017-12-19
---------------------
##### Fixed
- Empty file should output stderr instead of stdout.


[1.0.0] - 2017-12-18
---------------------
##### Added
- First published version.
