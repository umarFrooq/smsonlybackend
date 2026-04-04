const request = require("supertest");
const httpStatus = require("http-status");
const app = require('../../config/express');
const setupTestDB = require("../utils/setupTestDB");

const {
  productOne,
  productTwo,
  productThree,
  productOneOne,productTwoTwo,productThreeThree,
  insertProducts,
} = require("../fixtures/product.fixture");
const {
  userOne,
  userTwo,
  supplierOne,
  supplierTwo,
  admin,
  insertUsers,
} = require("../fixtures/user.fixture");
const {
  userOneAccessToken,
  adminAccessToken,
  supplierOneAccessToken,
  supplierTwoAccessToken,
} = require("../fixtures/token.fixture");

const {
  electronics,
  computers,
  mobiles,
  iosMobile,
  androidMobile,
  mobilesAccessories,
  bags,
  insertCategories,
  
} = require("../fixtures/category.fixture");
const db = require("../../config/mongoose");
const { objectId } = require("../../app/auth/custom.validation");


setupTestDB();
const Product = db.Product;

describe("Product routes", () => {
  describe("POST /v1/products", () => {
    let newProduct;

    beforeEach(() => {
      newProduct = {
        productName: "Michael’s Kors BAG CAMEL",
        // category: bags._id.toHexString(),
        // description: "Michael’s Kors BAG CAMEL discription",
        // price: "400",
        // attributes:[{name:"color", value:"blue"},
        // {name:"size", value:"medium",}],
        // onSale: false,
        // salePrice:"320",
        // quantity: 100,
        // active: false,
      };
    });

    test("should return 201 and successfully create new product without images if data is ok", async () => {
   await insertUsers([admin, supplierOne]);
   await insertCategories([electronics,computers, mobiles, iosMobile,androidMobile, mobilesAccessories,bags]);
      const res = await request(app)
        .post("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.CREATED);
       
      expect(res.body).toEqual({
        id: expect.anything(),
        productName: newProduct.productName,
        gallery: [],
       onSale:false,
       featured:false,
       isVariable: false,
       selectedAttributes:expect.any(Array),
         attributes: expect.any(Array),
          //deleted: false: false,
         productType:"main",
         user: expect.any(Object),
         slug: expect.any(String),
         sku: expect.any(String),
         reviews: expect.any(Array),
         variants: expect.any(Array),
         // category: bags._id.toHexString(),
        // description: newProduct.description,
        
       
        // price: newProduct.price,
        // salePrice:newProduct.salePrice,
        // quantity: newProduct.quantity,
        // hasVariants: false,
        // variants:expect.any(Array),
        // active: newProduct.active,
       });

      const dbProduct = await Product.findById(res.body.id);
      expect(dbProduct).toBeDefined();
      expect(dbProduct.toJSON()).toMatchObject({
        id: expect.anything(),
        productName: newProduct.productName,
        gallery: [],
        onSale:false,
        featured:false,
        isVariable: false,
       selectedAttributes:expect.any(Array),
       slug: expect.any(String),
       sku: expect.any(String),
        attributes:expect.any(Array),
        //deleted: false: false,
         productType:"main",
         user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array)
        // category:  bags._id,
        // description: newProduct.description,
        
        // price: newProduct.price,
        // salePrice:newProduct.salePrice,
        // quantity: newProduct.quantity,
        // active: newProduct.active,
       
      });
    });
    
    test("should return 201 and successfully create new product(varitant) with mainProduct if data is ok", async () => {
      await insertUsers([admin, supplierOne]);
      productOne.category=bags._id.toHexString();
      await insertProducts([productOne])
       await insertCategories([electronics,computers,bags]);
       
       newProduct.mainProduct= productOne._id;  
       const res = await request(app)
            .post("/v1/products")
            .set("Authorization", `Bearer ${supplierOneAccessToken}`)
            .send(newProduct)
            .expect(httpStatus.CREATED);
          expect(res.body).toEqual({
            id: expect.anything(),
            productName: newProduct.productName,
            mainProduct:productOne._id.toHexString(),
            gallery: [],
            onSale:false,
            featured:false,
            isVariable: false,
       selectedAttributes:expect.any(Array),
       slug: expect.any(String),
       sku: expect.any(String),
            attributes:expect.any(Array),
            // //deleted: false: false,
             productType:"variant",
             user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array)
                
            // category: bags._id.toHexString(),
            // description: newProduct.description,
            // gallery: [],
            // price: newProduct.price,
            // salePrice:newProduct.salePrice,
            // onSale:newProduct.onSale,
            // attributes: newProduct.attributes,
            // quantity: newProduct.quantity,
            // hasVariants: false,
            // gallery: [],
            // variants:expect.any(Array),
            // active: newProduct.active,
          });
    
          const dbProduct = await Product.findById(res.body.id);
          expect(dbProduct).toBeDefined();
          expect(dbProduct.toJSON()).toMatchObject({
            id: expect.anything(),
            productName: newProduct.productName,
            gallery: [],
            onSale:false,
            featured:false,
            isVariable: false,
            selectedAttributes:expect.any(Array),
            slug: expect.any(String),
            sku: expect.any(String),
            attributes:expect.any(Array),
            //deleted: false: false,
            productType:"variant",
            user: expect.any(Object),
            reviews: expect.any(Array),
            variants: expect.any(Array),
            // category:  bags._id,
            // description: newProduct.description,
            // gallery: [],
            // price: newProduct.price,
            // salePrice:newProduct.salePrice,
            // onSale:newProduct.onSale,
            // attributes:newProduct.attributes,
            // mainProduct:productOne._id,
            // variants:expect.any(Array),
            // quantity: newProduct.quantity,
            // active: newProduct.active,
          
          });
        });
   
    test("should return 404  with an invalid mainProductId if data is ok", async () => {
          await insertUsers([admin, supplierOne]);
          await insertProducts([productOne])
    newProduct.mainProduct=productTwo._id.toHexString();
    
           await request(app)
            .post("/v1/products")
            .set("Authorization", `Bearer ${supplierOneAccessToken}`)
            .send(newProduct)
            .expect(httpStatus.NOT_FOUND);
        });
            
    test("should return 403  if  another user is creating variant of another user's product ", async () => {
          await insertUsers([admin, supplierOne,supplierTwo]);
          await insertProducts([productOne])
    newProduct.mainProduct=productOne._id.toHexString();
    
           await request(app)
            .post("/v1/products")
            .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
            .send(newProduct)
            .expect(httpStatus.FORBIDDEN);
        });
    
    

    test("should return 401 error is access token is missing", async () => {
      await request(app)
        .post("/v1/products")
        .send(newProduct)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user is not supplier", async () => {
      await insertUsers([userOne]);

      await request(app)
        .post("/v1/products")
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe("POST /v1/products/:productId", () => {
    beforeEach(() => {
      
      newProduct = {
        productName: "Michael’s Kors BAG CAMEL",
        category: bags._id.toHexString(),
        description: "Michael’s Kors BAG CAMEL discription",
        featured:false,
        attributes:[{name:"color", value:"blue"},
        {name:"size", value:"medium",}],
        onSale: false,
        salePrice:320,
        regularPrice:400,
        quantity: 100,
        weight:2.2,
        active: false,
        
      };
    });

 
   
    
    test("should return 200 and successfully upload product  mainImage and gallery if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([bags]);
      
      productOne.category=bags._id.toHexString();
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.OK);
        
        expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id.toHexString(),
        description: productOne.description,
        gallery: expect.any(Array),
        featured:false,
        mainImage: expect.any(String),
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:productOne.onSale,
        
        attributes:expect.any(Array),
        isVariable: false,
       selectedAttributes:expect.any(Array),
       slug: expect.any(String),
       //sku: expect.any(String),
        //deleted: false: false,
         productType:"main",
        quantity: productOne.quantity,
        weight: productOne.weight,
       
        active: productOne.active,
        user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array),
      });

      const dbProduct = await Product.findById(productOne._id);
      expect(dbProduct).toBeDefined();

      expect(dbProduct.toJSON()).toMatchObject({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category:bags._id,
        description: productOne.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        regularPrice: productOne.regularPrice,
        slug: expect.any(String),
        //sku: expect.any(String),
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:productOne.onSale,
        featured:false,
        isVariable: false,
       selectedAttributes:expect.any(Array),
       
        attributes:expect.any(Array),
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array),
      });

    });
   
    
   
    test("should return 200 and successfully update product data only with mainImage if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([bags]);
      
      productOne.category=bags._id.toHexString();
      await insertProducts([productOne, productTwo, productThree]);
//console.log(productOne)
      const res = await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id.toHexString(),
        description: productOne.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:productOne.onSale,
        featured:false,
        attributes:expect.any(Array),
        isVariable: false,
        selectedAttributes:expect.any(Array),
        slug: expect.any(String),
        //sku: expect.any(String),
        //deleted: false: false,
        productType:"main",
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        
        user: expect.any(Object),
        reviews: expect.any(Array),
        variants: expect.any(Array),
      });

      const dbProduct = await Product.findById(productOne._id);
      expect(dbProduct).toBeDefined();

      expect(dbProduct.toJSON()).toMatchObject({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id,
        description: productOne.description,
        gallery: expect.any(Array),
        mainImage: expect.any(String),
        price: productOne.price,
        regularPrice: productOne.regularPrice,
        salePrice:productOne.salePrice,
        onSale:productOne.onSale,
         isVariable: false,
         featured:false,
       selectedAttributes:expect.any(Array),
       slug: expect.any(String),
       //sku: expect.any(String),
        attributes:expect.any(Array),
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array),
      });
  
    });
  
  
  
    test("should return 200 and successfully  upload only gallery images if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([bags]);
      
      productOne.category=bags._id.toHexString();
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.OK);
        expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id.toHexString(),
        description: productOne.description,
        gallery: expect.any(Array),
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        featured:false,
        onSale:productOne.onSale,
        attributes:expect.any(Array),
        //deleted: false: false,
        productType:"main",
        isVariable: false,
       selectedAttributes:expect.any(Array),
       slug: expect.any(String),
       //sku: expect.any(String),
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        user: expect.any(Object),
        reviews: expect.any(Array),
        variants: expect.any(Array),
      });

      const dbProduct = await Product.findById(productOne._id);
      expect(dbProduct).toBeDefined();

      expect(dbProduct.toJSON()).toMatchObject({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id,
        description: productOne.description,
        gallery: expect.any(Array),
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:productOne.onSale,
        featured:false,
        attributes:expect.any(Array),
        isVariable: false,
        selectedAttributes:expect.any(Array),
        slug: expect.any(String),
       // sku: expect.any(String),
        //deleted: false: false,
        productType:"main",
       
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        user: expect.any(Object),
        reviews: expect.any(Array),
        variants: expect.any(Array),
      });
    });
      
    
   
    test("should return 404 error if product already is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.NOT_FOUND);
    });
   
    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Content-type", "multipart/form-data")
        
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 if user is uploading another user's product images", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.FORBIDDEN);
    });

    test("should return 404 if supplier is uploading to product that is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);

      await request(app)
        .post(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if product is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .post(`/v1/products/invalidId`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
        .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        .expect(httpStatus.BAD_REQUEST);
    });
   
  });
  describe("GET /v1/products/GetAllProducts", () => {
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics,computers,bags]);
      productOne.category=bags._id.toHexString();
      productTwo.category=electronics._id.toHexString();
      productThree.category=computers._id.toHexString();
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get("/v1/products/getAllProducts")
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
      expect(res.body.results[0]).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id.toHexString(),
        description: productOne.description,
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:true,
        featured:false,
        attributes:expect.any(Array),
        isVariable: false,
        selectedAttributes:expect.any(Array),
        productType:"main",
        //deleted: false:false,
        reviews:expect.any(Array),
        variants:expect.any(Array),
        quantity: productOne.quantity,
        weight: productOne.weight,
        gallery: [],
        active: productOne.active,
        user: expect.any(Object),
      });
    });

    test("should correctly apply filter on productName field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ productName: productOne.productName })
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
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });

    test("should correctly apply filter on productCategory field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics,computers,bags]);
      productOne.category=bags._id.toHexString();
      productTwo.category=bags._id.toHexString();
      productThree.category=bags._id.toHexString();

      await insertProducts([productOne, productThree]);
      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ category:`${productOne.category}` })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      // console.log(res.body.results[0].id)
      // console.log(res.body.results[1].id)
      // console.log(productOne._id.toHexString())
      // console.log(productTwo._id.toHexString())
     // expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productThree._id.toHexString());
    //  expect(res.body.results[2].id).toBe(productThree._id.toHexString());
    });
    test("should correctly apply filter on onSale field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ onSale: productOne.onSale })
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
      
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });
    test("should correctly apply filter on active field", async () => {
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ active: productOne.active })
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
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productThree._id.toHexString());
    });
    test("should correctly sort returned array if descending sort param is specified", async () => {
      await insertProducts([productOne, productThree]);
      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ sortBy: "price:desc" })
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
      
      expect(res.body.results[1].id).toBe(productOne._id.toHexString());
      expect(res.body.results[0].id).toBe(productThree._id.toHexString());
     // expect(res.body.results[0].id).toBe(productThree._id.toHexString());
    });

    test("should correctly sort returned array if ascending sort param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertProducts([productOne, productThree]);
      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .query({ sortBy: "price:asc" })
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
     // expect(res.body.results[2].id).toBe(productThree._id.toHexString());
      expect(res.body.results[1].id).toBe(productThree._id.toHexString());
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertProducts([productOne, productThree]);

      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productThree._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([userOne, userTwo, admin]);
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products/getAllProducts")
        .query({ page: 1, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 1,
        totalResults: 2,
      });

      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productThree._id.toHexString());
    });
  });

  describe("GET /v1/products", () => {
 
    test("should return 200 and apply the default query options", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics,computers,bags]);
      productOne.category=bags._id.toHexString();
      productTwo.category=electronics._id.toHexString();
      productThree.category=computers._id.toHexString();
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
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
      expect(res.body.results[0]).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        category: bags._id.toHexString(),
        description: productOne.description,
        regularPrice: productOne.regularPrice,
        price: productOne.price,
        salePrice:productOne.salePrice,
        onSale:true,
        featured:false,
        attributes:expect.any(Array),
        isVariable: false,
        selectedAttributes:expect.any(Array),
        productType:"main",
        //deleted: false:false,
        reviews:expect.any(Array),
        variants:expect.any(Array),
        quantity: productOne.quantity,
        weight: productOne.weight,
        gallery: [],
        active: productOne.active,
        user: expect.any(Object),
      });
    });

    test("should correctly apply filter on productName field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ productName: productOne.productName })
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
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });

    test("should correctly apply filter on productCategory field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertCategories([electronics,computers,bags]);
      productOne.category=bags._id.toHexString();
      productTwo.category=bags._id.toHexString();
      productThree.category=bags._id.toHexString();

      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ category:`${productOne.category}` })
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
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      // expect(res.body.results[1].id).toBe(productTwo._id.toHexString());
      // expect(res.body.results[2].id).toBe(productThree._id.toHexString());
    });
    test("should correctly apply filter on onSale field", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ onSale: productOne.onSale })
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
      
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });
    test("should correctly apply filter on active field", async () => {
      await insertProducts([productOne,productOneOne, productTwo, productThree]);
      await insertCategories([electronics,computers,bags]);
      await insertUsers([supplierOne]);
     
      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ active: productOne.active })
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
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productOneOne._id.toHexString());
    });
    test("should correctly sort returned array if descending sort param is specified", async () => {
      await insertUsers([userOne, userTwo, admin, supplierOne, supplierTwo]);
    
      await insertProducts([productOne,productOneOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ sortBy: "price:desc" })
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
      expect(res.body.results[0].id).toBe(productOneOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productOne._id.toHexString());
     
     // expect(res.body.results[2].id).toBe(productOne._id.toHexString());
      // expect(res.body.results[1].id).toBe(productTwo._id.toHexString());
      // expect(res.body.results[0].id).toBe(productThree._id.toHexString());
    });

    test("should correctly sort returned array if ascending sort param is specified", async () => {
      await insertUsers([userOne, userTwo,supplierOne, admin]);
      
      await insertProducts([productOne,productTwo, productThree,productOneOne,productTwoTwo,productThreeThree, ]);
      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ sortBy: "price:asc" })
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
      expect(res.body.results[1].id).toBe(productOneOne._id.toHexString());
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
    });

    test("should limit returned array if limit param is specified", async () => {
      await insertUsers([userOne, supplierOne,userTwo, admin]);
      await insertProducts([productOne,productOneOne, productTwo, productThree]);

      const res = await request(app)
        .get("/v1/products")
        .query({ limit: 2 })
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(productOne._id.toHexString());
      expect(res.body.results[1].id).toBe(productOneOne._id.toHexString());
    });

    test("should return the correct page if page and limit params are specified", async () => {
      await insertUsers([userOne,supplierOne, userTwo, admin]);
      await insertProducts([productOne,productOneOne]);

      const res = await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .query({ page: 2, limit: 1 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 1,
        totalPages: 2,
        totalResults: 2,
      });

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(productOneOne._id.toHexString());
    });
  });

  describe("GET /v1/products/:productId", () => {
    test("should return 200 and the product object if data is ok", async () => {
      await insertUsers([supplierOne]);
      
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get(`/v1/products/${productOne._id}`)
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        id: productOne._id.toHexString(),
        productName: productOne.productName,
        // slug: expect.any(String),
        // sku: expect.any(String),
        category: bags._id.toHexString(),
        description: productOne.description,
        price: productOne.price,
        gallery: [],
        salePrice:productOne.salePrice,
        onSale:true,
        featured:false,
        attributes:expect.any(Array),
        isVariable: false,
        selectedAttributes:expect.any(Array),
        regularPrice:productOne.regularPrice,
        variants:expect.any(Array),
        //deleted: false:false,
        reviews:expect.any(Array),
        productType:'main',
        quantity: productOne.quantity,
        weight: productOne.weight,
        active: productOne.active,
        user: expect.any(Object),
      });
    });

    test("should return 400 error if productId is not a valid mongo id", async () => {
      await insertProducts([productOne, productTwo, productThree]);
      await request(app)
        .get("/v1/products/invalidId")
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test("should return 404 error if product is not found", async () => {
      await insertProducts([productOne]);

      await request(app)
        .get(`/v1/products/${productTwo._id}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe("GET /v1/products/attributes", () => {
    test("should return 200 and the product object if data is ok", async () => {
      await insertUsers([supplierOne]);
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .get(`/v1/products/attributes`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);
       // console.log(res.body)
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: productOne.productName,

    //     category: null,
    //     description: productOne.description,
    //     price: productOne.price,
    //     gallery: [],
    //     salePrice:productOne.salePrice,
    //     onSale:true,
    //     attributes:expect.any(Array),
    //     isVariable: false,
    //    selectedAttributes:expect.any(Array),
       
    //     variants:expect.any(Array),
    //     //deleted: false:false,
    //     productType:'main',
    //     quantity: productOne.quantity,
    //     weight: productOne.weight,
    //     active: productOne.active,
    //     user: expect.any(Object),
    //   });
 });
 test("should return 401 error if access token is missing", async () => {
  await insertUsers([admin, supplierOne, supplierTwo]);
  await insertProducts([productOne, productTwo, productThree]);

await request(app)
    .get(`/v1/products/attributes`)
    
    
    .expect(httpStatus.UNAUTHORIZED);
});
test("should return 401 error if user role is not supplier token is missing", async () => {
  await insertUsers([admin,userOne, supplierOne, supplierTwo]);
  await insertProducts([productOne, productTwo, productThree]);

await request(app)
    .get(`/v1/products/attributes`)
    
    .set("Authorization", `Bearer ${userOneAccessToken}`)
    .expect(httpStatus.FORBIDDEN);
});
    // test("should return 400 error if productId is not a valid mongo id", async () => {
    //   await insertProducts([productOne, productTwo, productThree]);
    //   await request(app)
    //     .get("/v1/products/invalidId")
    //     .send()
    //     .expect(httpStatus.BAD_REQUEST);
    // });

  //   test("should return 404 error if product is not found", async () => {
  //     await insertProducts([productOne]);

  //     await request(app)
  //       .get(`/v1/products/${productTwo._id}`)
  //       .send()
  //       .expect(httpStatus.NOT_FOUND);
  //   });
   });

  describe("PATCH /v1/products/:productId", () => {
    beforeEach(() => {
      
      newProduct = {
        productName: "Michael’s Kors BAG CAMEL",
        category: bags._id.toHexString(),
        description: "Michael’s Kors BAG CAMEL discription",
        attributes:[{name:"color", values:["blue","black","white"]},
        {name:"size", values:["medium","small"]}],
        onSale: false,
        salePrice:320,
        regularPrice: 400,
        quantity: 100,
        active: false,
        isVariable: false,
        weight: 2.2
      };
    });

    test("should return 200 and successfully update product if data is ok", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertCategories([bags]);

      productOne.category=bags._id.toHexString();
      
    

      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.OK);
        //console.log(res.body)
      expect(res.body).toEqual({
        id: expect.anything(),
        productName: newProduct.productName,
        category:bags._id.toHexString(),
        description: newProduct.description,
        gallery: expect.any(Array),
        price: newProduct.regularPrice,
        regularPrice: newProduct.regularPrice,
        salePrice:newProduct.salePrice,
        onSale:newProduct.onSale,
        featured:false,
        attributes: expect.any(Array),
        isVariable: false,
        weight: 2.2,
        selectedAttributes:expect.any(Array),
        slug: expect.any(String),
        //sku: expect.any(String),
        quantity: newProduct.quantity,
        active: newProduct.active,
        productType:"main",
        //deleted: false:false,
        user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array)
      });

      const dbProduct = await Product.findById(productOne._id);
      expect(dbProduct).toBeDefined();

      expect(dbProduct.toJSON()).toMatchObject({
        id: expect.anything(),
            productName: newProduct.productName,
            category: expect.any(Object),
            description: newProduct.description,
            gallery: [],
            price: newProduct.regularPrice,
            regularPrice: newProduct.regularPrice,
            salePrice:newProduct.salePrice,
            onSale:newProduct.onSale,
            attributes:newProduct.attributes,
            quantity: newProduct.quantity,
            featured:false,
            active: newProduct.active,
            isVariable: false,
            weight: 2.2,
            user: expect.any(Object),
         reviews: expect.any(Array),
         variants: expect.any(Array)
          });
    
          });
  

   
    test("should return 404 error if product already is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.NOT_FOUND);
    });
   
    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .send(newProduct)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 if user is updating another user's product", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.FORBIDDEN);
    });

    test("should return 404 if supplier is updating product that is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);

      await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .send(newProduct)
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if product is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .patch(`/v1/products/invalidId`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .field("productName", "Michael’s Kors BAG CAMEL")
        .field("category", "shirts")
        .field("description", "description")
        .field("price", 100)
        .field("color", "white")
        .field("size", "medium")
        .field("quantity", 10)
        .field("active", true)
        .field("removeImages", "")
        .expect(httpStatus.BAD_REQUEST);
    });
   
    test("should return 403 error if user is trying to update another user's product", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      
      await request(app)
        .patch(`/v1/products/${productOne._id}`)
        .set("Authorization", `Bearer ${supplierTwoAccessToken}`)

        .send(newProduct)
        .expect(httpStatus.FORBIDDEN);
    });
  });


 describe("DELETE /v1/products/:productId", () => {
  test("should return 204 if data is ok ", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertProducts([productOne, productTwo, productThree]);
    await request(app)
      .delete(`/v1/products/${productOne._id}`)
      .set("Authorization", `Bearer ${supplierOneAccessToken}`)
      .send()
      .expect(httpStatus.NO_CONTENT);

    const dbProduct = await Product.findOne({_id:productOne._id});
    expect(dbProduct).toBeNull();
  });
  test("should return 204  if deleting a main product and it's variants", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);

 productTwo.mainProduct=productOne._id.toHexString()
 productThree.mainProduct=productOne._id.toHexString()
 
    await insertProducts([productOne, productTwo, productThree]);


    await request(app)
      .delete(`/v1/products/${productOne._id}`)
      .set("Authorization", `Bearer ${supplierOneAccessToken}`)
      .send()
      .expect(httpStatus.NO_CONTENT);

      const dbProductOne = await Product.findOne({_id:productOne._id});
    expect(dbProductOne).toBeNull();
    const dbProductTwo = await Product.findOne({_id:productTwo._id});
    expect(dbProductTwo).toBeNull();
    const dbProductThree = await Product.findOne({_id:productThree._id});
    expect(dbProductThree).toBeNull();
    
  });
 
  test("should return 401 error if access token is missing", async () => {
    await request(app)
      .delete(`/v1/products/${productOne._id}`)
      .send()
      .expect(httpStatus.UNAUTHORIZED);
  });
  test("should return 403 error if user is trying to delete another user's product", async () => {
    await insertUsers([supplierOne, supplierTwo]);
    await insertProducts([productOne, productTwo, productThree]);
    await request(app)
      .delete(`/v1/products/${productOne._id}`)
      .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
      .send()
      .expect(httpStatus.FORBIDDEN);
  });
  test("should return 400 error if productId is not a valid mongo id", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertProducts([productOne, productTwo, productThree]);
    await request(app)
      .delete("/v1/products/invalidId")
      .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
      .send()
      .expect(httpStatus.BAD_REQUEST);
  });
 test("should return 404 error if product already is not found", async () => {
    await insertUsers([admin, supplierOne, supplierTwo]);
    await insertProducts([productTwo, productThree]);

    await request(app)
      .delete(`/v1/products/${productOne._id}`)
      .set("Authorization", `Bearer ${supplierOneAccessToken}`)
      .send()
      .expect(httpStatus.NOT_FOUND);
  });
  });

  describe("POST /v1/products/uploads", () => {
    
    
    test("should return 200 and successfully upload product's decriptions images if data is ok ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      const res = await request(app)
        .post(`/v1/products/uploads`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        .field("productId", `${productOne._id.toHexString()}`)
        .attach("descriptionImage", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        link: expect.any(String),
        });

      
    });
   
  
   
    test("should return 404 error if product already is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .post(`/v1/products/uploads`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        .field("productId", `${productOne._id.toHexString()}`)
        .attach("descriptionImage", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.NOT_FOUND);
    });
   
    test("should return 401 error if access token is missing", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

await request(app)
        .post(`/v1/products/uploads`)
        .set("Content-type", "multipart/form-data")
        
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 if user is uploading another user's  product's decriptions images ", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);

      await request(app)
        .post(`/v1/products/uploads`)
        .set("Authorization", `Bearer ${supplierTwoAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .field("productId", `${productOne._id.toHexString()}`)
        .attach("descriptionImage", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.FORBIDDEN);
    });

    test("should return 404 if supplier is uploading to product that is not found", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);

      await request(app)
        .post(`/v1/products/uploads`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .field("productId", `${productOne._id.toHexString()}`)
        .attach("descriptionImage", `${__dirname}/testFiles/test.jpg`)
        
        
        .expect(httpStatus.NOT_FOUND);
    });

    test("should return 400 error if product is not a valid mongo id", async () => {
      await insertUsers([admin, supplierOne, supplierTwo]);
      await insertProducts([productTwo, productThree]);
      await request(app)
        .post(`/v1/products/uploads`)
        .set("Authorization", `Bearer ${supplierOneAccessToken}`)
        .set("Content-type", "multipart/form-data")
        
        .field("productId", `invalidId`)
        .attach("descriptionImage", `${__dirname}/testFiles/test.jpg`)
        
        .expect(httpStatus.BAD_REQUEST);
    });
   
  });

 


});
 // test("should return 200 and successfully update product(variant) if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   newProduct.mainProduct=productTwo._id.toHexString();
      
    //   await insertProducts([productOne, productTwo, productThree]);
    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .send(newProduct)
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     productName: newProduct.productName,
    //     category: bags._id.toHexString(),
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes: newProduct.attributes,
    //     quantity: newProduct.quantity,
    //     mainProduct:productTwo._id.toHexString(),
    //     //deleted: false:false,
    //     productType:"main",
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //     // hasVariants: false,
    //     // variants:expect.any(Array),
       
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //         productName: newProduct.productName,
    //         category: bags._id,
    //         description: newProduct.description,
    //         gallery: [],
    //         price: newProduct.price,
    //         salePrice:newProduct.salePrice,
    //         onSale:newProduct.onSale,
    //         attributes:newProduct.attributes,
    //         mainProduct:productTwo._id,
    //         quantity: newProduct.quantity,
    //         active: newProduct.active,
    //         user: supplierOne._id ,
    //         //variants:expect.any(Array),
            
    //       });
    
    //       });
  
    // test("should return 200 and successfully update product(variant) data with mainProduct if data is ok without images ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   productOne.mainProduct=productTwo._id.toHexString();
    //   productTwo.variants=[`${productOne._id}`]
    //   await insertProducts([productOne, productTwo, productThree]);

    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("mainProduct", `${productThree._id}`)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productThree._id.toHexString(),
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productThree._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
   
    // test("should return 400 and if main product is not found (variant) with a main Product if data is ok without images", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productThree]);
    //   newProduct.mainProduct=productTwo._id.toHexString();
    //    await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .send(newProduct)
    //     .expect(httpStatus.NOT_FOUND);
       
      
      
        
    // });
    
    // test("should return 200 and successfully update product data with mainImage and gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);

    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
        
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id.toHexString(),
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
   
    // test("should return 200 and successfully update product(variant) data with mainProduct, mainImage and gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);
    //   newProduct.mainProduct=productTwo._id.toHexString();
    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("mainProduct", `${newProduct.mainProduct}`)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:newProduct.mainProduct,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
   
    // test("should return 200 and successfully update product data only with mainImage if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);

    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id.toHexString(),
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
  
    // test("should return 200 and successfully update product(variant) data with mainProduct, mainImage if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);
    //   newProduct.mainProduct=productTwo._id.toHexString();
    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("mainProduct", `${newProduct.mainProduct}`)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:newProduct.mainProduct,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
  
    // test("should return 200 and successfully update product data with only gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);

    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
        
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id.toHexString(),
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
      
    // test("should return 200 and successfully update product(variant) data with mainProduct and only gallery if data is ok ", async () => {
    //   await insertUsers([admin, supplierOne, supplierTwo]);
    //   await insertProducts([productOne, productTwo, productThree]);
    //   newProduct.mainProduct=productTwo._id.toHexString();
    //   const res = await request(app)
    //     .patch(`/v1/products/${productOne._id}`)
    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", newProduct.productName)
    //     .field("mainProduct", `${newProduct.mainProduct}`)
    //     .field("category", `${newProduct.category}`)
    //     .field("description", newProduct.description)
    //     .field("price", newProduct.price)
    //     .field("salePrice", newProduct.salePrice)
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "blue")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", newProduct.onSale)
    //     .field("quantity", newProduct.quantity)
    //     .field("active", newProduct.active)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
        
    //     .expect(httpStatus.OK);
    //   expect(res.body).toEqual({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: newProduct.category,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:newProduct.mainProduct,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(productOne._id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: productOne._id.toHexString(),
    //     productName: newProduct.productName,
    //     category: bags._id,
    //     description: newProduct.description,
    //     gallery: expect.any(Array),
    //     price: newProduct.price,
    //     salePrice:newProduct.salePrice,
    //     onSale:newProduct.onSale,
    //     attributes:newProduct.attributes,
    //     hasVariants: false,
    //     mainProduct:productTwo._id,
    //     variants:expect.any(Array),
    //     quantity: newProduct.quantity,
    //     active: newProduct.active,
    //     user: supplierOne._id,
    //   });
    // });
   //     test("should return 201 and successfully create new product with mainImage and gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);

    //   const res = await request(app)
    //     .post("/v1/products")

    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", "Michael’s Kors BAG CAMEL")
    //     .field("category", `${bags._id}`)
    //     .field("description", "description")
    //     .field("price", "100")
    //     .field("salePrice", "80")
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "black")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", false)
    //     .field("quantity", 10)
    //     .field("active", true)

    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`,)
        
    //     .expect(httpStatus.CREATED);
      
    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category: bags._id.toHexString(),
    //     description: "description",
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:expect.any(Array),
    //     hasVariants: false,
    
    //     variants:expect.any(Array),
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();
    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category: bags._id,
    //     description: "description",
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:expect.any(Array),
    //     quantity: 10,
    //     active: true,
    //     user: expect.anything(),
    //   });
    // });
    
    // test("should return 201 and successfully create new product(variant) with mainProductId, mainImage and gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);
    //   await insertCategories([electronics,computers,bags]);
    //   productOne.category=bags._id.toHexString();
    //   await insertProducts([productOne])
       
    //   const res = await request(app)
    //     .post("/v1/products")

    //     .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //     .set("Content-type", "multipart/form-data")
    //     .field("productName", "Michael’s Kors BAG CAMEL")
    //     .field("category", `${bags._id}`)
    //     .field("description", "description")
    //     .field("price", "100")
    //     .field("mainProduct",`${productOne._id}`)
    //     .field("salePrice", "80")
    //     .field("attributes[0][name]", "color")
    //     .field("attributes[0][value]", "black")
    //     .field("attributes[1][name]", "size")
    //     .field("attributes[1][value]", "medium")
    //     .field("onSale", false)
    //     .field("quantity", 10)
    //     .field("active", true)

    //     .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
    //     .attach("gallery", `${__dirname}/testFiles/test.jpg`,)
        
    //     .expect(httpStatus.CREATED);
      
    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category: bags._id.toHexString(),
    //     description: "description",
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:expect.any(Array),
    //     hasVariants: false,
    //     mainProduct:productOne._id.toHexString(),
    //     variants:expect.any(Array),
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();
    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category: bags._id,
    //     description: "description",
    //     gallery: expect.any(Array),
    //     mainImage: expect.any(String),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:expect.any(Array),
    //     mainProduct:productOne._id,
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id,
    //   });
    // });


    // test("should return 201 and successfully create new product with mainImage and with no gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);

    //   const res = await request(app)
    //   .post("/v1/products")

    //   .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //   .set("Content-type", "multipart/form-data")
    //   .field("productName", "Michael’s Kors BAG CAMEL")
    //   .field("category", `${bags._id}`)
    //   .field("description", "description")
    //   .field("price", "100")
    //   .field("salePrice", "80")
    //   .field("attributes[0][name]", "color")
    //   .field("attributes[0][value]", "blue")
    //   .field("attributes[1][name]", "size")
    //   .field("attributes[1][value]", "medium")
    //   .field("onSale", false)
    //   .field("quantity", 10)
    //   .field("active", true)

    //   .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
      
    //     .expect(httpStatus.CREATED);
    //     expect(res.body).toEqual({
    //       id: expect.anything(),
    //       productName: "Michael’s Kors BAG CAMEL",
    //       category: bags._id.toHexString(),
    //       description: "description",
    //       gallery: expect.any(Array),
    //       mainImage: expect.any(String),
    //       price: "100",
    //       salePrice:"80",
    //       onSale:false,
    //       attributes:expect.any(Array),
    //       hasVariants: false,
    //       variants:expect.any(Array),
    //       quantity: 10,
    //       active: true,
    //       user: supplierOne._id.toHexString(),
    //     });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category:  bags._id,
    //     description: "description",
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:newProduct.attributes,
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id,
    //   });
    // });
   
    // test("should return 201 and successfully create new product(varitant) with mainProductId with mainImage and with no gallery pictures if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);
    //   productOne.category=bags._id.toHexString();
    //   await insertProducts([productOne])
    //    await insertCategories([electronics,computers,bags]);
       
    //   const res = await request(app)
    //   .post("/v1/products")

    //   .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //   .set("Content-type", "multipart/form-data")
    //   .field("productName", "Michael’s Kors BAG CAMEL")
    //   .field("category", `${bags._id}`)
    //   .field("mainProduct",`${productOne._id}`)
    //   .field("description", "description")
    //   .field("price", "100")
    //   .field("salePrice", "80")
    //   .field("attributes[0][name]", "color")
    //   .field("attributes[0][value]", "blue")
    //   .field("attributes[1][name]", "size")
    //   .field("attributes[1][value]", "medium")
    //   .field("onSale", false)
    //   .field("quantity", 10)
    //   .field("active", true)

    //   .attach("mainImage", `${__dirname}/testFiles/test.jpg`)
      
    //     .expect(httpStatus.CREATED);
    //     expect(res.body).toEqual({
    //       id: expect.anything(),
    //       productName: "Michael’s Kors BAG CAMEL",
    //       category: bags._id.toHexString(),
    //       mainProduct:productOne._id.toHexString(),
    //       description: "description",
    //       gallery: expect.any(Array),
    //       mainImage: expect.any(String),
    //       price: "100",
    //       salePrice:"80",
    //       onSale:false,
    //       attributes:expect.any(Array),
    //       hasVariants: false,
    //       variants:expect.any(Array),
    //       quantity: 10,
    //       active: true,
    //       user: supplierOne._id.toHexString(),
    //     });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category:  bags._id,
    //     mainProduct:productOne._id,
    //     description: "description",
    //     mainImage: expect.any(String),
    //     gallery: [],
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:newProduct.attributes,
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id,
    //   });
    // });
    // test("should return 201 and successfully create new product without mainImage  if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);

    //   const res = await request(app)
    //     .post("/v1/products")

        
    //   .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //   .set("Content-type", "multipart/form-data")
    //   .field("productName", "Michael’s Kors BAG CAMEL")
    //   .field("category", `${bags._id}`)
    //   .field("description", "description")
    //   .field("price", "100")
    //   .field("salePrice", "80")
    //   .field("attributes[0][name]", "color")
    //   .field("attributes[0][value]", "blue")
    //   .field("attributes[1][name]", "size")
    //   .field("attributes[1][value]", "medium")
    //   .field("onSale", false)
    //   .field("quantity", 10)
    //   .field("active", true)
    //   .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //       productName: "Michael’s Kors BAG CAMEL",
    //       category: bags._id.toHexString(),
    //       description: "description",
    //       gallery: expect.any(Array),
    //       price: "100",
    //       salePrice:"80",
    //       onSale:false,
    //       attributes:expect.any(Array),
    //       hasVariants: false,
    //       variants:expect.any(Array),
    //       quantity: 10,
    //       active: true,
    //       user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category:  bags._id,
    //     description: "description",
    //     gallery: expect.any(Array),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     attributes:newProduct.attributes,
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id,
    //   });
    // });
    // test("should return 201 and successfully create new product(varitant) without mainImage  if data is ok", async () => {
    //   await insertUsers([admin, supplierOne]);
    //   await insertCategories([electronics,computers,bags]);
    //   productOne.category=bags._id.toHexString();
    //   await insertProducts([productOne])
       

    //   const res = await request(app)
    //     .post("/v1/products")
    //   .set("Authorization", `Bearer ${supplierOneAccessToken}`)
    //   .set("Content-type", "multipart/form-data")
    //   .field("productName", "Michael’s Kors BAG CAMEL")
    //   .field("mainProduct",`${productOne._id}`)
    //   .field("category", `${bags._id}`)
    //   .field("description", "description")
    //   .field("price", "100")
    //   .field("salePrice", "80")
    //   .field("attributes[0][name]", "color")
    //   .field("attributes[0][value]", "blue")
    //   .field("attributes[1][name]", "size")
    //   .field("attributes[1][value]", "medium")
    //   .field("onSale", false)
    //   .field("quantity", 10)
    //   .field("active", true)
    //   .attach("gallery", `${__dirname}/testFiles/test.jpg`)
        
    //     .expect(httpStatus.CREATED);

    //   expect(res.body).toEqual({
    //     id: expect.anything(),
    //       productName: "Michael’s Kors BAG CAMEL",
    //       category: bags._id.toHexString(),
    //       description: "description",
    //       gallery: expect.any(Array),
    //       price: "100",
    //       salePrice:"80",
    //       onSale:false,
    //       attributes:expect.any(Array),
    //       hasVariants: false,
    //       mainProduct:productOne._id.toHexString(),
    //       variants:expect.any(Array),
    //       quantity: 10,
    //       active: true,
    //       user: supplierOne._id.toHexString(),
    //   });

    //   const dbProduct = await Product.findById(res.body.id);
    //   expect(dbProduct).toBeDefined();

    //   expect(dbProduct.toJSON()).toMatchObject({
    //     id: expect.anything(),
    //     productName: "Michael’s Kors BAG CAMEL",
    //     category:  bags._id,
    //     description: "description",
    //     gallery: expect.any(Array),
    //     price: "100",
    //     salePrice:"80",
    //     onSale:false,
    //     mainProduct:productOne._id,
    //     attributes:newProduct.attributes,
    //     quantity: 10,
    //     active: true,
    //     user: supplierOne._id,
    //   });
    // });