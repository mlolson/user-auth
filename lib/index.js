'use strict';

var _ = require('lodash');
var UserModel = require('./user');
var UserAuthApi = require('./api');
var DB = require('./db');
var middleware = require('./middleware');



/**
{
  db: {
    client: 'postgres' | 'mysql',
    connection: {
      host: 10.0.10,
      user: 'user',
      password: 'pass',
      database: 'my_db'
    }
  },
  schema: {
    users: {
      tableName: '_users',
      extraFields: [{name: 'first_name', type: 'string'}]
    },
    loginTokens: {
      tableName: '_login_tokens'
    },
    passwordResetTokens: {
      tableName: '_pw_reset_tokens'
    }
  },
  session: {
    mode: 'express-session' | 'headers'
    secret: 'xxxx',
    name: 'cookie.id',
  }
}

**/
function UserAuth(options) {
  options = options || {};
  options.userModel = new UserModel(((options.schema || {}).users || {}));
  this.db = new DB(options);

  _.bindAll(this, '_attachUserFromSessionToken');
};

module.exports = UserAuth;

UserAuth.prototype.setupDatabase = function setupDatabase() {
  return this.db.initialize();
};

UserAuth.prototype.register = function register(app) {

  var _this = this;

  app.use(this._attachUserFromSessionToken);
  app.use(function(req, res, next) {

    try {
      req.userAuth = new UserAuthApi(_this, req, res);
      return next();
    } catch(err) {
      return next(err);
    }

  });

};

UserAuth.prototype._attachUserFromSessionToken = function _attachUserFromSessionToken(req, res, next) {

  var tokenString;

  if (req.session) {
    tokenString = req.session.token;
  }
  else {
    tokenString = req.headers('X-Session-Token');
  }

  if (!tokenString) {
    return next();
  }
  return this.db.getUserAndSessionToken(tokenString)
    .spread(function(user, sessionToken) {

      if (sessionToken && user) {
        req.session = req.session || {_user_auth_session: true};
        req.session.token = sessionToken.token;
        req.session.currentUser = user;
      }

      next();
    })
    .catch(next);
};