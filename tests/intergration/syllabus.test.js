const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');

const Subject = require('../../app/subject/subject.model');
const Syllabus = require('../../app/syllabus/syllabus.model');

const { schoolOne, insertSchools } = require('../fixtures/school.fixture');
const Branch = require('../../app/branch/branch.model');
// const { branchOne, insertBranches } = require('../fixtures/branch.fixture');
const { gradeOne, insertGrades } = require('../fixtures/grade.fixture');
const { admin, insertUsers } = require('../fixtures/user.fixture');
const { adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Syllabus routes', () => {
  let subject;

  beforeEach(async () => {
    await insertSchools([schoolOne]);
    // Create a branch with required fields
    const branch = await Branch.create({
      _id: require('mongoose').Types.ObjectId(),
      name: 'Main Branch',
      address: {},
      branchCode: 'BR001',
      schoolId: schoolOne._id,
      status: 'active',
      type: 'main',
    });
    // set branchOne reference for subject creation
    const branchOneRef = branch;
    await insertGrades([gradeOne]);
    await insertUsers([admin]);

    subject = await Subject.create({
      _id: require('mongoose').Types.ObjectId(),
      title: 'English',
      subjectCode: 'ENG-1',
      description: 'English subject',
      creditHours: 1,
      schoolId: schoolOne._id,
      branchId: branchOneRef._id,
      gradeId: gradeOne._id,
    });
  });

  test('POST /v1/syllabi -> create, GET list, GET by id, PATCH, timeline and DELETE', async () => {
    // Create
    const payload = {
      title: 'English Syllabus',
      branchId: branchOne._id.toString(),
      gradeId: gradeOne._id.toString(),
      subjectId: subject._id.toString(),
      year: 2025,
      items: [
        { month: 1, chapters: ['Chapter 1', 'Chapter 2'], targetNotes: 'Intro' },
        { month: 2, chapters: ['Chapter 3'], targetNotes: '' },
      ],
    };

    const createRes = await request(app)
      .post('/v1/syllabi')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(payload)
      .expect(httpStatus.CREATED);

    expect(createRes.body).toHaveProperty('data');
    const created = createRes.body.data;
    expect(created).toMatchObject({ title: 'English Syllabus', year: 2025 });
    expect(Array.isArray(created.items)).toBe(true);
    expect(created.items.length).toBe(2);

    // List
    const listRes = await request(app)
      .get('/v1/syllabi')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ gradeId: gradeOne._id.toString() })
      .expect(httpStatus.OK);

    expect(listRes.body).toHaveProperty('data');
    const listData = listRes.body.data;
    // pagination plugin returns results in 'results' or similar; allow either array or object
    expect(listData).toBeDefined();

    // Get by id
    const getRes = await request(app)
      .get(`/v1/syllabi/${created.id || created._id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(httpStatus.OK);

    expect(getRes.body.data).toHaveProperty('title', 'English Syllabus');

    // Patch
    const patchRes = await request(app)
      .patch(`/v1/syllabi/${created.id || created._id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ title: 'Updated Syllabus' })
      .expect(httpStatus.OK);

    expect(patchRes.body.data).toHaveProperty('title', 'Updated Syllabus');

    // Timeline
    const timelineRes = await request(app)
      .get(`/v1/syllabi/grade/${gradeOne._id.toString()}/subject/${subject._id.toString()}/timeline`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ year: 2025 })
      .expect(httpStatus.OK);

    expect(timelineRes.body).toHaveProperty('data');

    // Delete
    await request(app)
      .delete(`/v1/syllabi/${created.id || created._id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(httpStatus.OK);

    // Ensure deleted
    const afterGet = await request(app)
      .get(`/v1/syllabi/${created.id || created._id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(httpStatus.NOT_FOUND);
  });
});
