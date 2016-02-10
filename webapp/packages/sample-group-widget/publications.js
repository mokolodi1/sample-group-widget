// TODO: move to medbook:publish
// reactive :)
Meteor.publish("/sampleGroupSelector/studies", function () {
  var user = findUser(this.userId);
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

Meteor.publish("/sampleGroupSelector/sampleGroups", function () {
  var user = findUser(this.userId);
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
