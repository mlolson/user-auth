'use strict';

var _ = require('lodash');
var when = require('when');
var bcrypt = require('bcrypt');
var nodefn = require('when/node');
var Knex = require('knex');
var UserModel = require('../lib/user');

function Postgres(options) {

  this.userModel = new UserModel(((options.schema || {}).users || {}));
  this.knex = Knex(options.db);
  this._users = ((options.schema || {}).users ||{}).tableName || '_users';
  this._login_tokens = ((options.schema || {}).loginTokens ||{}).tableName || '_login_tokens';
  this._pw_reset_tokens = ((options.schema || {}).passwordResetTokens ||{}).tableName || '_pw_reset_tokens';

  _.bindAll(this, '_createUserSchema', '_createLoginSchema', '_createPasswordResetSchema');
}

//Init functions
Postgres.prototype.initialize = function initialize() {
  return this._createUserSchema()
    .then(this._createLoginSchema)
    .then(this._createPasswordResetSchema);
};


Postgres.prototype._createUserSchema = function createUserSchema() {

  var _this = this;

  return this.knex.schema.hasTable(this._users)
    .then(function(exists) {

      if (exists) { return; }

      return _this.knex.schema.createTable(_this._users, function (table) {
          table.increments('id').primary();
          table.string('password_hash');
          table.timestamps();

          _.forIn(_this.userModel.fields, function(value, key) {

            if (!table[value.type] || typeof table[value.type] !== 'function') {
              throw new Error('Invalid field type: ' + value.type);
            }

            var column = table[value.type](key);

            if (value.default) {
              column.defaultTo(value.default);
            }

          });
        });
    });
};

Postgres.prototype._createLoginSchema = function createLoginSchema() {
  var _this = this;

  return this.knex.schema
    .hasTable(this._login_tokens)
    .then(function(exists) {

      if (exists) { return; }

      return _this.knex.schema.createTable(_this._login_tokens, function (table) {
          table.string('token').primary()
          table.string('userCid').references('cid').inTable(this._users);
          table.timestamps();
        });
    });
};


Postgres.prototype._createPasswordResetSchema = function createPasswordResetSchema() {
  var _this = this;

  return this.knex.schema
    .hasTable(this._pw_reset_tokens)
    .then(function(exists) {

      if (exists) { return; }

      return _this.knex.schema.createTable(_this._pw_reset_tokens, function (table) {
          table.string('token').primary()
          table.string('userCid').references('cid').inTable(this._users);
          table.timestamps();
        });
    });
};

exports.getdb = function getdb(options) {

  /*options = {
    db: {
      client: 'sqlite3',
      file: './test_users'
    },
    schema: {
      users: {
        extraFields: [{
          name: 'first_name',
          type: 'string'
        }]
      }
    }
  };*/

  options = {
    db: {
      client: 'pg',
      debug: true,
      connection: {
        host: '127.0.0.1',
        database: 'test_user_auth',
        charset: 'utf8'
      }
    },
    schema: {
      users: {
        extraFields: [{
          name: 'first_name',
          type: 'string'
        }]
      }
    }
  };
  return new Postgres(options);
}