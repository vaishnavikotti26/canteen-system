// Creates the admin account and sample menu items (safe to run more than once)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Food = require('./models/Food');

const foods = [
  ['Masala Dosa', 'Crispy dosa with potato masala, sambar and chutneys', 50, 'Breakfast'],
  ['Idli (3 pcs)', 'Soft steamed idlis with sambar and chutney', 30, 'Breakfast'],
  ['Pongal', 'Ghee pongal served with coconut chutney', 40, 'Breakfast'],
  ['Veg Meals', 'Rice, dal, two curries, curd, pickle and papad', 80, 'Lunch'],
  ['Veg Biryani', 'Fragrant basmati rice with vegetables and raita', 90, 'Lunch'],
  ['Chicken Biryani', 'Hyderabadi style chicken dum biryani', 120, 'Lunch'],
  ['Samosa (2 pcs)', 'Crispy samosas with mint chutney', 20, 'Snacks'],
  ['Veg Puff', 'Flaky bakery-style puff with vegetable filling', 15, 'Snacks'],
  ['French Fries', 'Golden fries with ketchup', 40, 'Snacks'],
  ['Tea', 'Hot masala chai', 10, 'Beverages'],
  ['Filter Coffee', 'Strong South Indian filter coffee', 15, 'Beverages'],
  ['Cold Coffee', 'Chilled coffee with ice cream', 40, 'Beverages'],
  ['Gulab Jamun (2 pcs)', 'Warm gulab jamun in sugar syrup', 25, 'Desserts'],
  ['Ice Cream Cup', 'Vanilla or chocolate scoop', 30, 'Desserts'],
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || 'admin@srkr.edu').toLowerCase();
    let admin = await User.findOne({ email });
    if (!admin) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Canteen Admin',
        email,
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
      });
      console.log(`Admin created: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }

    if ((await Food.countDocuments()) === 0) {
      await Food.insertMany(
        foods.map(([name, description, price, category]) => ({
          name,
          description,
          price,
          category,
          image: `/uploads/defaults/${category.toLowerCase()}.svg`,
        }))
      );
      console.log(`${foods.length} sample food items added`);
    } else {
      console.log('Food items already exist - skipped');
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
