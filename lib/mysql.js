'use strict';

var _ = require('lodash');
var when = require('when');
var bcrypt = require('bcrypt');
var nodefn = require('when/node');
var Knex = require('knex');
var uuid = require('node-uuid');

var error = require('./error');
var UserModel = require('./user');

function Mysql(options) {

  this.userModel = options.userModel;
  this.knex = Knex(options.db);
  this._users = ((options.schema || {}).users ||{}).tableName || '_users';
  this._login_tokens = ((options.schema || {}).loginTokens ||{}).tableName || '_login_tokens';
  this._pw_reset_tokens = ((options.schema || {}).passwordResetTokens ||{}).tableName || '_pw_reset_tokens';

  _.bindAll(this,
    '_cleanUserData',
    'getSessionToken',
    'getUserAndSessionToken',
    'getUserById',
    'loginWithEmail',
    'loginWithUsername'
  );
}

module.exports = Mysql;

Mysql.prototype._collapseToSingle = function _collapseToSingle(resultArray) {
    return resultArray && resultArray.length ? resultArray[0] : undefined;
};

Mysql.prototype._hashPassword = function(password) {

    return nodefn.call(bcrypt.genSalt, 10)
        .then(function(salt) {
            return nodefn.call(bcrypt.hash, password, salt);
        });
};

Mysql.prototype._comparePasswords = function(password, passwordHash) {
    return nodefn.lift(bcrypt.compare)(password, passwordHash);
};

Mysql.prototype._cleanUserData = function _cleanUserData(data) {

  var result = {};
  var fields = this.userModel.fields;

  _.forIn(data, function(val, key) {

    if (fields[key] && typeof val === fields[key].type) {
      result[key] = val;
    }

  });

  return result;

};

//User access functions
Mysql.prototype.getUserById = function getUserById(userId) {
  return this.getUserByField({cid: userId});
};

Mysql.prototype.getUserByField = function getUserByField(criteria) {

    if (typeof criteria !== 'object' || _.isEmpty(criteria)) {
        return when.reject(new EmptyArgumentError({argument: 'criteria'}));
    }

    return this
        .knex(this._users)
        .where(criteria)
        .limit(1)
        .then(this._collapseToSingle)
        .then(this._cleanUserData);

};

Mysql.prototype.updateUser = function updateUser(userId, update) {
    if (!id) {
        return when.reject(new EmptyArgumentError({argument: 'id'}));
    }

    if (!user) {
        return when.reject(new EmptyArgumentError({argument: 'user'}));
    }

    var _this = this;

    return this
        ._cleanUserData(user)
        .then(function(userModel) {
            return _this.query(_this._users, {transaction: trx})
                .returning('*')
                .update(userModel)
                .where({id: id});
        })
        .then(this._collapseToSingle)
        .then(this._cleanUserData)
        .catch(function(err) {

            if (err.code &&
                err.code === '23505' &&
                err.detail &&
                err.detail.indexOf('email') > -1) {

                return when.reject(new error.EmailTakenError());
            }

            if (err.code &&
                err.code === '23505') {
                return when.reject(new error.UniquenessViolationError());
            }

            return when.reject(err);
        });

};

Mysql.prototype.updateUserPassword = function updateUserPassword(userId, password) {

    if (!id) {
        return when.reject(new EmptyArgumentError({argument: 'id'}));
    }

    if (!password) {
        return when.reject(new EmptyArgumentError({argument: 'password'}));
    }

    var _this = this;

    return this
        ._hashPassword(password)
        .then(function (passwordHash) {

            return _this.knex(_this._users)
                .update({passwordHash: passwordHash})
                .where({id: id});
        })
        .then(this._collapseToSingle)
        .then(this._cleanUserData);

};

Mysql.prototype.createUserWithPassword = function createUserWithPassword(user, password) {

    if (!user) {
        return when.reject(new error.MissingField({field: 'user'}));
    }

    if (!password) {
        return when.reject(new error.MissingField({field: 'password'}));
    }

    var _this = this;

    return when.all([
            this._cleanUserData(user),
            this._hashPassword(password)
        ])
        .spread(function(userData, passwordHash) {

            userData.password_hash = passwordHash;
            userData.cid = uuid.v4();

            return _this.knex(_this._users)
                    .returning('*')
                    .insert(userData);

        })
        .then(this._collapseToSingle)
        .then(this._cleanUserData)
        .catch(function(err) {

            if (err.code &&
                err.code === '23505' &&
                err.detail) {

              if (err.detail.indexOf('email') > -1) {
                return when.reject(new error.EmailTakenError());
              }

              if (err.detail.indexOf('username') > -1) {
                return when.reject(new error.UsernameTakenError());
              }
            }

            return when.reject(err);
        });
};


//Auth
Mysql.prototype._login = function _login(criteria, password) {

    var _this = this;

    return this
        .knex(this._users)
        .where(criteria)
        .limit(1)
        .then(this._collapseToSingle)
        .then(function(user) {

            if (!user) {
                return when.reject(new error.UserNotFound());
            }

            if (!user.active) {
                return when.reject(new error.InactiveUser());
            }

            if (!user.password_hash) {
                return when.reject(new error.PasswordNotSet());
            }

            return when.all([
                user,
                _this._comparePasswords(password, user.password_hash)
            ]);

        })
        .spread(function(user, passwordsMatch) {

            if (!passwordsMatch) {
                return when.reject(new error.InvalidCredentials());
            }

            return _this._cleanUserData(user);
        });

};

Mysql.prototype.loginWithEmail = function loginWithEmail(auth) {

    if (!auth) {
        return when.reject(new EmptyArgumentError({argument: 'auth'}));
    }

    if (!auth.email) {
        return when.reject(new EmptyArgumentError({argument: 'email'}));
    }

    return this._login({email: auth.email}, auth.password);

};

Mysql.prototype.loginWithUsername = function loginWithUsername(auth) {

    if (!auth) {
        return when.reject(new EmptyArgumentError({argument: 'auth'}));
    }

    if (!auth.username) {
        return when.reject(new EmptyArgumentError({argument: 'username'}));
    }

    return this._login({username: auth.username}, auth.password);

};

//Token
Mysql.prototype.removeSessionToken = function removeSessionToken(tokenString) {

    console.log('remove', tokenString);

  return this
    .knex(this._login_tokens)
    .delete()
    .where({token: tokenString});

};

Mysql.prototype.getSessionToken = function getSessionToken(tokenString) {

  return this
    .knex(this._login_tokens)
    .where({token: tokenString})
    .limit(1)
    .then(this._collapseToSingle);
};

Mysql.prototype.createSessionToken = function createSessionToken(user) {

  if (!user) {
    return when.reject(new error.MissingField({field: 'user'}));
  }

  var newToken = {
    token: uuid.v4(),
    userCid: user.cid
  };

  return this
    .knex(this._login_tokens)
    .returning('*')
    .insert(newToken)
    .then(this._collapseToSingle);
};

Mysql.prototype.getUserAndSessionToken = function getUserFromSessionToken(tokenString) {

  var _this = this;

  return this.getSessionToken(tokenString)
    .then(function(sessionToken) {

      if (!sessionToken || !sessionToken.userId) {
        return when.all([null, null]);
      }

      return when.all([_this.getUserById(sessionToken.userId), sessionToken]);

    });

};

//Password reset
Mysql.prototype.getPasswordResetToken = function getPasswordResetToken(token) {

};

Mysql.prototype.addPasswordResetToken = function addPasswordResetToken(userId) {

};

Mysql.prototype.removePasswordResetToken = function removePasswordResetToken(token) {

};