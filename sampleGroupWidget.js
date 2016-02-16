// Template.sampleGroupWidget

Template.sampleGroupWidget.onCreated(function () {
  var instance = this;

  // doesn't need to be reactive
  instance.shareModalId = instance.data + "-share-modal";
  // existing tab is the default
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

Template.sampleGroupWidget.helpers({
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

Template.sampleGroupWidget.events({
  "click .sgw-existing": function (event, instance) {
    instance.selectedTab.set("existing");
  },
  "click .sgw-create": function (event, instance) {
    instance.selectedTab.set("create");
  },
});

// Template.sgwExistingSampleGroups

Template.sgwExistingSampleGroups.onCreated(function () {
  var instance = this;

  instance.subscribe("/sampleGroupWidget/sampleGroups");

  var selectedId = instance.data.get()._id;
  if (!selectedId) {
    selectedId = Session.get(instance.parent().data + "-selectedId");
  }
  instance.selectedId = new ReactiveVar(selectedId);

  // keep track of if they've clicked delete so they don't accidentally delete
  // anything
  instance.deleteClicked = new ReactiveVar(false);

  instance.autorun(function () {
    instance.data.set(SampleGroups.findOne(instance.selectedId.get()));
  });
});

Template.sgwExistingSampleGroups.onDestroyed(function () {
  var instance = this;
  Session.set(instance.parent().data + "-selectedId", instance.selectedId.get());
});

Template.sgwExistingSampleGroups.helpers({
  getSampleGroups: function () {
    return SampleGroups.find({}, {
      sort: {
        date_created: -1
      }
    });
  },
  getSelected: function () {
    return SampleGroups.findOne(Template.instance().selectedId.get());
  },
  multipleStudies: function () {
    return this.selected_studies.length > 1;
  },
  deleteClicked: function () {
    return Template.instance().deleteClicked.get();
  },
});

Template.sgwExistingSampleGroups.events({
  "click .sgw-select-sg": function (event, instance) {
    instance.selectedId.set(this._id);
  },
  "click .sgw-share-sg": function (event, instance) {
    MedBook.editCollaborations("SampleGroups", instance.selectedId.get());
  },
  "click .sgw-update-sg": function (event, instance) {
    Session.set(instance.parent().data + "-creating", instance.data.get());
    instance.parent().selectedTab.set("create");
  },
  "click .sgw-remove-sg": function (event, instance) {
    var deleteClicked = instance.deleteClicked;
    if (deleteClicked.get()) {
      Meteor.call("/sampleGroupWidget/removeSampleGroup", instance.selectedId.get());
    } else {
      deleteClicked.set(true);

      // wait until event propogation finishes before registering event
      Meteor.defer(function () {
        $("html").one("click",function() {
          deleteClicked.set(false);
        });
      });
    }
  },
});

// Template.sgwListSampleGroup

Template.sgwListSampleGroup.helpers({
  activeIfSelected: function () {
    if (this._id === Template.instance().parent().selectedId.get()) {
      return "active";
    }
  },
  // disabled: function () {
  //   if (this.user_id === Meteor.userId()) {
  //
  //   }
  // },
});

// Template.sgwCreateSampleGroups

Template.sgwCreateSampleGroups.onCreated(function () {
  var instance = this;

  instance.subscribe("/sampleGroupWidget/studies");

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

Template.sgwCreateSampleGroups.onDestroyed(function () {
  var instance = this;

  var creatingCached;
  if (instance.data.get()._id) {
    creatingCached = null;
  } else {
    creatingCached = instance.data.get();
  }
  Session.set(instance.parent().data + "-creating", creatingCached);
});

Template.sgwCreateSampleGroups.helpers({
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
  addIndex: function (originalArray) {
    if (!originalArray) {
      originalArray = [];
    }

    return _.map(originalArray, function (value, index) {
      return {
        value: value,
        index: index,
      };
    });
  },
});

Template.sgwCreateSampleGroups.events({
  "click #sgw-add-study": function (event, instance) {
    var sampleGroup = instance.data.get();
    if (!sampleGroup.selected_studies) {
      sampleGroup.selected_studies = [];
    }
    sampleGroup.selected_studies.push({
      study_label: instance.$("#sgw-choose-study").val()
    });

    instance.data.set(sampleGroup);
  },
  "click .sgw-select-study": function (event, instance) {
    var dataValue = event.target.dataset.value;

    // if undefined, the DOM node has (likely) been removed because
    // the study was deleted
    if (dataValue) {
      var index = parseInt(dataValue, 10);
      instance.selectedStudyIndex.set(index);
    }
  },
  "click #sgw-dismiss-error": function (event, instance) {
    instance.errorMessage.set(undefined);
  },
});

// Template.sgwStudySummaryInteractive

Template.sgwStudySummaryInteractive.helpers({
  studyShortName: function () {
    return Studies.findOne({id: this.study_label}).short_name;
  },
});

Template.sgwStudySummaryInteractive.events({
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

// Template.sgwUpdateOrCreateForm

Template.sgwUpdateOrCreateForm.onCreated(function () {
  var instance = this;
  // TODO: switch depending on if sample_group_label is set
  instance.updateOrCreate = new ReactiveVar("create");
});

Template.sgwUpdateOrCreateForm.helpers({
  selectedIf: function (text) {
    if (Template.instance().updateOrCreate.get() === text) {
      return "selected";
    }
  },
  updateOrCreate: function () {
    return Template.instance().updateOrCreate.get();
  },
});

Template.sgwUpdateOrCreateForm.events({
  "change #sgw-create-update": function (event, instance) {
    instance.updateOrCreate.set(event.target.value);
  },
  "submit #sgw-bottom-form": function (event, instance) {
    event.preventDefault();

    console.log("instance:", instance);
    console.log("event.target:", event.target);

    var sample_group_label = instance.$("#sgw-name").val();
    console.log("sample_group_label:", sample_group_label);

    var sampleGroup = instance.parent().data.get();
    _.extend(sampleGroup, {
      sample_group_label: sample_group_label
    });

    Meteor.call("/sampleGroupWidget/upsert", sampleGroup, function (error, result) {
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
