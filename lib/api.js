'use strict';

var _ = require('lodash');
var when = require('when');
var nodefn = require('when/node');
var bcrypt = require('bcrypt');

var error = require('./error');

function UserAuthApi(parent, req, res) {
  this.db = parent.db;
  this.req = req;
  this.res = res;

  _.bindAll(this,
    'attachSession',
    'getUserByField',
    'getUserById',
    'loginWithEmail',
    'loginWithUsername',
    'logout',
    'signup'
  );
}

module.exports = UserAuthApi;

UserAuthApi.prototype.getUserById = function getUserById(userId) {

  if (!userId) {
    return when.reject(new error.MissingField({field: 'userId'}));
  }

  return this.db.getUserById(userId);

};

UserAuthApi.prototype.getUserByField = function getUserByField(criteria) {

  if (!criteria) {
    return when.reject(new error.MissingField({field: 'criteria'}));
  }

  if (typeof criteria !== 'object') {
    return when.reject(new error.InvalidField({field: 'criteria', reasson: 'Not an object'}));
  }

  return this.db.getUserByField(criteria);
};

UserAuthApi.prototype._isInvalidPassword = function _isInvalidPassword(password) {

  if (typeof password !== 'string') {
    return 'Password must be a string';
  }

  if (!password.trim()) {
    return 'Null or empty password';
  }

  if (password.length < 7) {
    return 'Password must be more than 6 characters';
  }

  return false;

};

UserAuthApi.prototype.attachSession = function attachSession(user, sessionToken) {

  this.currentUser = user;

  if (!this.req.session) {
    this.req.session = {_user_auth_session: true};
    this.res.cookie('X-Session-Token', sessionToken.token)
  }

  this.req.session.currentUser = user;
  this.req.session.token = sessionToken.token;
  return when.resolve(user);

};

UserAuthApi.prototype.signup = function signup(user) {

  var _this = this;

  if (!user) {
    return when.reject(new error.MissingField({field: 'user'}));
  }

  if (!user.email && !user.username) {
    return when.reject(new error.InvalidField({field: 'user', reason: 'Must have email or username'}));
  }

  var reasonInvalid = this._isInvalidPassword(user.password);

  if (reasonInvalid) {
    return when.reject(new error.InvalidField({field: 'password', reason: reasonInvalid}));
  }

  return this.db.createUserWithPassword(user, user.password)
    .then(function(user) {
      return when.all([
        user,
        _this.db.createSessionToken(user)
      ]);
    })
    .spread(this.attachSession);
};

UserAuthApi.prototype.loginWithEmail = function loginWithEmail(auth) {

  var _this = this;

  return this.db.loginWithEmail(auth)
    .then(function(user) {
      return when.all([
        user,
        _this.db.createSessionToken(user)
      ]);
    })
    .spread(this.attachSession);
};

UserAuthApi.prototype.loginWithUsername = function loginWithUsername(auth) {

  var _this = this;

  return this.db.loginWithUsername(auth)
    .then(function(user) {
      return when.all([
        user,
        _this.db.createSessionToken(user)
      ]);
    })
    .spread(this.attachSession);
};

UserAuthApi.prototype.logout = function logout() {

  var _this = this;

  delete this.currentUser;

  if (!this.req.session || !this.req.session.token) {
    return when.resolve();
  }

  return this.db.removeSessionToken(this.req.session.token)
    .then(function() {

      if (_this.req.session.destroy && typeof _this.req.session.destroy === 'function') {

        console.log(_this.req.session);
        return nodefn.call(_this.req.session.destroy.bind(_this.req.session));
      }

      _this.req.session = {_user_auth_session: true};

      return when.resolve();

    });
}