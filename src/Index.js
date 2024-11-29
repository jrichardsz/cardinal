const path = require('path');
global.appHomePath = path.resolve(__dirname);

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const router = express.Router();
const hbs = require('hbs');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const fileUpload = require('express-fileupload');
const os = require("os");

const Prototypes = require('./startup/Prototypes.js');
Prototypes.register();

const Configuration = require('./config/Configuration.js');
global.properties = new Configuration().loadJsonFile(appHomePath + '/config.json', 'utf8');

const logger = require('./log/Logger.js');
global.logger = logger;

logger.info("starting configurator...");

const RequiredVariables = require('./startup/RequiredVariables.js');
var requiredVariables = new RequiredVariables();
requiredVariables.startValidation();

const DatabaseConnection = require('./database/DatabaseConnection.js');
const DefaultUserConfigurator = require('./startup/DefaultUserConfigurator.js');
const HandleBarsConfigurator = require('./startup/HandleBarsConfigurator.js');
const RoutesScanner = require('./scanner/RoutesScanner.js');
const DatabaseRepositoryScanner = require('./scanner/DatabaseRepositoryScanner.js');
const SecureExpress = require('./security/SecureExpress.js');

const port = process.env.PORT || 2708;
const app = express();

app.disable('x-powered-by');

app.use(cookieParser());

app.use(session({
  secret: uuid.v4(),
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: (45 * 60 * 1000)
  }
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: os.tmpdir(),
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true,
  limits: {
    fileSize: 500000 //0.5 mb
  },
}));

var secureExpress = new SecureExpress();
secureExpress.setStaticAssets(["/vendor", "/pages", "/dist", "/favicon.ico"]);
secureExpress.setLoginEndpoints(["/login", "/login/action"]);
secureExpress.setApiEndpoints(["/api"]);
secureExpress.setExpressInstance(app);
secureExpress.configure();

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

HandleBarsConfigurator.configure(hbs);

const databaseConnection = new DatabaseConnection();
databaseConnection.initializeConnection({
  host: properties.database.host, // your mysql host, ip or public domain
  user: properties.database.user, // your mysql user
  password: properties.database.password, // your mysql password
  port: properties.database.port, //port mysql
  database: properties.database.name, // your database name
  connectionLimit: 25 // your database name
});

global.databaseConnection = databaseConnection;

RoutesScanner.scan(secureExpress);
DatabaseRepositoryScanner.scan();

var defaultUserConfigurator = new DefaultUserConfigurator();
defaultUserConfigurator.createUserIfNoExist("admin", "admin");
defaultUserConfigurator.createUserIfNoExist("guest", "reader");


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  logger.info('serving on port ' + port);
});
