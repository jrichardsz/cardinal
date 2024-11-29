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
var applicationVariableHomePageUrl =
  Settings.getConfiguratorUrl() + "/application-variable";

describe("Application Local Variables", function () {
  before(async function () {
    driver = global.driver;
  });

  it("home page : a created app should appear in the select application-variables home page", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);
    await driver.get(applicationVariableHomePageUrl);
    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    await driver.findElement(By.id("newLocalVariableButton"));
    await driver.findElement(By.id("addGlobalVariableButton"));
    await driver.findElement(By.id("exportButton"));
    await driver.findElement(By.id("importButton"));
  });

  it("add local var : when cancel button is clicked, user should be redirected to the global home page with app selected", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    await driver.get(applicationVariableHomePageUrl);

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("Application Variables");

    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    await driver.findElement(By.id("newLocalVariableButton")).click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(true).to.equal(formTitle.includes(appName));

    var cancelButton = await driver.findElements(
      By.id("cancelAddLocalVarButton")
    );
    await cancelButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("Application Variables");

    var selectedElementsAfter = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElementsAfter =
      await selectedElementsAfter[0].findElements(
        By.xpath("//option[@selected]")
      );
    var selectedApplicationNameText =
      await selectedApplicationElementsAfter[0].getText();
    expect(selectedApplicationNameText).to.equal(appName);
  });

  it("add local var : a local plain variable should be able to be created, should appear in the result table", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "P",
      "Plain"
    );
  });

  it("add local var : a local plain variable should be readable on edition", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "P",
      "Plain"
    );

    await driver.get(applicationVariableHomePageUrl);
    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    //at this point, the variables was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheLocalVariableToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == localVarName) {
        expectedColumnsContainingTheLocalVariableToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheLocalVariableToBeEdited[6].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    //validate the text: Editing local variable of: app-1067-edited
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(true).to.equal(formTitle.includes(appName));

    var plainValue = await driver
      .findElement(By.css("textarea[name='value']"))
      .getText();
    expect(plainValue).to.equal(localVarValue);
  });

  it("add local var : a local secret variable should be able to be created, should appear in the result table", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "S",
      "Secret"
    );
  });

  it("add local var : a local secret variable should be readable on edition", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "S",
      "Secret"
    );

    await driver.get(applicationVariableHomePageUrl);
    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    //at this point, the variables was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheLocalVariableToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == localVarName) {
        expectedColumnsContainingTheLocalVariableToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheLocalVariableToBeEdited[6].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    //validate the text: Editing local variable of: app-1067-edited
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(true).to.equal(formTitle.includes(appName));

    var plainValue = await driver
      .findElement(By.css("textarea[name='value']"))
      .getText();
    expect(plainValue).to.equal(localVarValue);
  });

  it("edit local var : should work the edition of variable from plain to secret and should appear in the result table ", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "P",
      "Plain"
    );

    await driver.get(applicationVariableHomePageUrl);

    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    //at this point, the variables was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheLocalVariableToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var thisGlobalName = await tdElements[1].getText();
      if (thisGlobalName.trim() == localVarName) {
        expectedColumnsContainingTheLocalVariableToBeEdited = tdElements;
        break;
      }
    }

    var editButton =
      await expectedColumnsContainingTheLocalVariableToBeEdited[6].findElements(
        By.css("a[title='Edit']")
      );
    await editButton[0].click();

    //validate the text: Editing local variable of: app-1067-edited
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(true).to.equal(formTitle.includes(appName));

    var nameBox = await driver.findElement(By.name("name"));
    nameBox.clear();
    await nameBox.sendKeys(localVarName + "-edited");

    var valueBox = await driver.findElement(By.css("textarea[name='value']"));
    valueBox.clear();
    await valueBox.sendKeys(localVarValue + "-edited");

    var descriptionBox = await driver.findElement(
      By.css("input[name='description']")
    );
    descriptionBox.clear();
    await descriptionBox.sendKeys(localVarDesc + "-edited");

    await driver
      .findElement(By.css("select[name='type'] > option[value=S]"))
      .click();

    var buttonSave = await driver.findElements(By.css("button[type='submit']"));
    await buttonSave[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("Application Variables");

    var success_message = await driver
      .findElement(By.css(".alert.alert-success"))
      .getText();
    expect(success_message.trim()).to.equal(
      "The variable was edited successfully."
    );

    var rowsAfterCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );

    var localVariableWasFound = false;
    var localVariableTypeFound;
    var localVariableValueFound;
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath("td"));
      var currentGlobalName = await tdElements[1].getText();
      if (currentGlobalName == localVarName + "-edited") {
        localVariableWasFound = true;
        localVariableTypeFound = await tdElements[2].getText();
        localVariableValueFound = await tdElements[3].getText();
        break;
      }
    }

    expect(true).to.equal(localVariableWasFound);
    expect(localVariableTypeFound).to.equal("Secret");
    expect(true).to.equal(localVariableValueFound.includes("*"));
  });

  it("app:cancel-delete-var - should be returned to the global home page with app selected when cancel button is clicked", async function () {
    var appName = uuidv4();
    var appDesc = uuidv4();
    var localVarName = uuidv4();
    var localVarValue = uuidv4();
    var localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "P",
      "Plain"
    );

    await driver.get(applicationVariableHomePageUrl);

    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();

    //at this point, the application was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(
      By.css(
        "[class='table table-bordered table-hover table-striped'] tbody > tr"
      )
    );
    //iterate rows looking for the second column which contains the app name
    //get the columns of first application
    var tdElements = await rowsCollection[0].findElements(By.xpath("td"));
    var selectedVariableName = await tdElements[1].getText();
    var deleteButton = await tdElements[6].findElements(
      By.css("a[title='Delete']")
    );
    await deleteButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    var deleteWarningMessage = await driver
      .findElement(By.id("deleteWarningMessage"))
      .getText();
    expect(true).to.equal(deleteWarningMessage.includes(appName));
    expect(true).to.equal(deleteWarningMessage.includes(selectedVariableName));

    var cancelButton = await driver.findElements(By.id("cancelDeletionButton"));
    await cancelButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("Application Variables");

    var selectedElementsAfter = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElementsAfter =
      await selectedElementsAfter[0].findElements(
        By.xpath("//option[@selected]")
      );
    var selectedApplicationNameText =
      await selectedApplicationElementsAfter[0].getText();
    expect(selectedApplicationNameText).to.equal(appName);
  });
  it("local-variable:search - should be able show a message when not found local variable on table", async function () {
    await driver.get(applicationVariableHomePageUrl);
    const selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    const selectedApplicationElement = await selectElements[0].findElements(
      By.xpath("//option")
    );
    await selectedApplicationElement[1].click();
    const localVariableName = uuidv4();
    const searchInput = driver.findElement(By.name("variable"));
    await searchInput.sendKeys(localVariableName);
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
  it("local-variable:search - should be able to search local variable on table", async function () {
    const appName = uuidv4();
    const appDesc = uuidv4();
    const localVarName = uuidv4();
    const localVarValue = uuidv4();
    const localVarDesc = uuidv4();
    await commonSteps.createAppAndAddOneVariable(
      driver,
      appName,
      appDesc,
      localVarName,
      localVarValue,
      localVarDesc,
      "P",
      "Plain"
    );

    await driver.get(applicationVariableHomePageUrl);

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle.trim()).to.equal("Application Variables");

    var selectElements = await driver.findElements(
      By.css("select[name='applicationId']")
    );
    var selectedApplicationElement = await selectElements[0].findElements(
      By.xpath('option[.="' + appName + '"]')
    );
    await selectedApplicationElement[0].click();
    const searchInput = driver.findElement(By.name("variable"));
    await searchInput.sendKeys(localVarName);
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Search')]")
    );
    await searchButton.click();
    const elementsSearched = await driver.wait(
      until.elementsLocated(By.xpath("//table/tbody/tr")),
      5 * 1000,
      "there aren't rows when search in local variables",
      300
    );
    expect(elementsSearched.length).to.be.greaterThan(0);
  });
});
