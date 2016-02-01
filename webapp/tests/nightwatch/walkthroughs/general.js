module.exports = {
  tags: ["general", "travis"],
  "Do general tests: history page, welcome, etc.": function (client) {
    // set some preliminary variables
    client.globals.waitForConditionTimeout = 2000;

    // verify the navbar stuff (inside reviewMainLayout)
    client
      .url("http://localhost:3000/Workbench")
      .resizeWindow(1024, 768).pause(2000)
      .reviewMainLayout()
    ;

    // verify error message when we make screen smaller
    client
      .url("http://localhost:3000/Workbench")
      .waitForElementVisible("#viewport-big-enough")
      .verify.visible("#viewport-big-enough")
      .verify.hidden("#viewport-too-small")
      .resizeWindow(700, 500)
      .waitForElementVisible("#viewport-too-small", 5000)
      .verify.hidden("#viewport-big-enough")
      .verify.visible("#viewport-too-small")
      .verify.containsText("#viewport-too-small .jumbotron > h1", "Are you on a phone?")
      .verify.containsText("#viewport-too-small .jumbotron > p:nth-child(2)",
          "If you're on a laptop or desktop, please make your window wider. " +
          "Currently Workbench has been designed to work on large screens (wider than 768px).")
      .verify.containsText("#viewport-too-small .jumbotron > p:nth-child(3)",
          "If you want to use Workbench on smaller devices, " +
          "please email a feature request to the MedBook team.")
      .verify.attributeContains("#viewport-too-small .jumbotron > p:nth-child(4) > a",
          "href", "mailto:mokolodi1@gmail.com")
      .resizeWindow(1024, 768)
      .waitForElementVisible("#viewport-big-enough", 5000)
    ;

    // TODO

    client.end();
  },
};
