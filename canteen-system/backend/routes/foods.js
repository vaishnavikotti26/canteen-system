
const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// Get all available food items
router.get('/', async (req, res, next) => {
  try {
    const foods = await Food.find({ available: true }).sort({
      createdAt: -1
    });

    res.status(200).json(foods);
  } catch (error) {
    next(error);
  }
});

// Get food item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: 'Food item not found'
      });
    }

    res.status(200).json(food);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
