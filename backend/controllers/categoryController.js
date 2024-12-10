// controllers/categoryController.js
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// הוספת קטגוריה חדשה
exports.addCategory = async (req, res) => {
    try {
        const { name, description, icon, color } = req.body;

        // בדיקה אם הקטגוריה כבר קיימת
        const existingCategory = await Category.findOne({ name: name.toLowerCase() });
        if (existingCategory) {
            return res.status(400).json({ 
                message: 'קטגוריה עם שם זה כבר קיימת' 
            });
        }

        // יצירת קטגוריה חדשה
        const newCategory = new Category({
            name: name.toLowerCase(),
            description,
            icon: icon || 'default-icon',
            color: color || '#000000',
            order: (await Category.countDocuments()) + 1
        });

        await newCategory.save();

        // עדכון התקציב הקיים עם הקטגוריה החדשה
        await Budget.updateMany(
            {},
            { 
                $push: { 
                    categories: {
                        name: newCategory.name,
                        limit: 0,
                        used: 0
                    }
                }
            }
        );

        res.status(201).json({
            message: 'הקטגוריה נוספה בהצלחה',
            category: newCategory
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בהוספת הקטגוריה',
            error: error.message 
        });
    }
};

// קבלת כל הקטגוריות
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ order: 1 })
            .select('-__v');

        // הוספת סטטיסטיקות לכל קטגוריה
        const categoriesWithStats = await Promise.all(categories.map(async (category) => {
            const stats = await getCategoryStats(category.name);
            return {
                ...category.toObject(),
                statistics: stats
            };
        }));

        res.json(categoriesWithStats);

    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בקבלת הקטגוריות',
            error: error.message 
        });
    }
};

// עדכון קטגוריה
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, order } = req.body;

        // בדיקה אם הקטגוריה קיימת
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({ message: 'הקטגוריה לא נמצאה' });
        }

        // בדיקה אם השם החדש כבר קיים (אם יש שינוי בשם)
        if (name && name !== existingCategory.name) {
            const duplicateName = await Category.findOne({ 
                name: name.toLowerCase(),
                _id: { $ne: id }
            });
            if (duplicateName) {
                return res.status(400).json({ message: 'קטגוריה עם שם זה כבר קיימת' });
            }
        }

        // עדכון הקטגוריה
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { 
                $set: {
                    name: name?.toLowerCase(),
                    description,
                    icon,
                    color,
                    order
                }
            },
            { new: true }
        );

        // אם שונה השם, צריך לעדכן גם את ההוצאות והתקציבים
        if (name && name !== existingCategory.name) {
            await Promise.all([
                Expense.updateMany(
                    { category: existingCategory.name },
                    { $set: { category: name.toLowerCase() } }
                ),
                Budget.updateMany(
                    { 'categories.name': existingCategory.name },
                    { $set: { 'categories.$.name': name.toLowerCase() } }
                )
            ]);
        }

        res.json({
            message: 'הקטגוריה עודכנה בהצלחה',
            category: updatedCategory
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בעדכון הקטגוריה',
            error: error.message 
        });
    }
};

// מחיקת קטגוריה
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // בדיקה אם יש הוצאות בקטגוריה
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'הקטגוריה לא נמצאה' });
        }

        const expensesCount = await Expense.countDocuments({ category: category.name });
        if (expensesCount > 0) {
            return res.status(400).json({ 
                message: 'לא ניתן למחוק קטגוריה שיש בה הוצאות',
                expensesCount 
            });
        }

        // מחיקת הקטגוריה מהתקציבים
        await Budget.updateMany(
            {},
            { $pull: { categories: { name: category.name } } }
        );

        // מחיקת הקטגוריה
        await Category.findByIdAndDelete(id);

        // סידור מחדש של הסדר
        await reorderCategories();

        res.json({ message: 'הקטגוריה נמחקה בהצלחה' });

    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה במחיקת הקטגוריה',
            error: error.message 
        });
    }
};

// סידור מחדש של סדר הקטגוריות
const reorderCategories = async () => {
    const categories = await Category.find().sort({ order: 1 });
    await Promise.all(categories.map((category, index) => 
        Category.findByIdAndUpdate(category._id, { order: index + 1 })
    ));
};

// קבלת סטטיסטיקות לקטגוריה
const getCategoryStats = async (categoryName) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthlyStats, yearlyStats] = await Promise.all([
        Expense.aggregate([
            {
                $match: {
                    category: categoryName,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]),
        Expense.aggregate([
            {
                $match: {
                    category: categoryName,
                    date: { $gte: new Date(now.getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    return {
        monthly: monthlyStats[0] || { totalAmount: 0, count: 0, avgAmount: 0 },
        yearly: yearlyStats
    };
};

module.exports = exports;