const mongoose = require('mongoose');
const Grade = require('../../app/grade/grade.model');
const { schoolOne } = require('./school.fixture');

const gradeOne = {
    _id: mongoose.Types.ObjectId(),
    title: 'Grade 1',
    schoolId: schoolOne._id,
    sections: ['A', 'B', 'C'],
};

const gradeTwo = {
    _id: mongoose.Types.ObjectId(),
    title: 'Grade 2',
    schoolId: schoolOne._id,
    sections: ['A', 'B'],
};

const insertGrades = async (grades) => {
    await Grade.insertMany(grades);
};

module.exports = {
    gradeOne,
    gradeTwo,
    insertGrades,
};
