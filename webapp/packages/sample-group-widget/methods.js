Meteor.methods({
  "/sampleGroupSelector/upsert": function (sampleGroup) {
    var user = findUser(Meteor.userId());

    // TODO: user security

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
      var updatedCurrent = Meteor.call("/sampleGroupSelector/updateFilter",
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
      user_id: Meteor.userId(),
      collaborations: [user.collaborations.personal],
      sample_group_version: sample_group_version,
      samples: samples,
    });

    var newId = SampleGroups.insert(sampleGroup);
    return SampleGroups.findOne(newId);
  },
  "/sampleGroupSelector/updateFilter": function (selectedStudy) {
    // Takes a selectedStudy and applies filters. Returns full selectedStudy

    check(selectedStudy, new SimpleSchema({
      study_label: { type: String },
      filters: {
        type: [Object],
        optional: true, // not present ==> include all samples in a study
        blackbox: true, // XXX: scary but it's all right
      },
    }));

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
});
