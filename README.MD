###Motivation

Express.js is awesome, but getting user accounts and authentication up and running with a relational
backend is kind of a pain.

The goal of this project is to create a fast, lightweight, and extensible library for creating and handling user accounts.

This is not meant to be a comprehensive ORM solution, but it is meant to create a basic, clean users schema that can be extended and used with other front ends.

###Set up your schema

    node ./script/setup-schema.js [-s <path to schema.json>]

### Initialize

    var UsersAuth = require('user-auth');

    UsersAuth.initialize({
    });

    UsersAuth.register(app);

### Compatible with express-session
Make sure to register express-session before users-auth

### Handle user login

    function(req, res, next) {
        req.app.userAuth.loginWithEmail(email, password)
            .then(function(newUser) {
                //User is logged in
            })
            .catch(function(error) {
                //UserNotFoundError
                //InvalidCredentialsError
                //MissingValueError
                //InvalidValueError
            });
    }

### Handle user logout
    function(req, res, next) {

        req.app.userAuth.logout()
            .then(function() {
                 //Logged out
            })
            .catch(next);

    }

### Get logged in user
    function(req, res, next) {
        var currentUser = req.app.userAuth.currentUser;

        if (currentUser) {
            //Do something with logged in user
        } else {
            //Not logged in
        }
    }

### Handle User sign up
        var userData == {
                email: 'email or username required',
                username: 'email or username required',
                password: 'required',
                role: 'default determined by datastore',
                <other fields in user schema>
            };

        req.userAuth.signupUser(userData)
            .then(function(newUser) {
                //User is logged in
            })
            .catch(function(error) {
                //EmailTakenError
                //status: 409

                //InvalidFieldError

                //MissingFieldError
            });


### Restrict endpoints

Basic authentication middleware is provided.

    app.get('/users/:userId', UserAuth.restrictToLoggedIn({redirect: '/login'}), handleResponse);

    app.get('/users/:userId', UserAuth.restrictToRole({role: 'admin', redirect: '/unauthorized'}, handleResponse);

### Retreive, update, delete users

    var user = UserAuth.getUserById(userId);

    //Update consists of fields on the user table in your datastore.
    //Errors will be thrown if you try to put in an invalid value.
    UserAuth.updateUser(userId, update);

    UserAuth.deleteUser(userId);


