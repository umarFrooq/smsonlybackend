const request = require('supertest');
const httpStatus = require('http-status');
const path = require('path');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { insertUsers, studentOne, studentTwo, admin, superadmin } = require('../fixtures/user.fixture');
const { adminAccessToken, superadminAccessToken, studentOneAccessToken } = require('../fixtures/token.fixture');
const { insertSchools, schoolOne } = require('../fixtures/school.fixture');
const { insertBranches, branchOne } = require('../fixtures/branch.fixture');
const User = require('../../app/user/user.model');

setupTestDB();

describe('Certificate routes', () => {
  beforeEach(async () => {
    await insertSchools([schoolOne]);
    await insertBranches([branchOne]);
    await insertUsers([studentOne, studentTwo, admin, superadmin]);
  });

  describe('GET /certificates/students', () => {
    test('should return 200 and a list of students for an admin', async () => {
      const res = await request(app)
        .get('/certificates/students')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].certificate).toBeNull();
    });

    test('should return 403 for a student', async () => {
      await request(app)
        .get('/certificates/students')
        .set('Authorization', `Bearer ${studentOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe('POST /certificates/:studentId', () => {
    test('should return 201 and upload a certificate for a student', async () => {
      const res = await request(app)
        .post(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'))
        .expect(httpStatus.CREATED);

      expect(res.body.certificate).toBeDefined();
      expect(res.body.certificate.url).toBeDefined();

      const dbUser = await User.findById(studentOne._id);
      expect(dbUser.certificate).toBeDefined();
      expect(dbUser.certificate.url).toEqual(res.body.certificate.url);
    });

    test('should return 400 if a certificate already exists', async () => {
      await request(app)
        .post(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'));

      await request(app)
        .post(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'))
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('PUT /certificates/:studentId', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'));
    });

    test('should return 200 and update a certificate', async () => {
        const res = await request(app)
        .put(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'))
        .expect(httpStatus.OK);

      expect(res.body.certificate).toBeDefined();
    });
  });

  describe('DELETE /certificates/:studentId', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .attach('certificateImage', path.resolve(__dirname, 'testFiles/test.jpg'));
    });

    test('should return 204 and delete a certificate', async () => {
      await request(app)
        .delete(`/certificates/${studentOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(studentOne._id);
      expect(dbUser.certificate).toBeNull();
    });
  });
});
