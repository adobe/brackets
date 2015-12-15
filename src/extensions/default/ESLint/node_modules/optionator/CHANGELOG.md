# 0.6.0
- added `defaults` lib-option flag, allowing one to set default properties for all options
- added `concatRepeatedArrays` and `mergeRepeatedObjects` as option level properties, allowing you to turn this feature on for specific options only

# 0.5.0
- `Boolean` flags with `default: 'true'`, and no short aliases, will by default show the `--no` version in help

# 0.4.0
- add `mergeRepeatedObjects` setting

# 0.3.0
- add `concatRepeatedArrays` setting
- add `overrideRequired` option setting
- use just Levenshtein string compare algo rather than Levenshtein Damerau to due dependency license issue

# 0.2.2
- bug fixes

# 0.2.1
- improved interpolation
- added changelog

# 0.2.0
- add dependency checks to options - added `dependsOn` as an option property
- add interpolation for `prepend` and `append` text with new `generateHelp` option, `interpolate`

# 0.1.1
- update dependencies

# 0.1.0
- initial release
