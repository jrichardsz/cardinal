var chai = require('chai');
var Settings = require('./Settings.js');
const CommonSteps = require('./CommonSteps.js');
var expect = chai.expect;
var assert = chai.assert;
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var driverPath = require('chromedriver').path;
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var commonSteps = new CommonSteps();

var service = new chrome.ServiceBuilder(driverPath).build();
chrome.setDefaultService(service);
var driver;
var isError = false;

describe('Application', function() {

  before(async function() {
    driver = await new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

    var applicationHomeTitle = await commonSteps.login(driver);
    expect(applicationHomeTitle).to.equal("Applications");

  });

  after(async function() {
    await driver.quit();
  });

  it('app:create - should keep on same page if parameters are empty', async function() {

    await driver.get(Settings.getConfiguratorUrl());
    var buttonNewApp = await driver.findElements(By.css("a[href='/application/view/new']"));
    await buttonNewApp[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");
    //set app name
    var appNameBox = await driver.findElement(By.name('name'));
    await appNameBox.sendKeys("app-" + (Math.floor((Math.random() * 999) + 100)));
    var buttonCreateApp = await driver.findElements(By.css("button[type='submit']"));
    await buttonCreateApp[0].click();

    formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");
  });

  it('app:create - should be returned to the app home page when cancel button is clicked', async function() {

    await driver.get(Settings.getConfiguratorUrl());
    var buttonNewApp = await driver.findElements(By.css("a[href='/application/view/new']"));
    await buttonNewApp[0].click();

    //wait until the title
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("new application");

    var cancelButton = await driver.findElements(By.id("cancelCreationButton"));
    await cancelButton[0].click();

    //new title should be the home page
    var applicationHomeTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(applicationHomeTitle).to.equal("Applications");
  });

  it('app:create - should work the app creation and should exist on result table if parameters are valid', async function() {

    await driver.get(Settings.getConfiguratorUrl());

    //get application count from table: table-responsive
    var rowsBeforeCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    var rowsBefore = rowsBeforeCollection.length

    var buttonNewApp = await driver.findElements(By.css("a[href='/application/view/new']"));
    await buttonNewApp[0].click();

    var nameBox = await driver.findElement(By.name('name'));
    await nameBox.sendKeys(process.env.APP_NAME);

    var descriptionBox = await driver.findElement(By.css("input[name='description']"));
    await descriptionBox.sendKeys(process.env.APP_DESC);

    var buttonCreateApp = await driver.findElements(By.css("button[type='submit']"));
    await buttonCreateApp[0].click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header"))
    );

    var rowsAfterCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    var rowsAfter = rowsAfterCollection.length

    var appNames = [];
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath('td'));
      appNames.push(await tdElements[1].getText());
    }

    expect(rowsAfter).to.equal(rowsBefore + 1);
    expect(true).to.equal(appNames.includes(process.env.APP_NAME));

  });

  it('app:edit - should work the application edit and should exist on result table if parameters are valid', async function() {
    //at this point, the application was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    //iterate rows looking for the second column which contains the app name
    var expectedColumnsContainingTheAppToBeEdited;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath('td'));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == process.env.APP_NAME.trim()) {
        expectedColumnsContainingTheAppToBeEdited = tdElements;
        break;
      }
    }

    var editButton = await expectedColumnsContainingTheAppToBeEdited[4].findElements(By.css("a[title='Edit']"));
    await editButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("edit application");

    var nameBox = await driver.findElement(By.name('name'));
    nameBox.clear();
    await nameBox.sendKeys(process.env.APP_NAME + "-edited");

    var descriptionBox = await driver.findElement(By.css("input[name='description']"));
    descriptionBox.clear();
    await descriptionBox.sendKeys(process.env.APP_DESC + "-edited");

    await driver.findElement(By.css("select[name='type'] > option[value=WEB]")).click();

    var buttonCreateApp = await driver.findElements(By.css("button[type='submit']"));
    await buttonCreateApp[0].click();

    var rowsAfterCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));

    var appNames = [];
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath('td'));
      appNames.push(await tdElements[1].getText());
    }

    expect(true).to.equal(appNames.includes(process.env.APP_NAME + "-edited"));

  });


  it('app:delete - should work the cancel of application deletion and return to the table', async function() {
    //at this point, the application was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    //iterate rows looking for the second column which contains the app name
    //get the columns of first application
    var tdElements = await rowsCollection[0].findElements(By.xpath('td'));
    var deleteButton = await tdElements[4].findElements(By.css("a[title='Delete']"));
    await deleteButton[0].click();

    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    var cancelButton = await driver.findElements(By.id("cancelDeletionButton"));
    await cancelButton[0].click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header"))
    );

    var applicationHomeTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(applicationHomeTitle).to.equal("Applications");
  });

  it('app:delete - should work the application deletion and dissapear from the result table', async function() {

    await driver.get(Settings.getConfiguratorUrl());
    await driver.wait(
      until.elementsLocated(By.css(".page-header"))
    );

    //at this point, the application was created.
    //I just need to search the row, get the edit button and click on it
    var rowsCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));

    var expectedColumnsContainingTheAppToBeDeleted;
    for (var webElementRow of rowsCollection) {
      var tdElements = await webElementRow.findElements(By.xpath('td'));
      var thisAppName = await tdElements[1].getText();
      if (thisAppName.trim() == (process.env.APP_NAME + "-edited".trim())) {
        expectedColumnsContainingTheAppToBeDeleted = tdElements;
        break;
      }
    }

    var deleteButton = await expectedColumnsContainingTheAppToBeDeleted[4].findElements(By.css("a[title='Delete']"));
    await deleteButton[0].click();

    //validate the title of delete form
    var formTitle = await driver.findElement(By.css(".page-header")).getText();
    expect(formTitle).to.equal("delete");

    //get disclaimer which is inside of form
    var deleteForm = await driver.findElements(By.css("form[action='/application/action/delete']"));
    var rawDisclaimer = await deleteForm[0].getText();

    //disclaimer shoould contain the name of app to delete
    expect(true).to.equal(rawDisclaimer.includes(process.env.APP_NAME + "-edited"));
    //click on delete button
    var buttonDeleteApp = await driver.findElements(By.css("button[type='submit']"));
    await buttonDeleteApp[0].click();

    //get new rows
    var rowsAfterCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
    //get all app names
    var appNames = [];
    for (var webElementRow of rowsAfterCollection) {
      var tdElements = await webElementRow.findElements(By.xpath('td'));
      appNames.push(await tdElements[1].getText());
    }
    //deleted application should not exist
    expect(false).to.equal(appNames.includes(process.env.APP_NAME + "-edited"));

  });


  it('app:variables - should see the variables if variables button is clicked', async function() {
      //at this point, the application was created.
      //I just need to search the row, get the edit button and click on it
      var rowsCollection = await driver.findElements(By.css("[class='table table-bordered table-hover table-striped'] tbody > tr"));
      //iterate rows looking for the second column which contains the app name
      //get the columns of first application
      var tdElements = await rowsCollection[0].findElements(By.xpath('td'));

      var firstAppName = await tdElements[1].getText();

      //click on variables button of first application
      var variablesButton = await tdElements[4].findElements(By.css("a[title='Variables']"));
      await variablesButton[0].click();

      var formTitle = await driver.findElement(By.css(".page-header")).getText();
      expect(formTitle).to.equal("Application Variables");

      var selectedElements = await driver.findElements(By.css("select[name='applicationId']"));
      var selectedApplicationElements = await selectedElements[0].findElements(By.xpath('//option[@selected]'));
      var selectedApplicationNameText = await selectedApplicationElements[0].getText();
      expect(selectedApplicationNameText).to.equal(firstAppName);

  });

});
