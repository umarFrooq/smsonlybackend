const faker = require("faker");
const Product = require('../../../models/product');


describe("Product model", () => {
  describe("Product validation", () => {
    let newProduct;
    beforeEach(() => {
      newProduct = {
        productName: "Michael’s Kors BAG CAMEL",
        category: "5f2c0c19a1b13739c4c38975",
        description: "Michael’s Kors BAG CAMEL discription",
        price: "400",
        attributes:[{name:"color", value:"blue"},
        {name:"size", value:"medium",}],
        onSale: false,
        salePrice:"320",
        quantity: 100,
        active: false,
        user: "5f2c0c19a1b13739c4c38975"
      };
    });

    test("should correctly validate a valid product", async () => {
      await expect(new Product(newProduct).validate()).resolves.toBeUndefined();
    });
  });

  describe("Product toJSON()", () => {
    test("should  return product to JSON ", () => {

      newProduct = {
        productName: "Michael’s Kors BAG CAMEL",
        category:"5f2c0c19a1b13739c4c38975",
        description: "Michael’s Kors BAG CAMEL discription",
        price: "400",
        attributes:[{name:"color", value:"blue"},
        {name:"size", value:"medium",}],
        onSale: false,
        salePrice:"320",
        quantity: 100,
        user: "5f2c0c19a1b13739c4c38975",
        active: false,
      }
      expect(new Product(newProduct).toJSON());
    });
  });
});
