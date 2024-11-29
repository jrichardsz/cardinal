var chai = require("chai");
var Settings = require("./Settings.js");
var expect = chai.expect;
var webdriver = require("selenium-webdriver");
var By = webdriver.By;
var until = webdriver.until;
const { v4: uuidv4 } = require("uuid");
const CommonSteps = require("./CommonSteps.js");

const commonSteps = new CommonSteps();

var driver;
var seeGraphPath = Settings.getConfiguratorUrl() + "/dependency-graph";

describe("See graph", function () {
  before(async function () {
    driver = global.driver;
  });
  it("see-graph:header - should be able to show title on the header", async function () {
    await driver.get(seeGraphPath);
    const titleElement = await driver.findElement(By.className("page-header"));
    const titleElementValue = await titleElement.getText();
    expect(titleElementValue).to.be.equal("Using global variables");
  });
  it("see-graph:search - should be able to show message when it can't  a an unregistered global variable", async function () {
    await driver.get(seeGraphPath);
    const globalVariableName = uuidv4();
    const searchInput = driver.findElement(By.name("global_var_name"));
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
      "Not showed the message when not found the global variable on table"
    );
    const messageValue = await messageElement.getText();
    expect(messageValue).to.be.exist;
  });
  it("see-graph:search - should be able to search global variable and its components", async function () {
    const appName = uuidv4();
    const appDesc = uuidv4();
    await commonSteps.createApplicationAndValidate(driver, appName, appDesc);

    //create two vars
    const globalVarId1 = "foo-" + Math.floor(Math.random() * 999999 + 100000);
    const globalVarId2 = "foo-" + Math.floor(Math.random() * 999999 + 100000);

    await commonSteps.createGlobalVariable(
      driver,
      globalVarId1,
      globalVarId1,
      globalVarId1,
      "S",
      "Secret"
    );
    await commonSteps.addGlobalVarToAplicationAndValidate(
      driver,
      appName,
      globalVarId1
    );
    await driver.get(seeGraphPath);
    const searchInput = driver.findElement(By.name("global_var_name"));
    await searchInput.sendKeys(globalVarId1);
    const searchButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Search')]")
    );
    await searchButton.click();
    const svgGenerate = await driver.wait(
      until.elementLocated(By.id("graph")),
      5 * 1000,
      "There isn't graph image",
      300
    );

    expect(svgGenerate).to.be.exist;
  });
});
