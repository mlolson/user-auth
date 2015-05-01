'use strict';

exports.requireLoggedIn = function(redirect) {

  redirect = redirect || '/';

  return function(req, res, next) {

    if (!req.session || !req.session.currentUser) {
      return res.redirect(redirect);
    }

    next();
  };
};

exports.requireRole = function(options) {

  var role = options.role;
  var redirect = options.redirect;

  return function(req, res, next) {

    if (role && (!req.session || !req.session.currentUser || req.session.currentUser.role !== role)) {
      return res.redirect(redirect);
    }

    next();

  };
};