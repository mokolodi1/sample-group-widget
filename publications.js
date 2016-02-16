Meteor.publish("/sampleGroupWidget/studies", function () {
  var user = MedBook.ensureUser(this.userId);

  return Studies.find({
    collaborations: {
      $in: user.getCollaborations()
    }
  });
});

Meteor.publish("/sampleGroupWidget/sampleGroups", function () {
  var user = MedBook.ensureUser(this.userId);

  return SampleGroups.find({
    collaborations: {
      $in: user.getCollaborations()
    }
  });
});
