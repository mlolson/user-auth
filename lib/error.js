'use strict';

var util = require('util');
var _ = require('lodash');

function UserAuthError(options) {

  options = options || {};
  options.status  = options.status || 500;
  options.message = options.message || 'UserAuth Error';

  Error.call(this, JSON.stringify(options));
  Error.captureStackTrace(this, this.constructor);
  this.message = options.message;
  this.status = options.status;
  this.code = options.code;
}

util.inherits(UserAuthError, Error);
exports.UserAuthError = UserAuthError;

function MissingField(options) {

  if (!(this instanceof MissingField)) {
    return new MissingField(options);
  }

  options = options || {};
  options.status = 400;
  options.message = options.message || 'Missing field';

  UserAuthError.call(this, options);
}

util.inherits(MissingField, UserAuthError);
exports.MissingField = MissingField;

function InvalidField(options) {

  if (!(this instanceof InvalidField)) {
    return new InvalidField(options);
  }

  options = options || {};
  options.status = 400;
  options.message = options.message || 'Invalid field';

  UserAuthError.call(this, options);
}

util.inherits(InvalidField, UserAuthError);
exports.InvalidField = InvalidField;

function ValidationError(options) {

  if (!(this instanceof ValidationError)) {
    return new ValidationError(options);
  }

  options = options || {};
  options.status = 400;
  options.message = options.message || 'Model validation error';

  UserAuthError.call(this, options);

}
util.inherits(ValidationError, UserAuthError);
exports.ValidationError = ValidationError;


function DatabaseError(options) {

  if (!(this instanceof DatabaseError)) {
    return new DatabaseError(options);
  }

  options = options || {};
  options.status = 500;
  options.message = options.message || 'Database error';

  UserAuthError.call(this, options);
}

util.inherits(DatabaseError, UserAuthError);
exports.DatabaseError = DatabaseError;

function UserNotFound(options) {

  if (!(this instanceof UserNotFound)) {
    return new UserNotFound(options);
  }

  options = options || {};
  options.status = 404;
  options.message = options.message || 'User not found';

  UserAuthError.call(this, options);
}

util.inherits(UserNotFound, UserAuthError);
exports.UserNotFound = UserNotFound;

function InactiveUser(options) {

  if (!(this instanceof InactiveUser)) {
    return new InactiveUser(options);
  }

  options = options || {};
  //Verify this
  options.status = 410;
  options.message = options.message || 'User not active';

  UserAuthError.call(this, options);
}

util.inherits(InactiveUser, UserAuthError);
exports.InactiveUser = InactiveUser;

function PasswordNotSet(options) {

  if (!(this instanceof PasswordNotSet)) {
    return new PasswordNotSet(options);
  }

  options = options || {};
  options.status = 403;
  options.message = options.message || 'User password not set';

  UserAuthError.call(this, options);
}

util.inherits(PasswordNotSet, UserAuthError);
exports.PasswordNotSet = PasswordNotSet;

function InvalidCredentials(options) {

  if (!(this instanceof InvalidCredentials)) {
    return new InvalidCredentials(options);
  }

  options = options || {};
  options.status = 403;
  options.message = options.message || 'Invalid credential';

  UserAuthError.call(this, options);
}

util.inherits(InvalidCredentials, UserAuthError);
exports.InvalidCredentials = InvalidCredentials;