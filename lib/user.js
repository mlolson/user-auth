'use strict';

var _ = require('lodash');
var when = require('when');
var error = require('./error');

function UserModel(options) {

  if (!(this instanceof UserModel)) {
    return new UserModel(options);
  }

  options = options || {};

  var _this = this;

  this.fields = {
    cid: {type: 'string'},
    email: {type: 'string'},
    username: {type: 'string'},
    verified: {type: 'boolean', default: false},
    active: {type: 'boolean', default: true},
    role: {type: 'string', default: 'user'}
  };

  _.forEach(options.extraFields || [], function(field) {

    if (field.name && field.type) {
      _this.fields[field.name] = {type: field.type};

      if (field.default) {
        _this.fields[field.name].default = field.default;
      }
    }
  });

}

module.exports = UserModel;


UserModel.prototype.toModel = function toModel(userData) {

  var newUser = _.cloneDeep(this);

  _.forIn(userData, function(value, key) {
    if (newUser.fields[key] && typeof value === newUser.fields[key].type) {
      newUser.fields[key].value = value;
    }
  });

  return when.resolve(newUser);

};

UserModel.prototype.getData = function getData(userData) {

  var data = {};

  return _.forIn(this.fields, function(val, key) {
    data[key] = val.value;
  });

  return data;

};


UserModel.prototype.validateIn = function validateIn(user) {

  if (!user || _.isEmpty(user)) {
    return when.reject(new error.ValidationError('Empty user'));
  }

  _.forIn(user, function(value, key) {

    if (!_this.fields[key]) {
      return when.reject(new error.ValidationError(key))
    }

    if (typeof value !== _this.fields[key].type) {
      return when.reject(new error.ValidationError(key))
    }

  });

  return when.resolve(user);
};
