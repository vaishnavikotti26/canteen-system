const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Food = require('../models/Food');
const { CATEGORIES } = require('../models/Food');
const { protect, adminOnly } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/httpError');

const foodsDir = path.join(__dirname, '..', 'uploads', 'foods');
fs.mkdirSync(foodsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: foodsDir,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(httpError(400, 'Only image files (png, jpg, webp, gif) are allowed.'));
  },
});

const removeUploadedFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/foods/')) {
    fs.unlink(path.join(__dirname, '..', imagePath), () => {});
  }
};

// Returns a clean object or throws a 400
const validateFood = (body) => {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const category = String(body.category || '');
  const available = body.available === undefined ? true : body.available === true || body.available === 'true';

  if (name.length < 2 || name.length > 60) throw httpError(400, 'Name must be 2-60 characters.');
  if (!Number.isFinite(price) || price < 1 || price > 10000) throw httpError(400, 'Price must be between 1 and 10000.');
  if (!CATEGORIES.includes(category)) throw httpError(400, `Category must be one of: ${CATEGORIES.join(', ')}.`);
  if (description.length > 300) throw httpError(400, 'Description must be at most 300 characters.');
  return { name, description, price, category, available };
};

// GET /api/foods?category=&search=   (students see only available items, admins see all)
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role !== 'admin') filter.available = true;
    if (req.query.category && CATEGORIES.includes(req.query.category)) filter.category = req.query.category;
    if (req.query.search) {
      const safe = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = new RegExp(safe, 'i');
    }
    const foods = await Food.find(filter).sort({ category: 1, name: 1 });
    res.json({ foods, categories: CATEGORIES });
  })
);

// POST /api/foods  (admin) multipart/form-data, optional "image" file or "imageUrl" text
router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const uploaded = req.file ? `/uploads/foods/${req.file.filename}` : '';
    try {
      const data = validateFood(req.body);
      data.image = uploaded || String(req.body.imageUrl || '').trim();
      const food = await Food.create(data);
      res.status(201).json({ food });
    } catch (err) {
      removeUploadedFile(uploaded);
      throw err;
    }
  })
);

// PUT /api/foods/:id  (admin)
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const uploaded = req.file ? `/uploads/foods/${req.file.filename}` : '';
    try {
      const food = await Food.findById(req.params.id);
      if (!food) throw httpError(404, 'Food item not found.');
      const data = validateFood(req.body);
      const oldImage = food.image;
      Object.assign(food, data);
      if (uploaded) food.image = uploaded;
      else if (req.body.imageUrl !== undefined) food.image = String(req.body.imageUrl).trim();
      await food.save();
      if (food.image !== oldImage) removeUploadedFile(oldImage);
      res.json({ food });
    } catch (err) {
      removeUploadedFile(uploaded);
      throw err;
    }
  })
);

// DELETE /api/foods/:id  (admin)
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) throw httpError(404, 'Food item not found.');
    removeUploadedFile(food.image);
    res.json({ message: 'Food item deleted.' });
  })
);

module.exports = router;
