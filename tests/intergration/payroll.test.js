const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { Payroll } = require('../../app/payroll');

setupTestDB();

const { User } = require('../../app/user');
const { Salary } = require('../../app/payroll/salary.model');

describe('Payroll routes', () => {
  describe('POST /payrolls/generate', () => {
    let teacher;
    let salary;

    beforeEach(async () => {
      teacher = await User.create({
        name: 'Test Teacher',
        email: 'teacher@example.com',
        password: 'password123',
        role: 'teacher',
        schoolId: '60c72b2f9b1e8a001f8e8b8b',
        branchId: '60c72b2f9b1e8a001f8e8b8c',
      });

      salary = await Salary.create({
        teacherId: teacher.id,
        schoolId: '60c72b2f9b1e8a001f8e8b8b',
        branchId: '60c72b2f9b1e8a001f8e8b8c',
        basic: 50000,
      });
    });

    it('should return 201 and generate payrolls for all teachers in a branch', async () => {
      const res = await request(app)
        .post('/payrolls/generate')
        .send({
          schoolId: '60c72b2f9b1e8a001f8e8b8b',
          branchId: '60c72b2f9b1e8a001f8e8b8c',
          month: 1,
          year: 2022,
        })
        .expect(httpStatus.CREATED);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toEqual({
        id: expect.anything(),
        teacher: teacher.id.toString(),
        school: '60c72b2f9b1e8a001f8e8b8b',
        branch: '60c72b2f9b1e8a001f8e8b8c',
        month: 1,
        year: 2022,
        basicSalary: 50000,
        bonuses: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 50000,
        status: 'Unpaid',
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });
  });
});
