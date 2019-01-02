var express = require('express');
var router = express.Router();
var calendarApi = require('../gapi/calendarapi');

// get home page.
router.get('/', function(req, res, next) {
  res.render('index', {'title': 'Todo items'});
});

// get create page.
router.get('/create', function(req, res, next) {
  res.render('create', {'title': 'Create event'});
});

// get edit page
router.get('/edit/:eventId', function(req, res, next) {
  calendarApi.edit(req, res);
});

// get calendar events
router.get('/load', calendarApi.loadList);

// store event
router.post('/store', calendarApi.store);

// update event
router.post('/update', calendarApi.update);

// delete event
router.post('/remove', calendarApi.destroy);

// console.log(router.stack);
module.exports = router;
