var selectedStudySchema = new SimpleSchema({
  study_label: { type: String },
  total_samples_count: { type: Number, optional: true },
  filtered_samples: { // I'll check this later
    type: [Object],
    blackbox: true,
    optional: true
  },
  filtered_samples_count: { type: Number, optional: true },
  filters: {
    type: [Object],
    optional: true, // not present ==> include all samples in a study
    blackbox: true, // XXX: scary but it's all right for now
  },
});

Meteor.methods({
  "/sampleGroupWidget/upsert": function (sampleGroup) {
    check(sampleGroup, new SimpleSchema({
      sample_group_label: { type: String },
      selected_studies: { type: [selectedStudySchema] },
    }));

    var user = MedBook.ensureUser(Meteor.userId());

    if (sampleGroup.sample_group_label.length === 0) {
      return new Meteor.Error("sample group name cannot be empty");
    }

    // figure out the version for the new one
    var sample_group_version = 1;
    var lastVersion = SampleGroups.findOne({
      sample_group_label: sampleGroup.sample_group_label
      // TODO: add security
    }, { sort: { sample_group_version: -1 } });
    if (lastVersion) {
      sample_group_version = lastVersion.sample_group_version + 1;
    }

    // verify that all the selected studies are okay (security, update samples)
    _.each(sampleGroup.selected_studies, function (selectedStudy, index) {
      var updatedCurrent = Meteor.call("/sampleGroupWidget/updateFilter",
          _.pick(selectedStudy, "study_label", "filters"));
      sampleGroup.selected_studies[index] = updatedCurrent;
    });

    // do a _.uniq on objects: fun fun fun
    var samples = [];
    _.each(sampleGroup.selected_studies, function (selectedStudy) {
      samples = samples.concat(selectedStudy.filtered_samples);
    });

    // sort the samples
    samples.sort(function (first, second) {
      if (first.study_label === second.study_label) {
        return first.sample_label > second.sample_label;
      }
      return first.study_label > second.study_label;
    });

    samples = _.uniq(samples, true, function (sample) {
      // technically breakable but good enough for now :D
      return sample.study_label + "$(#*@&)" + sample.sample_label;
    });

    if (samples.length === 0) {
      return new Meteor.Error("cannot create a sample group with 0 samples");
    }

    _.extend(sampleGroup, {
      collaborations: [user.collaborations.personal],
      sample_group_version: sample_group_version,
      samples: samples,
    });

    var newId = SampleGroups.insert(sampleGroup);
    return SampleGroups.findOne(newId);
  },
  "/sampleGroupWidget/updateFilter": function (selectedStudy) {
    // Takes a selectedStudy and applies filters. Returns full selectedStudy

    check(selectedStudy, selectedStudySchema);

    var user = MedBook.ensureUser(Meteor.userId());
    var study = Studies.findOne({id: selectedStudy.study_label});
    user.ensureAccess(study);

    // TODO: add filters

    var query = {
      study_label: selectedStudy.study_label
    };
    var total_samples_count = Samples.find(query).count();

    // TODO: add filters to the query

    var filtered_samples = Samples.find(query, {
      fields: {
        study_label: 1,
        sample_label: 1,
        patient_label: 1,
      }
    }).map(function (doc) {
      return _.omit(doc, "_id");
    });

    return _.extend(selectedStudy, {
      total_samples_count: total_samples_count,
      filtered_samples: filtered_samples,
    });
  },
  "/sampleGroupWidget/removeSampleGroup": function (sampleGroupId) {
    check(sampleGroupId, String);

    var user = MedBook.ensureUser(Meteor.userId());
    var sampleGroup = SampleGroups.findOne(sampleGroupId);
    user.ensureAccess(sampleGroup);

    SampleGroups.remove(sampleGroupId);
  },
});
