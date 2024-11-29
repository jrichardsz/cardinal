# CONFIGURATOR

Centralize and Management configurations of all your applications.

![logo](./src/logo/logo.png)

## Requirements

- Node.js > 14.*
- Mysql database. You could use [docker](https://gist.github.com/jrichardsz/73142c5c7eb7136d80b165e75d3a1e22)


## Settings


|key | sample value | description|
|---|---|---|
|PORT | 8080 | port of server. Default is 2708|
|CONFIGURATOR_DATABASE_HOST | 10.20.30.40 | some ip of your mysql database|
|CONFIGURATOR_DATABASE_USER | usr_configurator | the mysql user for your my database. Root is not required.|
|CONFIGURATOR_DATABASE_PASSWORD | ***** |  password related to the mysql user|
|CONFIGURATOR_DATABASE_PORT | 3306 | mysql port. Default is 3306|
|CONFIGURATOR_DATABASE_NAME | configurator | name of your mysql database|
|CONFIGURATOR_CRYPT_KEY | ****** | secret value to be used as key to encrypt the sensible values in the database. Long as you can|
|CONFIGURATOR_BFA_THRESHOLD | 100 | Numeric value to protect against Force Brute Attack. Default is 50 |
|CONFIGURATOR_DISABLE_CAPTCHA | false | Enable or disable the captcha on login|


## For developers

- Create a database and execute this ddl to create the required tables: [./database/ddl.sql](./src/database/dump/ddl.sql)
- install dependencies
```
npm install
```
- [export variables](https://github.com/jrichardsz-software-architect-tools/configurator/wiki/Export--variables---Linux)
- run

```
npm run dev
```

## For servers without docker

- Create a database and execute this ddl to create the required tables: [./database/ddl.sql](./src/database/dump/ddl.sql)
- install dependencies
```
npm install
```
- [export variables](https://github.com/jrichardsz-software-architect-tools/configurator/wiki/Export--variables---Linux)
- run
```
npm run start
```
## For servers with docker-compose

Just one step :)

```
docker-compose up -d
```

## For servers with docker

**Docker build**

```
docker build -t configurator .
```

**Docker run**

```
docker run --name configurator -it --rm -p 2708:2708 \
-e CONFIGURATOR_DATABASE_HOST=localhost \
-e CONFIGURATOR_DATABASE_USER=root \
-e CONFIGURATOR_DATABASE_PASSWORD=secret \
-e CONFIGURATOR_DATABASE_PORT=3306 \
-e CONFIGURATOR_DATABASE_NAME=configurator \
-e CONFIGURATOR_CRYPT_KEY=changeme \
-e CONFIGURATOR_BFA_THRESHOLD=100 \
-e TZ=America/Lima configurator
```

# For servers with public docker image

Follow this [guide](https://github.com/software-architect-tools/configurator/wiki/Launch-with-Docker).

# Usage

Open your browser pointing at:

- http://localhost:2708
- or http://localhost:8080 if you are using the PORT variable

> Note: Admin password will be showed in the server log.

If no errors, you will see:

![home](./src/logo/home.png)

## Login

By default two user are created:

- admin with admin role
- guest with reader role

Id the database don't contain the admin or guest user, they are created and stored in these internal files:
- `$HOME/configurator-user-admin.txt`
- `$HOME/configurator-user-guest.txt`

Take care to delete them. If you are using docker, [this](https://stackoverflow.com/a/42510314/3957754) works.

Admin can make anything. Guest user only can view all the variables names, view the plain values and can't edit anything.


## Api: /variables

> At first admin login, you should set the apikey

If you have created an app called **helicarrier-api** with at least one variable, this is how you can get its variables:

```
curl localhost:2708/api/v1/variables?application=helicarrier-api -H "apiKey:changeme"
```

response will be

```
export ERP_HOST="12.124.1.6"
export firebase_key="65468748"
```

## Clients and How to use it

These variables are an option to the following strategies in several languages:

- application.properties (java spring boot)
- .env
- hardcoded variables in \_prod \_staging configuration files
- wp-config.php in wordpress
- settings.php in drupal
- AppSettings.json on c#
- etc

The previous files are inherited from first languages as a way to centralize the **configurations** of the application. Use them today in distributed enterprise environments **is not an option anymore** because it needs a biological entity who using a ssh client, edit the file with hardcoded values **directly in the production server**

The famous [The Twelve Factors](https://12factor.net/) for software in modern era , mention this on its third statement:

> III. Config : Store config in the environment

Also several platforms like [heroku](https://devcenter.heroku.com/articles/config-vars) recommends us the use environment variables instead hardcoded values:

> An app’s environment-specific configuration should be stored in environment variables (not in the app’s source code)

If you understand the problem of hardcoded values in plain properties, you could use this tool to call the **/variables** endpoint in the startup of your application and expose that variables to your entire system in transparent way using **ENVIRONMENT VARIABLES** or inject them directly into your application.

I will develop clients for every language. At this moment, just the client for bash or docker based apps are here:

- https://github.com/software-architect-tools/configurator/wiki/Linux-Client

## Tests

### e2e

- Chrome is required.
- Configurator should be started before the e2e tests execution. (Take a look the port)
- Export the url and credentials
```
export TEST_CONFIGURATOR_URL=http://localhost:8080
export TEST_CONFIGURATOR_ADMIN=admin
export TEST_CONFIGURATOR_PASSWORD=****
```
- Run tests
```
npm run test_e2e
```

## Success stories

I successful used the configurator for the following technologies based on docker:

- java : spring-boot
- java : war on tomcats
- java : pentaho
- nodejs : express aplications
- php : pure without frameworks
- php : drupal
- php : wordpress
- php : moodle
- python : django
- c# : netcore

## Alternatives

Here some platforms:
- [zookeeper](https://zookeeper.apache.org)
  - http://www.therore.net/java/2015/05/03/distributed-configuration-with-zookeeper-curator-and-spring-cloud-config.html
- [Spring Cloud](http://spring.io/projects/spring-cloud-config#overview)
  - https://www.baeldung.com/spring-cloud-configuration
  - This is a java spring framework functionality in which you can create properties file with configurations and configure your applications to read them.
- [Consul](https://www.consul.io/intro)
  - Consul is a service mesh solution providing a full featured control plane with service discovery, configuration, and segmentation functionality.
- https://www.vaultproject.io/
- https://www.doppler.com/
- doozerd
- etcd


## Roadmap

- [ ] fix [issues](https://github.com/jrichardsz-software-architect-tools/configurator/issues)
- [ ] implement [features](https://github.com/jrichardsz-software-architect-tools/configurator/issues)
- [ ] improve unit tests and coverage
- [ ] develop java, nodejs and c# clients to be used direclty on application


## Made with

- Node.js
- Mysql
- Web template engine for fast development: https://www.npmjs.com/package/pug
- Bootstrap template: https://adminlte.io/
- Handlebars Engine : https://handlebarsjs.com/builtin_helpers.html
- Initial template : https://github.com/jayetan/Nodejs-Admin-Dashboard.git


## Contributors

<table>
  <tbody>
    <td>
      <img src="https://avatars0.githubusercontent.com/u/3322836?s=460&v=4" width="100px;"/>
      <br />
      <label><a href="http://jrichardsz.github.io/">JRichardsz</a></label>
      <br />
    </td>    
  </tbody>
</table>
