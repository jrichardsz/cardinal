const { v4: uuidv4 } = require("uuid");
var chai = require("chai");
var Settings = require("./Settings.js");
const CommonSteps = require("./CommonSteps.js");
var expect = chai.expect;
var assert = chai.assert;
var webdriver = require("selenium-webdriver");
var chrome = require("selenium-webdriver/chrome");
var driverPath = require("chromedriver").path;
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var commonSteps = new CommonSteps();

var driver;
var globalHomePageUrl = Settings.getConfiguratorUrl() + "/global-variable";

describe("Global Variables", function () {
  before(async function () {
    driver = global.driver;
  });

  it("global:create - should keep on same page if parameters are empty", async function () {
    await driver.get(globalHomePageUrl);
    var buttonNewGlobal = await driver.findElements(
      By.css("a[href='/global-variable/view/new']")
    );
    await buttonNewGlobal[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new global variable");

    var buttonCreateGlobal = await driver.findElements(
      By.css("button[type='submit']")
    );
    await buttonCreateGlobal[0].click();

    formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new global variable");
  });

  it("global:create - should be returned to the global home page when cancel button is clicked", async function () {
    await driver.get(globalHomePageUrl);
    var buttonNewGlobal = await driver.findElements(
      By.css("a[href='/global-variable/view/new']")
    );
    await buttonNewGlobal[0].click();

    //wait until the title
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new global variable");

    var cancelButton = await driver.findElements(
      By.id("cancelGlobalCreationButton")
    );
    await cancelButton[0].click();

    //new title should be the home page
    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(formTitle).to.equal("new global variable");
  });

  it("global:create - should work the global plain creation and should exist on result table if parameters are valid", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();

    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "P",
      "Plain"
    );

    // await driver.get(globalHomePageUrl);
    //
    // //get application count from table: table-responsive
    // var rowsBeforeCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    // var rowsBefore = rowsBeforeCollection.length
    //
    // var buttonNewGlobal = await driver.findElements(By.css("a[href='/global-variable/view/new']"));
    // await buttonNewGlobal[0].click();
    //
    // var nameBox = await driver.findElement(By.name('name'));
    // await nameBox.sendKeys(process.env.GLOBAL_NAME);
    //
    // var valueBox = await driver.findElement(By.css("textarea[name='value']"));
    // await valueBox.sendKeys(process.env.GLOBAL_VALUE);
    //
    // var descriptionBox = await driver.findElement(By.css("input[name='description']"));
    // await descriptionBox.sendKeys(process.env.GLOBAL_DESC);
    //
    // await driver.findElement(By.css("select[name='type'] > option[value=P]")).click();
    //
    // var buttonCreateGlobal = await driver.findElements(By.css("button[type='submit']"));
    // await buttonCreateGlobal[0].click();
    //
    // var formTitle = await driver.findElement(By.css(".page-header")).getText();
    // expect(formTitle).to.equal("Global Variables");
    //
    // var success_message = await driver.findElement(By.css(".alert.alert-success")).getText();
    // expect(success_message.trim()).to.equal("The global variable was saved successfully.");
    //
    // var rowsAfterCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    // var rowsAfter = rowsAfterCollection.length
    //
    // var globalWasFound = false;
    // var globalTypeFound;
    // var globalValueFound;
    // for (var webElementRow of rowsAfterCollection) {
    //   var tdElements = await webElementRow.findElements(By.xpath('td'));
    //   var currentGlobalName = await tdElements[1].getText();
    //   if(currentGlobalName==process.env.GLOBAL_NAME){
    //     globalWasFound = true;
    //     globalTypeFound = await tdElements[2].getText();
    //     globalValueFound = await tdElements[3].getText();
    //     break;
    //   }
    // }
    //
    // expect(rowsAfter).to.equal(rowsBefore + 1);
    // expect(true).to.equal(globalWasFound);
    // expect(globalTypeFound).to.equal("Plain");
    // expect(false).to.equal(globalValueFound.includes("*"));
  });

  it("global:edit - should work the global edit from plain to secret and should exist on result table if parameters are valid", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();

    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "P",
      "Plain"
    );

    await driver.get(globalHomePageUrl);
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("Global Variables");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheGlobalToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == globalVarName) {
        expectedColumnsContainingTheGlobalToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheGlobalToBeEdited[5].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("editing global variable");

    var nameBox = await driver.findElement(By.name("name"));
    nameBox.clear();
    await nameBox.sendKeys(globalVarName + "-edited");

    var valueBox = await driver.findElement(By.css("textarea[name='value']"));
    valueBox.clear();
    await valueBox.sendKeys(globalVarValue + "-edited");

    var descriptionBox = await driver.findElement(
      By.css("input[name='description']")
    );
    descriptionBox.clear();
    await descriptionBox.sendKeys(globalVarDesc + "-edited");

    await driver
      .findElement(By.css("select[name='type'] > option[value=S]"))
      .click();

    var buttonCreateApp = await driver.findElements(
      By.css("button[type='submit']")
    );
    await buttonCreateApp[0].click();

    var rowsAfterCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    var globalWasFound = false;
    var globalTypeFound;
    var globalValueFound;
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var currentGlobalName = await tdElements[1].getText();
      if (currentGlobalName == globalVarName + "-edited") {
        globalWasFound = true;
        globalTypeFound = await tdElements[2].getText();
        globalValueFound = await tdElements[3].getText();
        break;
      }
    }

    expect(true).to.equal(globalWasFound);
    expect(globalTypeFound).to.equal("Secret");
    expect(true).to.equal(globalValueFound.includes("*"));
  });

  it("global:delete - should be returned to the global home page when cancel button is clicked", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();

    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "P",
      "Plain"
    );

    await driver.get(globalHomePageUrl);
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("Global Variables");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheGlobalToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == globalVarName) {
        expectedColumnsContainingTheGlobalToBeEdited = tdElements;
        break;
      }
    }

    var deleteButton =
      await expectedColumnsContainingTheGlobalToBeEdited[5].findElements(
        By.css("a[title='Delete']")
      );
    await deleteButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    var cancelButton = await driver.findElements(By.id("cancelDeletionButton"));
    await cancelButton[0].click();

    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Global Variables");
  });

  it("global:delete - should work the global deletion and dissapear from the result table", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();

    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "P",
      "Plain"
    );

    await driver.get(globalHomePageUrl);
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("Global Variables");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheGlobalToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == globalVarName) {
        expectedColumnsContainingTheGlobalToBeEdited = tdElements;
        break;
      }
    }

    var deleteButton =
      await expectedColumnsContainingTheGlobalToBeEdited[5].findElements(
        By.css("a[title='Delete']")
      );
    await deleteButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    //get disclaimer which is inside of form
    var deleteForm = await driver.findElements(
      By.css("form[action='/global-variable/action/delete']")
    );
    var rawDisclaimer = await deleteForm[0].getText();

    //disclaimer shoould contain the name of global to delete
    expect(true).to.equal(rawDisclaimer.includes(globalVarName));
    //click on delete button
    var buttonDeleteApp = await driver.findElements(
      By.css("button[type='submit']")
    );
    await buttonDeleteApp[0].click();

    //get new rows
    var rowsAfterCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    //search the global in the table
    var globalWasFound = false;
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var currentGlobalName = await tdElements[1].getText();
      if (currentGlobalName == globalVarName) {
        globalWasFound = true;
        break;
      }
    }

    expect(false).to.equal(globalWasFound);
  });

  it("global:create - should work the global secret creation and should exist on result table with hide value if parameters are valid", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();
    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "S",
      "Secret"
    );
  });

  it("global:edit - should work the global secret edit and its value should be readable", async function () {
    var globalVarName = uuidv4();
    var globalVarValue = uuidv4();
    var globalVarDesc = uuidv4();
    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "S",
      "Secret"
    );

    await driver.get(globalHomePageUrl);
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("Global Variables");
    //at this point, the application was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheGlobalToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == globalVarName) {
        expectedColumnsContainingTheGlobalToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheGlobalToBeEdited[5].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("editing global variable");

    var secretValue = await driver
      .findElement(By.css("textarea[name='value']"))
      .getText();

    expect(secretValue).to.equal(globalVarValue);
  });

  it("global:search - should be able show a message when not found global variable on table", async function () {
    await driver.get(globalHomePageUrl);
    const globalVariableName = uuidv4();
    const searchInput = driver.findElement(By.name("var"));
    await searchInput.sendKeys(globalVariableName);
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Search')]")
    );
    await searchButton.click();
    const messageElement = await driver.wait(
      until.elementLocated(
        By.xpath("//*[@id='page-wrapper']/div[2]/div/div[1]")
      ),
      4 * 1000,
      "Not showed the message when not found the app on table"
    );
    const messageValue = await messageElement.getText();
    expect(messageValue).to.be.exist;
  });

  it("app:search - should be able search a app on table", async function () {
    await driver.get(globalHomePageUrl);
    const globalVarName = uuidv4();
    const globalVarValue = uuidv4();
    const globalVarDesc = uuidv4();
    await commonSteps.createGlobalVariable(
      driver,
      globalVarName,
      globalVarValue,
      globalVarDesc,
      "S",
      "Secret"
    );
    const searchInput = driver.findElement(By.name("var"));
    await searchInput.sendKeys(globalVarName);
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Search')]")
    );
    await searchButton.click();

    const elementsSearched = await driver.wait(
      until.elementsLocated(By.xpath("//table/tbody/tr")),
      5 * 1000,
      "there aren't rows when search in global variables",
      300
    );
    expect(elementsSearched.length).to.be.greaterThan(0);
  });
});
