const Category = require('../models/Category');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private (Admin)
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('label');
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { label, value } = req.body;

  try {
    // Check for duplicates
    let category = await Category.findOne({ $or: [{ label }, { value }] });
    if (category) {
      return res.status(400).json({ success: false, message: 'A category with this label or value already exists.' });
    }

    category = new Category({
      label,
      value,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // 🚀 THE SAFETY CHECK
    // Find if any course is using this category's 'value'
    const courseInUse = await Course.findOne({ category: category.value });

    if (courseInUse) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.label}". It is currently in use by one or more courses.`,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: { _id: req.params.id } // Send back the ID for the frontend
    });
  } catch (error) {
    next(error);
  }
};