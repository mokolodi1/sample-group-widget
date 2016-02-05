// Template.sampleGroupSelector

Template.sampleGroupSelector.onCreated(function () {
  var instance = this;

  instance.selectedTab = new ReactiveVar("existing");

  // set the reactiveSampleGroup to whatever was in the Session variable before
  var seedSampleGroup = Session.get(instance.data);
  if (!seedSampleGroup) {
    // start with a blank one
    seedSampleGroup = {};
  }
  instance.reactiveSampleGroup = new ReactiveVar(seedSampleGroup);

  instance.autorun(function () {
    Session.set(instance.data, instance.reactiveSampleGroup.get());
  });
});

Template.sampleGroupSelector.helpers({
  selectedTab: function () {
    return Template.instance().selectedTab.get();
  },
  activeIfSelected: function (tabString) {
    if (Template.instance().selectedTab.get() === tabString) {
      return "active";
    }
  },
  reactiveSampleGroup: function () {
    return Template.instance().reactiveSampleGroup;
  },
});

Template.sampleGroupSelector.events({
  "click .sampleGroupSelector-existing": function (event, instance) {
    instance.selectedTab.set("existing");
  },
  "click .sampleGroupSelector-create": function (event, instance) {
    instance.selectedTab.set("create");
  },
});

// Template.existingSampleGroups

Template.existingSampleGroups.onCreated(function () {
  var instance = this;

  instance.subscribe("/sampleGroupSelector/sampleGroups");

  var selectedId = instance.data.get()._id;
  if (!selectedId) {
    selectedId = Session.get(instance.parent().data + "-selectedId");
  }
  instance.selectedId = new ReactiveVar(selectedId);

  instance.autorun(function () {
    instance.data.set(SampleGroups.findOne(instance.selectedId.get()));
  });
});

Template.existingSampleGroups.onDestroyed(function () {
  var instance = this;
  Session.set(instance.parent().data + "-selectedId", instance.selectedId.get());
});

Template.existingSampleGroups.helpers({
  getSampleGroups: function () {
    return SampleGroups.find({}, {
      sort: {
        date_created: -1
      }
    });
  },
  activeIfSelected: function () {
    if (this._id === Template.instance().selectedId.get()) {
      return "active";
    }
  },
});

Template.existingSampleGroups.events({
  "click .sampleGroupSelector-select-sample-group": function (event, instance) {
    instance.selectedId.set(this._id);
  },
});

// Template.createSampleGroups

Template.createSampleGroups.onCreated(function () {
  var instance = this;

  instance.subscribe("/sampleGroupSelector/studies");

  // the index of the study that's selected
  instance.selectedStudyIndex = new ReactiveVar(undefined);
  // the error message from submitting and failing
  instance.errorMessage = new ReactiveVar(undefined);

  var savedSampleGroup = Session.get(instance.parent().data + "-creating");
  if (savedSampleGroup) {
    // do a pick so we don't get the _id of an already inserted object
    savedSampleGroup = _.pick(savedSampleGroup,
        "sample_group_label", "selected_studies");
  } else {
    savedSampleGroup = {};
  }
  instance.data.set(savedSampleGroup);
});

Template.createSampleGroups.onDestroyed(function () {
  var instance = this;

  var creatingCached;
  if (instance.data.get()._id) {
    creatingCached = null;
  } else {
    creatingCached = instance.data.get();
  }
  Session.set(instance.parent().data + "-creating", creatingCached);
});

Template.createSampleGroups.helpers({
  getStudies: function () {
    return Studies.find({});
  },
  activeIfSelected: function (index) {
    if (index === Template.instance().selectedStudyIndex.get()) {
      return "active";
    }
  },
  selectedStudyIndex: function () {
    return Template.instance().selectedStudyIndex.get();
  },
  errorMessage: function () {
    return Template.instance().errorMessage.get();
  },
});

Template.createSampleGroups.events({
  "click #sampleGroupSelector-add-study": function (event, instance) {
    var sampleGroup = instance.data.get();
    if (!sampleGroup.selected_studies) {
      sampleGroup.selected_studies = [];
    }
    sampleGroup.selected_studies.push({
      study_label: instance.$("#sampleGroupSelector-choose-study").val()
    });

    instance.data.set(sampleGroup);
  },
  "click .sampleGroupSelector-select-study": function (event, instance) {
    var dataValue = event.target.dataset.value;

    // if undefined, the DOM node has (likely) been removed because
    // the study was deleted
    if (dataValue) {
      var index = parseInt(dataValue, 10);
      instance.selectedStudyIndex.set(index);
    }
  },
  "click #sampleGroupSelector-dismiss-error": function (event, instance) {
    instance.errorMessage.set(undefined);
  },
});

// Template.studySummaryInteractive

Template.studySummaryInteractive.helpers({
  studyShortName: function () {
    return Studies.findOne({id: this.study_label}).short_name;
  },
});

Template.studySummaryInteractive.events({
  "click .remove-study": function (event, instance) {
    var index = instance.data.index;

    var sampleGroup = instance.parent().data.get();
    sampleGroup.selected_studies.splice(index, 1);
    instance.parent().data.set(sampleGroup);

    // unselect in parent template if selected
    var selectedStudyIndex = instance.parent().selectedStudyIndex;
    if (selectedStudyIndex.get() === index) {
      selectedStudyIndex.set(undefined);
    } else if (selectedStudyIndex.get() > index) {
      // so that the same study is selected
      selectedStudyIndex.set(selectedStudyIndex.get() - 1);
    }
  },
  "click .refresh-study": function (event, instance) {
    var index = instance.data.index;

    var sampleGroup = instance.parent().data.get();
    console.log("sampleGroup:", sampleGroup);
  }
});

// Template.updateOrCreateForm

Template.updateOrCreateForm.onCreated(function () {
  var instance = this;
  // TODO: switch depending on if sample_group_label is set
  instance.updateOrCreate = new ReactiveVar("create");
});

Template.updateOrCreateForm.helpers({
  selectedIf: function (text) {
    if (Template.instance().updateOrCreate.get() === text) {
      return "selected";
    }
  },
  updateOrCreate: function () {
    return Template.instance().updateOrCreate.get();
  },
});

Template.updateOrCreateForm.events({
  "change #sampleGroupSelector-create-update": function (event, instance) {
    instance.updateOrCreate.set(event.target.value);
  },
  "submit #sampleGroupSelector-bottom-form": function (event, instance) {
    event.preventDefault();

    console.log("instance:", instance);
    console.log("event.target:", event.target);

    var sample_group_label = instance.$("#sampleGroupSelector-name").val();
    console.log("sample_group_label:", sample_group_label);

    var sampleGroup = instance.parent().data.get();
    _.extend(sampleGroup, {
      sample_group_label: sample_group_label
    });

    Meteor.call("/sampleGroupSelector/upsert", sampleGroup, function (error, result) {
      var errorMessage = instance.parent().errorMessage;

      if (error) {
        errorMessage.set("Internal error");
        console.log("error:", error);
      } else {
        if (result.error) {
          errorMessage.set(result.error);
        } else {
          var rootInstance = instance.parent(2);
          // update reactiveSampleGroup
          console.log("result:", result);
          rootInstance.reactiveSampleGroup.set(result);
          // go to existing tab
          rootInstance.selectedTab.set("existing");
        }
      }
    });
  },
});
