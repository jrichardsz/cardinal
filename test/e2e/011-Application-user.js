var chai = require('chai');
var Settings = require('./Settings.js');
var expect = chai.expect;
var assert = chai.assert;
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var driverPath = require('chromedriver').path;
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
const os = require('os');
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const { v4: uuidv4 } = require('uuid');

var driver;
var globalHomePageUrl = Settings.getConfiguratorUrl() + "/application-user";

describe('Application user', function () {

  before(async function () {
    driver = global.driver;
  })

  it('user:create - Should create an Administrator user', async function () {
    let unValue = uuidv4()
    let pwValue = uuidv4()

    await driver.get(globalHomePageUrl)
    await driver.findElement(By.partialLinkText('New user')).click();

    let username = await driver.findElement(By.name('username'));
    username.sendKeys(unValue);

    let password = await driver.findElement(By.name('password'));
    password.sendKeys(pwValue);

    let roles = await driver.findElement(By.css('select[name="role"]'));
    await roles.findElement(By.xpath('option[.="Administrator"]')).click();

    let btnSubmit = await driver.findElement(By.css('button[type="submit"]'))
    btnSubmit.click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header")),
      5 * 1000
    )

    let title = await driver.findElement(By.css(".page-header")).getText();
    expect(title.trim()).to.equal('Users')

    let success_message = await driver.findElement(By.css('.alert.alert-success')).getText();
    expect(success_message.trim()).to.equal(`The user was saved successfully: ${unValue}`)
  })

  it('user:create - Should create an Guest user', async function () {
    let unValue = uuidv4()
    let pwValue = uuidv4()

    await driver.get(globalHomePageUrl)
    await driver.findElement(By.partialLinkText('New user')).click();

    let username = await driver.findElement(By.name('username'));
    username.sendKeys(unValue);

    let password = await driver.findElement(By.name('password'));
    password.sendKeys(pwValue);

    let roles = await driver.findElement(By.css('select[name="role"]'));
    await roles.findElement(By.xpath('option[.="Guest"]')).click();

    let btnSubmit = await driver.findElement(By.css('button[type="submit"]'))
    btnSubmit.click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header")),
      5 * 1000
    )

    let title = await driver.findElement(By.css(".page-header")).getText();
    expect(title.trim()).to.equal('Users')

    let success_message = await driver.findElement(By.css('.alert.alert-success')).getText();
    expect(success_message.trim()).to.equal(`The user was saved successfully: ${unValue}`)
  })

  it('user:edit - Should modify the user', async function () {
    let pwValue = uuidv4()

    await driver.get(globalHomePageUrl)

    let tbodyRows = await driver.findElements(By.css('table[class="table table-bordered table-hover table-striped"] tbody tr'));

    let rowsLength = tbodyRows.length;

    let row = tbodyRows[rowsLength - 1];

    await row.findElement(By.css('td > a[class="btn btn-outline btn-primary fa fa-pencil-square-o"]')).click();

    let username = await driver.findElement(By.name('username'));
    username = await username.getAttribute('value')

    let password = await driver.findElement(By.name('password'));
    password.sendKeys(pwValue);

    let btnSubmit = await driver.findElement(By.css('button[type="submit"]'))
    btnSubmit.click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header")),
      5 * 1000
    )

    let title = await driver.findElement(By.css(".page-header")).getText();
    expect(title.trim()).to.equal('Users')

    let success_message = await driver.findElement(By.css('.alert.alert-success')).getText();
    expect(success_message.trim()).to.equal(`The user was update successfully: ${username}`)
  })

  it('user:delete You must delete a user', async function () {
    await driver.get(globalHomePageUrl)

    let tbodyRows = await driver.findElements(By.css('table[class="table table-bordered table-hover table-striped"] tbody tr'));

    let rowsLength = tbodyRows.length;

    let row = tbodyRows[rowsLength - 1];

    await row.findElement(By.css('td > a[class="btn btn-outline btn-primary fa fa-times"]')).click();
    
    await driver.wait(
      until.elementsLocated(By.css(".page-header")),
      5 * 1000
    )

    let title = await driver.findElement(By.css(".page-header")).getText();
    expect(title.trim()).to.equal('delete')

    let btnSubmit = await driver.findElement(By.css('button[type="submit"]'))
    btnSubmit.click();

    await driver.wait(
      until.elementsLocated(By.css(".page-header")),
      5 * 1000
    )

    title = await driver.findElement(By.css(".page-header")).getText();
    expect(title.trim()).to.equal('Users')

    let success_message = await driver.findElement(By.css('.alert.alert-success')).getText();
    expect(success_message.trim()).to.equal(`The user was deleted successfully.`)

  })
})