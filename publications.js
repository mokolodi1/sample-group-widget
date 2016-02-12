Meteor.publish("/sampleGroupWidget/studies", function () {
  var user = MedBook.findUser(this.userId);
  if (!user) {
    this.ready();
    return;
  }

  return Studies.find({
    collaborations: {
      $in: user.getCollaborations()
    }
  });
});

Meteor.publish("/sampleGroupWidget/sampleGroups", function () {
  var user = MedBook.findUser(this.userId);
  if (!user) {
    this.ready();
    return;
  }

  return SampleGroups.find({
    collaborations: {
      $in: user.getCollaborations()
    }
  });
});
