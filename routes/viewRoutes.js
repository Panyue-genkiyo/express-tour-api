const express = require('express');

const viewController = require('../controller/viewController');

const { getOverview, getTour } = viewController;

const viewRouter = express.Router();

viewRouter.get('/', getOverview);
viewRouter.get('/tour/:slug', getTour);


module.exports = viewRouter;
