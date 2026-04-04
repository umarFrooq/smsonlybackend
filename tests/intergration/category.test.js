const request = require("supertest");

const httpStatus = require("http-status");
const app = require('../../config/express');
const setupTestDB = require("../utils/setupTestDB");

const {
  electronics,
  computers,
  mobiles,
  iosMobile,
  androidMobile,
  mobilesAccessories,
  insertCategories,
} = require("../fixtures/category.fixture");
const {
  userOne,
  userTwo,
  supplierOne,
  supplierTwo,
  admin,
  adminTwo,
  insertUsers,
} = require("../fixtures/user.fixture");
const {
  userOneAccessToken,
  adminAccessToken,
} = require("../fixtures/token.fixture");

const db = require("../../config/mongoose");

setupTestDB();
const Category = db.Category;
describe("Category routes", () => {
  describe("POST /v1/categories", () => {
    let newCategory;
    beforeEach(() => {
      newCategory = {
        name: "wireless Mouse",
        commission:10
      };
    });

    test("should return 201 and successfully create new category with only name is ok", async () => {
      await insertUsers([admin, adminTwo, supplierOne]);

      const res = await request(app)
        .post("/v1/categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        name: newCategory.name,
        commission:newCategory.commission,
        gallery: [],
          //: false,
          type:"main",
          subCategories:expect.any(Array)
        // description: newCategory.description,
       
        // hasChildren: false,
        // children: [],
       // user: admin._id.toHexString(),
      });

      const dbCategory = await Category.findById(res.body.id);

      expect(dbCategory).toBeDefined();
      expect(dbCategory.toJSON()).toMatchObject({
        id: expect.anything(),
        name: newCategory.name,
        commission:newCategory.commission,
        gallery: [],
          //: false,
         type:"main",
         
        // description: newCategory.description,
        // children: [],
        // hasChildren: false,
        // gallery: [],
        //user: admin._id,
      });
    });
    test("should return 201 and successfully create new category with  name and description is ok", async () => {
      await insertUsers([admin, adminTwo, supplierOne]);
    newCategory.description="new category description"
      const res = await request(app)
        .post("/v1/categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        name: newCategory.name,
        commission:newCategory.commission,
        description: "new category description",
        
        gallery: [],
          //: false,
          type:"main",
          subCategories:expect.any(Array)
        // description: newCategory.description,
       
        // hasChildren: false,
        // children: [],
       // user: admin._id.toHexString(),
      });

      const dbCategory = await Category.findById(res.body.id);

      expect(dbCategory).toBeDefined();
      expect(dbCategory.toJSON()).toMatchObject({
        id: expect.anything(),
        name: newCategory.name,
        description: "new category description",
        gallery: [],
          //: false,
         type:"main",
   
        // description: newCategory.description,
        // children: [],
        // hasChildren: false,
        // gallery: [],
        //user: admin._id,
      });
    });
    test("should return 201 and successfully create new subCategory with a mainCategoryId if data is ok", async () => {
      await insertUsers([admin, adminTwo, supplierOne]);
      await insertCategories([electronics, computers, mobiles]);
      newCategory.mainCategory = electronics._id.toHexString();

      const res = await request(app)
        .post("/v1/categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.CREATED);
      expect(res.body).toEqual({
        id: expect.anything(),
        name: newCategory.name,
        commission:newCategory.commission,
        type:"sub",
        mainCategory: electronics._id.toHexString(),
        gallery: [],
        subCategories:expect.any(Array)
          //: false,
         
        // description: newCategory.description,
        // gallery: [],
        // parent: electronics._id.toHexString(),
        // hasChildren: false,
        // children: [],
        //user: admin._id.toHexString(),
      });

      const dbCategory = await Category.findById(res.body.id);

      expect(dbCategory).toBeDefined();
      expect(dbCategory.toJSON()).toMatchObject({
        id: expect.anything(),
        name: newCategory.name,
        commission:newCategory.commission,
        mainCategory: electronics._id,
        type:"sub",
        gallery: [],
          //: false,
        // description: newCategory.description,
        // gallery: [],
        //  hasChildren: false,
        // children: [],
        // user: admin._id,
      });
    });
    test("should return 404  with an invalid parentId if data is ok", async () => {
      await insertUsers([admin, adminTwo, supplierOne]);
      await insertCategories([computers, mobiles]);
      newCategory.mainCategory = electronics._id;

      const res = await request(app)
        .post("/v1/categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.NOT_FOUND);
    });
   
    // test("should return 201 and successfully create new category with main and gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);

    //   const res = await request(app)
    //     .post("/v1/categories")
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     mainImage: expect.any(String),
    //     gallery: expect.any(Array),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     mainImage: expect.any(String),
    //     gallery: expect.any(Array),
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });
    // test("should return 201 and successfully create new category with parentId , mainImage and gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);
    //   await insertCategories([electronics, mobiles]);
    //   // newCategory.parent=electronics._id;
    //   const res = await request(app)
    //     .post("/v1/categories")
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("parent", `${electronics._id}`)
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     mainImage: expect.any(String),
    //     gallery: expect.any(Array),
    //     parent: electronics._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     mainImage: expect.any(String),
    //     gallery: expect.any(Array),
    //     parent: electronics._id,
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });
    // test("should return 201 and successfully create new category with mainImage and with no gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, adminTwo]);

    //   const res = await request(app)
    //     .post("/v1/categories")

    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .expect(httpStatus.CREATED);
    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();
    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });

    // test("should return 201 and successfully create new category with parent and mainImage if data is ok", async () => {
    //   await insertUsers([admin, adminTwo]);

    //   await insertCategories([electronics, mobiles]);
    //   const res = await request(app)
    //     .post("/v1/categories")

    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("parent", `${electronics._id}`)
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     parent: electronics._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     parent: electronics._id,
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });
    // test("should return 201 and successfully create new category with only gallery  if data is ok", async () => {
    //   await insertUsers([admin, adminTwo]);

    //   const res = await request(app)
    //     .post("/v1/categories")

    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     gallery: expect.any(Array),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: expect.any(Array),
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });
    // test("should return 201 and successfully create new category with parent and only gallery  if data is ok", async () => {
    //   await insertUsers([admin, adminTwo]);
    //   await insertCategories([electronics, mobiles]);
    //   const res = await request(app)
    //     .post("/v1/categories")

    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("parent", `${electronics._id}`)
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     gallery: expect.any(Array),
    //     parent: electronics._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(res.body.id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: expect.any(Array),
    //     parent: electronics._id,
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });

    test("should return 401 error is access token is missing", async () => {
      await request(app)
        .post("/v1/categories")
        .send(newCategory)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user is not Admin", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/categories")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.FORBIDDEN);
    });
  });
 
  describe("POST /v1/categories/:categoryId", () => {
    beforeEach(() => {
      
      newCategory = {
        name: "Test category",

      };
    });

 
   
    
    test("should return 200 and successfully upload Category  mainImage and gallery if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers,mobiles]);

      const res = await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.OK);
    
      expect(res.body).toEqual({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        
        //: false,
        type:"main",
        subCategories:expect.any(Array)
       });

      const dbCategory = await Category.findById(electronics._id);
      expect(dbCategory).toBeDefined();

      expect(dbCategory.toJSON()).toMatchObject({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        //: false,
        type:"main",
       
      });
    });
   
    
   
    test("should return 200 and successfully update product data only with mainImage if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers,mobiles]);

      const res = await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        //: false,
        type:"main",
        subCategories:expect.any(Array)
       });

      const dbCategory = await Category.findById(electronics._id);
      expect(dbCategory).toBeDefined();

      expect(dbCategory.toJSON()).toMatchObject({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        //: false,
        type:"main",
      });
    });
  
  
  
    test("should return 200 and successfully  upload only gallery images if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers,mobiles]);

      const res = await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        
        //: false,
        type:"main",
        subCategories:expect.any(Array)
        
      });

      const dbCategory = await Category.findById(electronics._id);
      expect(dbCategory).toBeDefined();

      expect(dbCategory.toJSON()).toMatchObject({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        
        //: false,
        type:"main",
      
      });
    });
      
    
   
    test("should return 404 error if product already is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([ computers,mobiles]);

      
      await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.NOT_FOUND);
    });
   
    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([ electronics,computers,mobiles]);

      await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Content-type", "multipart/form-data")
        
        .expect(httpStatus.UNAUTHORIZED);
    });

    
    test("should return 404 if admin is uploading to category that don't exists", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([computers,mobiles]);

      await request(app)
        .post(`/v1/categories/${electronics._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if category is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await request(app)
        .post(`/v1/categories/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        .expect(httpStatus.BAD_REQUEST);
    });
   
  });


  describe("GET /v1/categories", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([
        userOne,
        userTwo,
        admin,
        adminTwo,
        supplierOne,
        supplierTwo,
      ]);
      await insertCategories([electronics, computers, mobiles]);
      const res = await request(app)
        .get("/v1/categories")
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0]).toEqual({
        id: electronics._id.toHexString(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: [],
        //:false,
        type:"main",
        subCategories: [],
        
        // hasChildren: false,
        // children: [],
        //user: admin._id.toHexString(),
      });
    });

    test("should correctly apply filter on category name field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers, mobiles]);
      const res = await request(app)
        .get("/v1/categories")
        .query({ name: electronics.name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(electronics._id.toHexString());
    });

    test("should correctly apply filter on category commission field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers, mobiles]);
      const res = await request(app)
        .get("/v1/categories")
        .query({ commission: electronics.commission })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(electronics._id.toHexString());
    });
    test("should correctly sort returned array if descending sort param is specified", async () => {
      await insertCategories([electronics, computers, mobiles]);
      const res = await request(app)
        .get("/v1/categories")
        .query({ sortBy: "name:desc" })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });

      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(mobiles._id.toHexString());
      expect(res.body.results[1].id).toBe(electronics._id.toHexString());
      expect(res.body.results[2].id).toBe(computers._id.toHexString());
    });

    test("should correctly sort returned array if ascending sort param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertCategories([electronics, computers, mobiles]);

      const res = await request(app)
        .get("/v1/categories")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ sortBy: "name:asc" })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(computers._id.toHexString());
      expect(res.body.results[1].id).toBe(electronics._id.toHexString());
      expect(res.body.results[2].id).toBe(mobiles._id.toHexString());
    });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertCategories([electronics, computers, mobiles]);

      const res = await request(app)
        .get("/v1/categories")
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(electronics._id.toHexString());
      expect(res.body.results[1].id).toBe(computers._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertCategories([electronics, computers, mobiles]);

      const res = await request(app)
        .get("/v1/categories")
        .query({ page: 2, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(mobiles._id.toHexString());
    });
  });

  //   describe("GET /v1/categories/getAllCategories", () => {
