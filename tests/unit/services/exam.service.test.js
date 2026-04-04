const { mock } = require('jest-mock-extended');
const { updateExamById } = require('../../../app/exam/exam.service');
const { Exam, User } = require('../../../config/mongoose');
const { sendExamAnnouncementEmail } = require('../../../app/notifications/email.service');

jest.mock('../../../config/mongoose', () => ({
  Exam: {
    findById: jest.fn(),
  },
  User: {
    find: jest.fn(),
  },
}));

jest.mock('../../../app/notifications/email.service', () => ({
  sendExamAnnouncementEmail: jest.fn(),
}));

describe('Exam Service', () => {
  describe('updateExamById', () => {
    it('should call User.find with the correct schoolId when status is "announced"', async () => {
      const examId = '60d5f1f77e8a1d2c8c8fe3a8';
      const updateBody = { status: 'announced' };
      const exam = {
        _id: examId,
        name: 'Test Exam',
        schoolId: '60d5f1f77e8a1d2c8c8fe3a9',
        gradeId: '60d5f1f77e8a1d2c8c8fe3a7',
        session: '2025-2026',
        status: 'scheduled',
        save: jest.fn(),
      };
      const students = [
        { email: 'student1@test.com' },
        { email: 'student2@test.com' },
      ];

      Exam.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(exam),
      });
      User.find.mockResolvedValue(students);

      await updateExamById(examId, updateBody);

      expect(User.find).toHaveBeenCalledWith({
        gradeId: exam.gradeId,
        role: 'student',
        schoolId: exam.schoolId,
      });
      expect(sendExamAnnouncementEmail).toHaveBeenCalledTimes(2);
    });
  });
});
