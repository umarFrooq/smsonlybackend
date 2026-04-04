const mongoose = require('mongoose');
const Exam = require('../../app/exam/exam.model');
const { gradeOne, gradeTwo } = require('./grade.fixture');
const { schoolOne } = require('./school.fixture');
const { admin } = require('./user.fixture');

const examOne = {
    _id: mongoose.Types.ObjectId(),
    name: 'Mid-Term Exam',
    session: '2024-2025',
    gradeId: gradeOne._id,
    schoolId: schoolOne._id,
    createdBy: admin._id,
};

const examTwo = {
    _id: mongoose.Types.ObjectId(),
    name: 'Final Exam',
    session: '2024-2025',
    gradeId: gradeTwo._id,
    schoolId: schoolOne._id,
    createdBy: admin._id,
};

const insertExams = async (exams) => {
    await Exam.insertMany(exams);
};

module.exports = {
    examOne,
    examTwo,
    insertExams,
};