//     test("should return all categories", async () => {
//       await insertUsers([
//         userOne,
//         userTwo,
//         admin,
//         adminTwo,
//         supplierOne,
//         supplierTwo,
//       ]);
//       await insertCategories([electronics, computers, mobiles]);
//       const res = await request(app)
//         .get("/v1/categories/getAllCategories")
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(3);
//       expect(res.body[0]).toEqual({
//         id: electronics._id.toHexString(),
//         name: electronics.name,
//         description: electronics.description,
//         gallery: [],
//         hasChildren: false,
//         children: [],
//         //user: admin._id.toHexString(),
//       });
      
//     });
//  });

  describe("GET /v1/categories/:categoryId", () => {
    test("should return 200 and the category object if data is ok", async () => {
      await insertUsers([admin]);

      await insertCategories([electronics, computers, mobiles]);

      const res = await request(app)
        .get(`/v1/categories/${electronics._id}`)
        .send()
        .expect(httpStatus.OK);
    
      expect(res.body).toEqual({
        id: expect.anything(),
        name: electronics.name,
        commission:electronics.commission,
        description: electronics.description,
        gallery: expect.any(Array),
        //:false,
        type:"main",
        subCategories: [],
        
      });
    });

    test("should return 400 error if categoryID is not a valid mongo id", async () => {
      await insertCategories([electronics, computers, mobiles]);

      await request(app)

        .get("/v1/categories/invalidId")


        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if product is not found", async () => {
      await insertCategories([ computers, mobiles]);

      await request(app)
        .get(`/v1/categories/${electronics._id}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/categories/:categoryId", () => {
    beforeEach(() => {
      newCategory = {
        name: "Computer Category",
        commission:5,
        description: "Category for Laptops",
      };
    });

    test("should return 200 and successfully update category if data is ok without images", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers, mobiles]);

      const res = await request(app)
        .patch(`/v1/categories/${computers._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        // .field("name", newCategory.name)
        // .field("description", newCategory.description)
        // // .field("parent",electronics._id.toHexString() )
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: computers._id.toHexString(),
        name: newCategory.name,
        commission:newCategory.commission,
        description: newCategory.description,
        gallery: expect.any(Array),
        //:false,
        type:"main",
        // hasChildren: false,
        // children: [],
        // gallery: [],
        subCategories:expect.any(Array)
       // user: admin._id.toHexString(),
      });

      const dbCategory = await Category.findById(computers._id);
      expect(dbCategory).toBeDefined();

      expect(dbCategory.toJSON()).toMatchObject({
        id: computers._id.toHexString(),
        name: newCategory.name,
        commission:newCategory.commission,
        description: newCategory.description,
        //gallery: [],
        //user: admin._id,
        // hasChildren: false,
        // children: [],
      });
    });

//     test("should return 400 if parent category is not found ", async () => {
//       await insertUsers([admin, supplierOne, supplierTwo]);
//       await insertCategories([computers, mobiles]);
// newCategory.mainCategory=`${electronics._id}`
//       await request(app)
//         .patch(`/v1/categories/${computers._id}`)
//         .set("Authorization", `Bearer ${adminAccessToken}`)
//         //.set("Content-type", "multipart/form-data")
//         // .field("name", newCategory.name)
//         // .field("description", newCategory.description)
//         // .field("parent", `${electronics._id}`)
//         .send(newCategory)
//         .expect(httpStatus.NOT_FOUND);
//     });

    // test("should return 200 and successfully update category with a parent if data is ok without images", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertCategories([electronics, computers, mobiles]);

    //   const res = await request(app)
    //     .patch(`/v1/categories/${computers._id}`)
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .field("parent", `${electronics._id}`)
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: computers._id.toHexString(),
    //     gallery: [],
    //     name: newCategory.name,
    //     parent: electronics._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //     description: newCategory.description,

    //     //user: admin._id.toHexString(),
    //   });

    //   const dbCategory = await Category.findById(computers._id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: computers._id.toHexString(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: [],
    //     //user: admin._id,
    //     parent: electronics._id,
    //     hasChildren: false,
    //     children: [],
    //   });
    // });

    // test("should return 200 and successfully  category by replacing parent", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);

    //   mobilesAccessories.parent = mobiles._id;
    //   mobiles.children = [`${mobilesAccessories._id}`];
    //   await insertCategories([
    //     electronics,
    //     computers,
    //     mobiles,
    //     mobilesAccessories,
    //   ]);
    //   const res = await request(app)
    //     .patch(`/v1/categories/${mobilesAccessories._id}`)
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .field("parent", `${electronics._id}`)
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: mobilesAccessories._id.toHexString(),
    //     gallery: [],
    //     name: newCategory.name,
    //     parent: electronics._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //     description: newCategory.description,

    //     //user: admin._id.toHexString(),
    //   });

    //   const dbCategory = await Category.findById(mobilesAccessories._id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: mobilesAccessories._id.toHexString(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: [],
    //    // user: admin._id,
    //     parent: electronics._id,
    //     hasChildren: false,
    //     children: [],
    //   });
    // });

    // test("should return 200 and successfully update category data with mainImage and gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertCategories([electronics, computers, mobiles]);

    //   const res = await request(app)
    //     .patch(`/v1/categories/${electronics._id}`)
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: electronics._id.toHexString(),
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id.toHexString(),
    //   });

    //   const dbCategory = await Category.findById(electronics._id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: electronics._id.toHexString(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });

    // test("should return 200 and successfully update category data only with mainImage if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertCategories([electronics, computers, mobiles]);

    //   const res = await request(app)
    //     .patch(`/v1/categories/${electronics._id}`)
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .expect(httpStatus.OK);

    //   expect(res.body).toEqual({
    //     id: electronics._id.toHexString(),
    //     gallery: [],
    //     mainImage: expect.any(String),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id.toHexString(),
    //   });

    //   const dbCategory = await Category.findById(electronics._id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: electronics._id.toHexString(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: [],
    //     mainImage: expect.any(String),
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });

    // test("should return 200 and successfully update category data with only gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertCategories([electronics, computers, mobiles]);

    //   const res = await request(app)
    //     .patch(`/v1/categories/${electronics._id}`)
    //     .set("Authorization", `Bearer ${adminAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("name", newCategory.name)
    //     .field("description", newCategory.description)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)

    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: electronics._id.toHexString(),
    //     gallery: expect.any(Array),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     //user: admin._id.toHexString(),
    //     hasChildren: false,
    //     children: [],
    //   });

    //   const dbCategory = await Category.findById(electronics._id);
    //   expect(dbCategory).toBeDefined();

    //   expect(dbCategory.toJSON()).toMatchObject({
    //     id: electronics._id.toHexString(),
    //     name: newCategory.name,
    //     description: newCategory.description,
    //     gallery: expect.any(Array),
    //     hasChildren: false,
    //     children: [],
    //     //user: admin._id,
    //   });
    // });

    test("should return 404 error if category already is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, mobiles]);
      const updateCategory = {
        name: "newCategory.name",
        commission:5,
        description: "faker.commerce.product Material()",
      };
      await request(app)
        .patch(`/v1/categories/${computers._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(updateCategory)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin]);
      await insertCategories([electronics, mobiles]);

      await request(app)
        .patch(`/v1/categories/${mobiles._id}`)
        .send(newCategory)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 404 if admin is updating category that is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, mobiles]);

      await request(app)
        .patch(`/v1/categories/${computers._id}`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if categoryId is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([electronics, computers, mobiles]);
      await request(app)
        .patch(`/v1/categories/invalidId`)
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send(newCategory)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("DELETE /v1/categories/:categoryId", () => {
  test("should return 204 if data is ok ", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertCategories([electronics, computers, mobiles]);
    await request(app)
      .delete(`/v1/categories/${computers._id}`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send()
      .expect(httpStatus.NO_CONTENT);

    const dbCategory = await Category.findOne({_id:computers._id});
    expect(dbCategory).toBeNull();
  });
  test("should return 204 error if deleting a parent", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
 
    computers.mainCategory=electronics._id.toHexString()
    mobiles.mainCategory=electronics._id.toHexString()
 
    await insertCategories([
      electronics,
      computers,
      mobiles,
      
    ]);

    await request(app)
      .delete(`/v1/categories/${electronics._id}`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send()
      .expect(httpStatus.NO_CONTENT);
  
      const dbElectronics = await Category.findOne({_id:electronics._id});
      expect(dbElectronics).toBeNull();
      const dbComputers = await Category.findOne({_id:computers._id});
      expect(dbComputers).toBeNull();
      const dbMobiles = await Category.findOne({_id:mobiles._id});
      expect(dbMobiles).toBeNull();
  
    });

  test("should return 401 error if access token is missing", async () => {
    await request(app)
      .delete(`/v1/categories/${electronics._id}`)
      .send()
      .expect(httpStatus.UNAUTHORIZED);
  });

 
  test("should return 400 error if categoryId is not a valid mongo id", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertCategories([electronics, computers, mobiles]);
    await request(app)
      .delete("/v1/categories/invalidId")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send()
      .expect(httpStatus.BAD_REQUEST);
  });

  test("should return 404 error if category already is not found", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertCategories([electronics, computers]);

    await request(app)
      .delete(`/v1/categories/${mobiles._id}`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .send()
      .expect(httpStatus.NOT_FOUND);
  });
});
});

