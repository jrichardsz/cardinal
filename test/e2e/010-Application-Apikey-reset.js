var chai = require("chai");
var Settings = require("./Settings.js");
var expect = chai.expect;
var assert = chai.assert;
var webdriver = require("selenium-webdriver");
var chrome = require("selenium-webdriver/chrome");
var driverPath = require("chromedriver").path;
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
const os = require("os");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
const { v4: uuidv4 } = require("uuid");

var driver;
var globalHomePageUrl = Settings.getConfiguratorUrl() + "/application-key";

describe("Application Apikey", function () {
  before(async function () {
    driver = global.driver;
  });
  it("apikey:header - should be able to show title on the header", async function () {
    await driver.get(globalHomePageUrl);
    const titleElement = await driver.findElement(By.className("page-header"));
    const titleElementValue = await titleElement.getText();
    expect(titleElementValue).to.be.equal("Api key");
  });
  it("apikey:reset - You must change the apikey", async function () {
    await driver.get(globalHomePageUrl);
    let oldApikey = await driver.findElement(By.id("inpApikey"));
    oldApikey = await oldApikey.getAttribute("value");

    await driver.findElement(By.partialLinkText("Reset apikey")).click();

    let newApikey = await driver.findElement(By.id("inpApikey"));
    newApikey = await newApikey.getAttribute("value");

    expect(oldApikey).not.equal(newApikey);
  });

  it("apikey:reset - should be able to show a message when reset apikey", async function () {
    await driver.get(globalHomePageUrl);
    await driver.findElement(By.partialLinkText("Reset apikey")).click();
    const messageElement = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(), 'apikey was reset.')]")
      )
    );
    expect(messageElement).to.exist;
  });
  it("apikey:reset - should be able to work the reveal button", async function () {
    await driver.get(globalHomePageUrl);
    const apiKeyInput = await driver.findElement(By.id("inpApikey"));
    const apiKeyInputType = await apiKeyInput.getAttribute("type");
    expect(apiKeyInputType).to.be.equal("password");

    const revealButton = await driver.findElement(By.id("reveal"));
    await revealButton.click();

    const apiKeyInputChanged = await driver.findElement(By.id("inpApikey"));
    const apiKeyInputChangedType = await apiKeyInputChanged.getAttribute(
      "type"
    );
    expect(apiKeyInputChangedType).to.be.equal("text");
  });
});
