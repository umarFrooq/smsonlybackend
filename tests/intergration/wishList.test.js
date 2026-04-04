const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { userOne,supplierOne, userTwo, admin, insertUsers, supplierTwo } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken, userTwoAccessToken } = require('../fixtures/token.fixture');
const { wishListOne, wishListTwo,wishListThree,insertWishLists } = require('../fixtures/wishList.fixture');
const { productOne, productTwo, productThree,insertProducts } = require('../fixtures/product.fixture');

const db = require("../../config/mongoose");
setupTestDB();


const WishList = db.WishList;
describe('Cart routes', () => {
  describe('POST /v1/wishList', () => {
    let newWishList;
    beforeEach(() => {
      newWishList = {
        product: productOne._id.toHexString(),
        
      };
    });
  
    test('should return 201 and successfully create wishList and add product to wishList if data is ok', async () => {
      await insertUsers([userOne]);
      await insertProducts([productOne, productTwo, productThree]);
      const res = await request(app)
        .post('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newWishList)
        .expect(httpStatus.CREATED);
        //console.log(res.body)
       expect(res.body).toEqual({ 
        id: expect.anything(), 
        products: expect.any(Array), 
        
        
         user: userOne._id.toHexString() 
        });
        //console.log(res.body.products[0])
        
   expect(res.body.products[0]).toEqual(
          expect.objectContaining({
             id: productOne._id.toHexString()
           }),
          
        );

      const dbWishList = await WishList.findOne({user:userOne._id.toHexString()});
      expect(dbWishList).toBeDefined();
      expect(dbWishList).toMatchObject({ 
         
        id: expect.anything(), 
        products: expect.any(Array), 
        
         user: userOne._id 
      });
      expect(res.body.products[0]).toMatchObject(
        expect.objectContaining({
           id: productOne._id.toHexString()
         }),
        
      );
      
    });
    
    test('should return 400 and return error product is already in wishList', async () => {
      await insertUsers([userOne]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListOne])
      const res = await request(app)
        .post('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newWishList)
        .expect(httpStatus.BAD_REQUEST);
      

    });
  
    test('should return 201 and successfully add another product  to wishList   if data is ok', async () => {
      await insertUsers([userOne]);
      //newCart.product=productTwo._id.toHexString()
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListOne])
      const res = await request(app)
        .post('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          product: productTwo._id.toHexString(),
         })
        .expect(httpStatus.CREATED);
       expect(res.body).toEqual({ 
        id: expect.anything(), 
        products: expect.any(Array), 
        
        
         user: userOne._id.toHexString() 
        });
        
        expect(res.body.products[0]).toMatchObject(
          expect.objectContaining({
             id: productOne._id.toHexString()
           }),
          
        );
        
        expect(res.body.products[1]).toMatchObject(
          expect.objectContaining({
             id: productTwo._id.toHexString()
           }),
          
        );
        
        const dbWishList = await WishList.findOne({user:userOne._id.toHexString()});
        expect(dbWishList).toBeDefined();
        expect(dbWishList).toMatchObject({ 
           
          id: expect.anything(), 
          products: expect.any(Array), 
          
           user: userOne._id 
        });
        expect(res.body.products[0]).toMatchObject(
          expect.objectContaining({
             id: productOne._id.toHexString()
           }),
          
        );
        
        expect(res.body.products[1]).toMatchObject(
          expect.objectContaining({
             id: productTwo._id.toHexString()
           }),
          
        );
        
    
     });
    
    test('should return 404 if product not found is added to wishList  ', async () => {
      await insertUsers([userOne]);
      await insertProducts([ productTwo, productThree]);

      const res = await request(app)
        .post('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newWishList)
        .expect(httpStatus.NOT_FOUND);
  
  });
  
  });
 
   describe("GET /v1/wishList", () => {
     test("should return 200 and the wishList object", async () => {
    
      await insertUsers([userOne]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListOne])
     
      const res = await request(app)
        .get('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);
       
        expect(res.body).toEqual({ 
          id: expect.anything(), 
          products: expect.any(Array), 
          
          
           user: userOne._id.toHexString() 
          });
          
          expect(res.body.products[0]).toMatchObject(
            expect.objectContaining({
               id: productOne._id.toHexString()
             }),
            
          );
          
          const dbWishList = await WishList.findOne({user:userOne._id.toHexString()});
          expect(dbWishList).toBeDefined();
          expect(dbWishList).toMatchObject({ 
             
            id: expect.anything(), 
            products: expect.any(Array), 
            
             user: userOne._id 
          });

          expect(res.body.products[0]).toMatchObject(
            expect.objectContaining({
               id: productOne._id.toHexString()
             }),
            
          );
    
    })
    
    
    test("should return 404 error if wishList is not found", async () => {
      await insertUsers([userOne,supplierOne,supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListTwo])
      const res = await request(app)
        .get('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);

      
    })
  
   })
 
  describe("PATCH /v1/wishList", () => {
    let removeFromWishList;
    beforeEach(() => {
      removeFromWishList = {
        product: productOne._id.toHexString(),

      };
    });
    test('and successfully removing product form wishList ', async () => {
      await insertUsers([userOne]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListOne])
      const res = await request(app)
        .patch('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(removeFromWishList)
        .expect(httpStatus.OK);
         
        expect(res.body).toEqual({ 
          id: expect.anything(), 
          products: expect.any(Array), 
          
          
           user: userOne._id.toHexString() 
          });
         
          expect(res.body.products[0]).toBeUndefined();
  
          const dbWishList = await WishList.findOne({user:userOne._id.toHexString()});
          expect(dbWishList).toBeDefined();
          expect(dbWishList).toMatchObject({ 
             
            id: expect.anything(), 
            products: expect.any(Array), 
            
             user: userOne._id 
          });
       
  
        expect(res.body.products[0]).toBeUndefined()
  
    


        
      })

       test('retrun 404 if removing the product which is not found form wishList ', async () => {
        await insertUsers([userOne]);
        await insertProducts([productOne, productThree]);
        await insertWishLists([wishListOne])
        removeFromWishList.product=productTwo._id.toHexString()
        await request(app)
          .patch('/v1/wishList')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(removeFromWishList)
          .expect(httpStatus.NOT_FOUND);
          
 })
  
      test('retrun 404 if removing a product but the wishList is not found  ', async () => {
          await insertUsers([userOne]);
          await insertProducts([productOne, productThree]);
          await insertWishLists([wishListTwo])
          await request(app)
            .patch('/v1/wishList')
            .set('Authorization', `Bearer ${userOneAccessToken}`)
            .send(removeFromWishList)
            .expect(httpStatus.NOT_FOUND);
            
            
  })
    
  })
  
 describe("DELETE /v1/wishList", () => {
    test("should return 204 and empty wishList if data is ok ", async () => {
      await insertUsers([admin,userOne, supplierOne, supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertWishLists([wishListOne])
     const res= await request(app)
        .delete(`/v1/wishList`)
        .set("Authorization", `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);
           
        expect(res.body).toEqual({ 
          id: expect.anything(), 
          products: expect.any(Array), 
          
          
           user: userOne._id.toHexString() 
          });
         
    

    expect(res.body.products).toEqual([]);

    const dbWishList = await WishList.findOne({user:userOne._id.toHexString()});
    expect(dbWishList).toBeDefined();
    expect(dbWishList).toMatchObject({ 
       
      id: expect.anything(), 
      products: expect.any(Array), 
      
       user: userOne._id 
    });
       
      expect(dbWishList.products).toHaveLength(0);
  
     });

    test('retrun 200 if emptying the wishList which  is not found  ', async () => {
      await insertUsers([userOne]);
      await insertProducts([productOne, productThree]);
      await insertWishLists([wishListTwo])
      await request(app)
        .delete('/v1/wishList')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
        
         
    


        
    })


    });


});

