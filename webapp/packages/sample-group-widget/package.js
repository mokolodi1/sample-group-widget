Package.describe({
  name: 'medbook:sample-group-widget',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'a sample group widget',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: null
});

Package.onUse(function(api) {
  api.versionsFrom("1.1.0.3");

  api.use([
    "medbook:namespace@0.0.2",
    "medbook:collaborations@2.3.4",
    "medbook:primary-collections@0.0.15",
    "mokolodi1:helpers@0.0.9",
    "sacha:spin@2.3.1",
    "twbs:bootstrap@3.3.6",
    "aldeed:template-extension@4.0.0",
    "aldeed:simple-schema@1.3.3",
  ]);
  api.use("templating", "client");

  api.addFiles([
    "sampleGroupSelector.html",
    "sampleGroupSelector.js",
  ], "client");

  api.addFiles([
    "methods.js",
    "publications.js",
  ], "server");
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('medbook:sample-group-widget');
  api.addFiles('sample-groups-tests.js');
});
