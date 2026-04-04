const faker = require("faker");
const  Review  = require('../../../app/review/review.model');


describe("Review model", () => {
  describe("Review validation", () => {
    let newReview;
    beforeEach(() => {
      newReview = {
        product: "5f2c0c19a1b13739c4c38975",
        rating: 5,
        comment: "awesome",
        reviewer: "5f2c0c19a1b13739c4c38975"
      };
    });

    test("should correctly validate a valid review", async () => {
      await expect(new Review(newReview).validate()).resolves.toBeUndefined();
    });
  });

  describe("Review toJSON()", () => {
    test("should  return Review to JSON ", () => {
      
      newReview = {
        product: "5f2c0c19a1b13739c4c38975",
        rating: 5,
        comment: "awesome",
        reviewer: "5f2c0c19a1b13739c4c38975"
      };
      expect(new Review(newReview).toJSON());
    });
  });
});
