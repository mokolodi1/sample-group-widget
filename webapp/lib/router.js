FlowRouter.route("/", {
  name: "componentContainer",
  action: function() {
    BlazeLayout.render("componentContainer");
  }
});

// var testing = workbench.group({
//   prefix: "/testing"
// });
//
// testing.route("/removeData", {
//   action: function () {
//     Meteor.call("removeData", function (error) {
//       if (error) {
//         console.log("error:", error);
//       } else {
//         BlazeLayout.render("appBody", {content: "actionDone"});
//       }
//     });
//   }
// });
