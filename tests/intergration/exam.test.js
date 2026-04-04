const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { schoolOne, insertSchools } = require('../fixtures/school.fixture');
const { gradeOne, gradeTwo, insertGrades } = require('../fixtures/grade.fixture');
const { examOne, examTwo, insertExams } = require('../fixtures/exam.fixture');
const db = require("../../config/mongoose");

setupTestDB();

const Exam = db.Exam;

describe('Exam routes', () => {
    describe('POST /v1/exams', () => {
        let newExam;

        beforeEach(() => {
            newExam = {
                name: faker.lorem.words(2),
                session: '2025-2026',
                gradeId: gradeOne._id,
                schoolId: schoolOne._id,
                createdBy: admin._id,
            };
        });

        test('should return 201 and successfully create new exam if data is ok', async () => {
            await insertUsers([admin]);
            await insertSchools([schoolOne]);
            await insertGrades([gradeOne]);

            const res = await request(app)
                .post('/v1/exams')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newExam)
                .expect(httpStatus.CREATED);

            expect(res.body).toEqual({
                id: expect.anything(),
                name: newExam.name,
                session: newExam.session,
                gradeId: newExam.gradeId.toHexString(),
                schoolId: newExam.schoolId.toHexString(),
                createdBy: newExam.createdBy.toHexString(),
                status: 'scheduled',
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
            });

            const dbExam = await Exam.findById(res.body.id);
            expect(dbExam).toBeDefined();
        });

        test('should return 401 error is access token is missing', async () => {
            await request(app).post('/v1/exams').send(newExam).expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 403 error if logged in user is not admin', async () => {
            await insertUsers([userOne]);

            await request(app)
                .post('/v1/exams')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newExam)
                .expect(httpStatus.FORBIDDEN);
        });
    });
    describe('GET /v1/exams', () => {
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([admin]);
            await insertSchools([schoolOne]);
            await insertGrades([gradeOne, gradeTwo]);
            await insertExams([examOne, examTwo]);

            const res = await request(app)
                .get('/v1/exams')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(2);
        });
    });
});
