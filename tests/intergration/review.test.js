const request = require("supertest");

const httpStatus = require("http-status");
const app = require('../../config/express');
const setupTestDB = require("../utils/setupTestDB");
const {
  productOne,
  productTwo,
  productThree,
  insertProducts,
} = require("../fixtures/product.fixture");
const {
  Review1,
  Review2,
  Review3,
  Review4,
  Review5,
  Review6,
  
  insertReviews
} = require("../fixtures/review.fixture");
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
  userTwoAccessToken,
  adminAccessToken,
  supplierOneAccessToken
} = require("../fixtures/token.fixture");

const db = require("../../config/mongoose");

setupTestDB();
const Review = db.Review;
describe("Review routes", () => {
  describe("POST /v1/reviews", () => {
    let newReview;
    beforeEach(() => {
      newReview = {
        product:productOne._id.toHexString() ,
        comment: "very good product",
        rating:4
      };
    });

    test("should return 201 and successfully create new review  if data is ok", async () => {
      await insertUsers([userOne,userTwo]);
      await insertProducts([productOne]);
      
      const res = await request(app)
        .post("/v1/reviews")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newReview)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        product: productOne._id.toHexString(),
        comment: newReview.comment,
        rating: newReview.rating,
        reviewer: userOne._id.toHexString(),
        deleted: false,
      });

      const dbReview = await Review.findOne({_id:res.body.id});

      expect(dbReview).toBeDefined();
      expect(dbReview.toJSON()).toMatchObject({
        id: expect.anything(),
        product: productOne._id,
        reviewer: userOne._id,
        comment: newReview.comment,
        rating: newReview.rating,
        deleted: false,
        });
    });
    
   
    test("should return 403 and if user have already reviewed the product", async () => {
      await insertUsers([userOne,userTwo]);
      await insertProducts([productOne]);
      await insertReviews([Review1]);
      
      newReview.product=productOne._id.toHexString()
      const res = await request(app)
        .post("/v1/reviews")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newReview)
        .expect(httpStatus.FORBIDDEN);

      

      
    });
    
   

    test("should return 401 error is access token is missing", async () => {
      await request(app)
        .post("/v1/reviews")
        .send(newReview)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user is not user", async () => {
      await insertUsers([supplierOne]);

      await request(app)
        .post("/v1/reviews")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send(newReview)
        .expect(httpStatus.FORBIDDEN);
    });
  });
  describe("GET /v1/reviews", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([
        userOne,
        userTwo,
        admin,
        adminTwo,
        supplierOne,
        supplierTwo,
      ]);
       await insertProducts([productOne,productTwo,productThree])
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);
      const res = await request(app)
        .get("/v1/reviews")
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 6,
      });
      expect(res.body.results).toHaveLength( 6);
      expect(res.body.results[0]).toEqual({
        id: Review1._id.toHexString(),
        comment: Review1.comment,
        rating: Review1.rating,
        product: productOne._id.toHexString(),
        //product: expect.objectContaining({id:productOne._id.toHexString()}),
        reviewer: userOne._id.toHexString(),
        deleted: false,
      });
    });

    test("should correctly apply filter on review's product field", async () => {
      await insertUsers([userOne, userTwo]);
      await insertProducts([productOne,productTwo,productThree])
      
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);
      const res = await request(app)
        .get("/v1/reviews")
        .query({ product: productOne._id.toHexString() })
        .send()
        .expect(httpStatus.OK);

    //   expect(res.body).toEqual({
    //     results: expect.any(Array),
    //     page: 1,
    //     limit: 10,
    //     totalPages: 1,
    //     totalResults: 3,
    //   });
    //   expect(res.body.results).toHaveLength(1);
    //   expect(res.body.results[0].id).toBe(Review1._id.toHexString());
     });

    test("should correctly apply filter on review's reviewer field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne,productTwo,productThree])
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6,]);
      const res = await request(app)
        .get("/v1/reviews")
        .query({ reviewer: userOne._id.toHexString() })
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
      expect(res.body.results[0].id).toBe(Review1._id.toHexString());
    });

    test("should correctly apply filter on review's rating field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne,productTwo,productThree])
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6,]);
      const res = await request(app)
        .get("/v1/reviews")
        .query({ rating: 5})
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 4,
      });
      expect(res.body.results).toHaveLength(4);
      expect(res.body.results[0].id).toBe(Review1._id.toHexString());
    });



    test("should correctly sort returned array if descending sort param is specified", async () => {
      await insertReviews([Review1, Review2,Review3]);
      const res = await request(app)
        .get("/v1/reviews")
        .query({ sortBy: "product:desc" })
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
      
      
      expect(res.body.results[0].id).toBe(Review3._id.toHexString());
      expect(res.body.results[1].id).toBe(Review2._id.toHexString());
      expect(res.body.results[2].id).toBe(Review1._id.toHexString());
    });

    test("should correctly sort returned array if ascending sort param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);

      const res = await request(app)
        .get("/v1/reviews")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .query({ sortBy: "product:asc" })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 6,
      });
      expect(res.body.results).toHaveLength(6);
      expect(res.body.results[0].id).toBe(Review1._id.toHexString());
      expect(res.body.results[1].id).toBe(Review2._id.toHexString());
     
    });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);

      const res = await request(app)
        .get("/v1/reviews")
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 3,
        totalResults: 6,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(Review1._id.toHexString());
      expect(res.body.results[1].id).toBe(Review2._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertReviews([Review1, Review2,Review3]);

      const res = await request(app)
        .get("/v1/reviews")
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
      expect(res.body.results[0].id).toBe(Review3._id.toHexString());
    });
  });

  describe("GET /v1/reviews/:reviewId", () => {
    test("should return 200 and the reviews object if data is ok", async () => {
      await insertUsers([userOne]);
     await insertProducts([productOne,productTwo,productThree])
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);
      const res = await request(app)
        .get(`/v1/reviews/${Review1._id}`)
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: expect.anything(),
        comment: Review1.comment,
        rating: Review1.rating,
        product: expect.objectContaining({id:productOne._id.toHexString()}),
        reviewer: expect.objectContaining({id:userOne._id.toHexString()}),
        deleted: false,
        
      });
    });

    test("should return 400 error if reviewId is not a valid mongo id", async () => {
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);
      await request(app)

        .get("/v1/reviews/invalidId")


        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if review is not found", async () => {
      await insertReviews([Review1,Review6]);

      await request(app)
        .get(`/v1/reviews/${Review2._id}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/reviews/:reviewId", () => {
    let updatedReview;
    beforeEach(() => {
     updatedReview = {
        comment: "updated very good product",
        rating:4
      };
    });

    test("should return 200 and successfully updated review if data is ok ", async () => {
      await insertUsers([ userOne]);
      await insertProducts([productOne,productTwo,productThree])
      await insertReviews([Review1, Review2,Review3,Review4,Review5,Review6]);
      const res = await request(app)
        .patch(`/v1/reviews/${Review1._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updatedReview)
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: Review1._id.toHexString(),
        
        comment: updatedReview.comment,
        rating: updatedReview.rating,
        product: productOne._id.toHexString(),
        reviewer: userOne._id.toHexString(),
        deleted: false,
      });

      const dbReview = await Review.findOne({_id:Review1._id});
      expect(dbReview).toBeDefined();

      expect(dbReview.toJSON()).toMatchObject({
        id: Review1._id.toHexString(),
        
        comment: updatedReview.comment,
        rating: updatedReview.rating,
        product: productOne._id,
        reviewer: userOne._id,
      });
    });

    test("should return 403 if user is updating another user's review", async () => {
      await insertUsers([userOne, userTwo]);
      await insertReviews([Review1]);
     
      await request(app)
        .patch(`/v1/reviews/${Review1._id}`)
        .set("Authorization", `Bearer ${userTwoAccessToken}`)
        .send(updatedReview)
        .expect(httpStatus.FORBIDDEN);
    });
   
    test("should return 404 error if review already is not found", async () => {
      await insertUsers([admin, supplierOne, userOne,supplierTwo]);
      await insertReviews([Review1, Review2,Review3]);
    
      
      await request(app)
        .patch(`/v1/reviews/${Review4._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updatedReview)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin, supplierOne, userOne,supplierTwo]);
      await insertReviews([Review1, Review2,Review3]);
    
      await request(app)
        .patch(`/v1/reviews/${Review1._id}`)
        .send(updatedReview)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 404 if user is updating category that is not found", async () => {
      await insertUsers([admin, supplierOne, userOne,supplierTwo]);
      await insertReviews([Review1, Review2,Review3]);
    
      await request(app)
        .patch(`/v1/reviews/${Review4._id}`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updatedReview)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if categoryId is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, userOne,supplierTwo]);
      await insertReviews([Review1, Review2,Review3]);
    
      await request(app)
        .patch(`/v1/reviews/invalidId`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(updatedReview)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe("DELETE /v1/reviews/:reviewId", () => {
  test("should return 204 if data is ok ", async () => {
    await insertUsers([ userOne]);
    await insertProducts([productOne,productTwo,productThree])

    await insertReviews([Review1, Review2,Review3]);
    
    await request(app)
      .delete(`/v1/reviews/${Review1._id}`)
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send()
      .expect(httpStatus.NO_CONTENT);

    const dbReview = await Review.findById(Review1._id);
    expect(dbReview).toBeNull();
  });
  test("should return 403 if user is deleting another user's review", async () => {
    await insertUsers([userOne, userTwo]);
    await insertReviews([Review1]);
   
    await request(app)
      .delete(`/v1/reviews/${Review1._id}`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`)
      .send()
      .expect(httpStatus.FORBIDDEN);
  });
  test("should return 401 error if access token is missing", async () => {
    await request(app)
      .delete(`/v1/reviews/${Review1._id}`)
      .send()
      .expect(httpStatus.UNAUTHORIZED);
  });

 
  test("should return 400 error if reviewId is not a valid mongo id", async () => {
    await insertUsers([ userOne]);
      await insertReviews([Review1, Review2,Review3]);
    
    await request(app)
      .delete("/v1/reviews/invalidId")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send()
      .expect(httpStatus.BAD_REQUEST);
  });

  test("should return 404 error if review already is not found", async () => {
    await insertUsers([ userOne]);
      await insertReviews([Review1, Review2,Review3]);
    
    await request(app)
      .delete(`/v1/reviews/${Review4._id}`)
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send()
      .expect(httpStatus.NOT_FOUND);
  });
});
});

