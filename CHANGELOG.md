## Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

[Unreleased]
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
