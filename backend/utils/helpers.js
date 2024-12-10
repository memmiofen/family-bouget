// utils/helpers.js

/**
 * פונקציה שמוודאת אם ערך הוא מספר חיובי
 * @param {number} value - הערך לבדיקה
 * @returns {boolean} true אם חיובי, אחרת false
 */
function isPositiveNumber(value) {
    return typeof value === 'number' && value > 0;
}

/**
 * פונקציה להמרת תאריך לפורמט קריא
 * @param {Date} date - התאריך להמרה
 * @returns {string} תאריך בפורמט קריא
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = {
    isPositiveNumber,
    formatDate,
};
