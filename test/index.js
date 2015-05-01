'use strict';

var UserAuth = require('../lib');
var expect = require('chai').expect;

suite('Initialize', function() {
    test('Initialize application', function(done) {
        var userAuth = new UserAuth({
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
              extraFields: [
                {
                  name: 'first_name',
                  type: 'string'
                }
              ]
            }
          }
        });

        userAuth.setupDatabase().then(function() { done(); }).catch(done);
    });
});