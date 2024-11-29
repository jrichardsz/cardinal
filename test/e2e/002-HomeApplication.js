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

describe("Application", function () {
  before(async function () {
    driver = global.driver;
  });

  it("app:create - should keep on same page if parameters are empty", async function () {
    await driver.get(Settings.getConfiguratorUrl());
    var buttonNewApp = await driver.findElements(
      By.css("a[href='/application/view/new']")
    );
    await buttonNewApp[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");
    //set app name
    var appNameBox = await driver.findElement(By.name("name"));
    await appNameBox.sendKeys("app-" + Math.floor(Math.random() * 999 + 100));
    var buttonCreateApp = await driver.findElements(
      By.css("button#submit-form-application[type='submit']")
    );
    await buttonCreateApp[0].click();

    formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");
  });

  it("app:create - should be returned to the app home page when cancel button is clicked", async function () {
    await driver.get(Settings.getConfiguratorUrl());
    var buttonNewApp = await driver.findElements(
      By.css("a[href='/application/view/new']")
    );
    await buttonNewApp[0].click();

    //wait until the title
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");

    var cancelButton = await driver.findElements(By.id("cancelCreationButton"));
    await cancelButton[0].click();

    //new title should be the home page
    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Applications");
  });

  it("app:create - should work the app creation and should exist on result table if parameters are valid", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);
  });

  it("app:edit - should work the application edit and should exist on result table if parameters are valid", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Applications");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheAppToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == appName) {
        expectedColumnsContainingTheAppToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheAppToBeEdited[4].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("edit application");

    var nameBox = await driver.findElement(By.name("name"));
    nameBox.clear();
    await nameBox.sendKeys(appName + "-edited");

    var descriptionBox = await driver.findElement(
      By.css("input[name='description']")
    );
    descriptionBox.clear();
    await descriptionBox.sendKeys(appDesc + "-edited");

    await driver
      .findElement(By.css("select[name='type'] > option[value=WEB]"))
      .click();

    var buttonCreateApp = await driver.findElements(
      By.css("button#submit-form-application[type='submit']")
    );
    await buttonCreateApp[0].click();

    var rowsAfterCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    var appNames = [];
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      appNames.push(await tdElements[1].getText());
    }

    expect(true).to.equal(appNames.includes(appName + "-edited"));
  });

  it("app:delete - should work the cancel of application deletion and return to the table", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Applications");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    //get our app
    var expectedColumnsContainingTheAppToBeDeleted;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == appName) {
        expectedColumnsContainingTheAppToBeDeleted = tdElements;
        break;
      }
    }

    var deleteButton =
      await expectedColumnsContainingTheAppToBeDeleted[4].findElements(
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
    expect(applicationHomeTitle).to.equal("Applications");
  });

  it("app:delete - should work the application deletion and dissapear from the result table", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Applications");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    //get our app
    var expectedColumnsContainingTheAppToBeDeleted;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == appName) {
        expectedColumnsContainingTheAppToBeDeleted = tdElements;
        break;
      }
    }

    var deleteButton =
      await expectedColumnsContainingTheAppToBeDeleted[4].findElements(
        By.css("a[title='Delete']")
      );
    await deleteButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    //get disclaimer which is inside of form
    var deleteForm = await driver.findElements(
      By.css("form[action='/application/action/delete']")
    );
    var rawDisclaimer = await deleteForm[0].getText();

    //disclaimer shoould contain the name of app to delete
    expect(true).to.equal(rawDisclaimer.includes(appName));
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
    //get all app names
    var appNames = [];
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      appNames.push(await tdElements[1].getText());
    }
    //deleted application should not exist
    expect(false).to.equal(appNames.includes(appName));
  });

  it("app:variables - should see the variables if variables button is clicked", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    var applicationHomeTitle = await driver
      .findElement(By.css(".page-header"))
      .getText();
    expect(applicationHomeTitle).to.equal("Applications");

    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    //get our app
    var expectedColumnsContainingTheApp;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == appName) {
        expectedColumnsContainingTheApp = tdElements;
        break;
      }
    }

    //click on variables button of first application
    var variablesButton = await expectedColumnsContainingTheApp[4].findElements(
      By.css("a[title='Variables']")
    );
    await variablesButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("Application Variables");

    var selectedElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElements = await selectedElements[0].findElements(
      By.xpath("//option[@selected]")
    );
    var selectedApplicationNameText =
      await selectedApplicationElements[0].getText();
    expect(selectedApplicationNameText).to.equal(appName);
  });
  it("app:search - should be able show a message when not found app on table", async function () {
    await driver.get(Settings.getConfiguratorUrl());
    const appName = uuidv4();
    const searchInput = driver.findElement(By.name("application"));
    await searchInput.sendKeys(appName);
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
    const appName = uuidv4();
    const appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);
    const searchInput = driver.findElement(By.name("application"));
    await searchInput.sendKeys(appName);
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Search')]")
    );
    await searchButton.click();

    const appsSearched = await driver.wait(
      until.elementsLocated(By.xpath("//table/tbody/tr")),
      5 * 1000,
      "there aren't rows when search",
      300
    );
    expect(appsSearched.length).to.be.greaterThan(0);
  });
});
