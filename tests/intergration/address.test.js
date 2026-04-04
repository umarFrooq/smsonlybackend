const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { userOne,userTwo,supplierOne,supplierTwo , admin, insertUsers,  } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken, userTwoAccessToken } = require('../fixtures/token.fixture');
const { addressOne, addressTwo, addressThree,insertAddresses } = require('../fixtures/address.fixture');

const db = require("../../config/mongoose");
const { updateAddress } = require('../../app/address/address.service');
setupTestDB();


const Address = db.Address;
describe('Address routes', () => {
  describe('POST /v1/address', () => {
    let newAddress;
    beforeEach(() => {
       newAddress = {
        
        fullname: "userTwo  fullname ",
        phone: "+923010000000",
        province:'fake province',
        city: "fake city",
        city_code: "fake city_code",
        address:"fake address",
        addressType: "home",
      };
     

    });

  
    test('should return 201 and successfully create address if data is ok', async () => {
      await insertUsers([userOne]);
      await insertAddresses([ addressOne, addressTwo, addressThree]);
      const res = await request(app)
        .post('/v1/address')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newAddress)
        .expect(httpStatus.CREATED);
         expect(res.body).toEqual({ 
        id: expect.anything(), 
        fullname: newAddress.fullname, 
        phone: newAddress.phone, 
        province: newAddress.province, 
    
        city: newAddress.city, 
        city_code: newAddress.city_code, 
        address: newAddress.address, 
        addressType: newAddress.addressType, 
       localType: "local",
        
         user: userOne._id.toHexString() 
        });
        


      const dbAddress = await Address.findOne({_id:res.body.id});
      expect(dbAddress).toBeDefined();
      expect(dbAddress).toMatchObject({ 
         
        id: expect.anything(), 
        fullname: newAddress.fullname, 
        phone: newAddress.phone, 
        province: newAddress.province, 
        city: newAddress.city, 
        city_code: newAddress.city_code, 
        address: newAddress.address, 
        addressType: newAddress.addressType,
        localType: "local", 
        user: userOne._id 
 
      });

      
    });
    test('should return 400 error if phone is invalid', async () => {
      await insertUsers([userOne]);
      newAddress.phone = 'invalidPhone';

     const res= await request(app)
        .post('/v1/address')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newAddress)
        .expect(httpStatus.BAD_REQUEST);
    });
    test("should return 401 error is access token is missing", async () => {
      await request(app)
        .post("/v1/address")
        .send(newAddress)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user's role is not supplier or user ", async () => {
     
      await insertUsers([admin]);

      await request(app)
        .post("/v1/address")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });
  
  
  
  
  
  });
 
  describe("GET /v1/address", () => {
     
    test("should return 200 and the user's addresses array", async () => {
      await insertUsers([userOne]);
      await insertAddresses([ addressOne, addressTwo, addressThree]);
  
      const res = await request(app)
        .get('/v1/address')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);
         //console.log(res.body)
       expect(res.body).toHaveLength(2);
        
    
        expect(res.body[0]).toEqual({
          id: expect.anything(),
          fullname: addressOne.fullname, 
        phone: addressOne.phone, 
        province: addressOne.province, 
        city: addressOne.city, 
        city_code: addressOne.city_code, 
        address: addressOne.address, 
        addressType: addressOne.addressType, 
        user: userOne._id.toHexString(),
        localType: "local", 
        });
      
        const dbAddress = await Address.findOne({_id:res.body[0].id});
        expect(dbAddress).toBeDefined();
        expect(dbAddress).toMatchObject({ 
           
          id: expect.anything(), 
          fullname: addressOne.fullname, 
          phone: addressOne.phone, 
          province: addressOne.province, 
          city: addressOne.city, 
          city_code: addressOne.city_code, 
          address: addressOne.address, 
          addressType: addressOne.addressType, 
          user: userOne._id 
   
        });

      
    
     })
    
     test("should return 401 error is access token is missing", async () => {
      await request(app)
        .get("/v1/address")
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test("should return 403 error if logged in user's role is not supplier or user ", async () => {
      await insertUsers([admin]);

      await request(app)
        .get("/v1/address")
        .set("Authorization", `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });
  
   
   })
 
   describe("PATCH /v1/address", () => {
    
    const   updatedAddress = {
        
        fullname: "updated fullname ",
        phone: "+923010000000",
        province:'fake province',
        city: "fake city",
        city_code: "fake city_code",
        address:"fake address",
        addressType: "home",
      };
     

      test("should return 200 and successfully update user's address if data is ok", async () => {
        
        await insertUsers([userOne]);
        await insertAddresses([ addressOne, addressTwo]);
    
        const res = await request(app)
          .patch(`/v1/address/${addressOne._id}`)
          .set("Authorization", `Bearer ${userOneAccessToken}`)
          .send(updatedAddress)
          .expect(httpStatus.OK);
          //console.log(res.body)
        expect(res.body).toEqual({
         
          id: expect.anything(),
          fullname: updatedAddress.fullname, 
        phone: updatedAddress.phone, 
        province: updatedAddress.province, 
        city: updatedAddress.city, 
        city_code: updatedAddress.city_code, 
        address: updatedAddress.address, 
        addressType: updatedAddress.addressType,
        localType: "local", 
        user: userOne._id.toHexString()
         
        });
  


        const dbAddress = await Address.findOne({_id:res.body.id});
        expect(dbAddress).toBeDefined();
        expect(dbAddress).toMatchObject({ 
           
          id: expect.anything(), 
          fullname: updatedAddress.fullname, 
          phone: updatedAddress.phone, 
          province: updatedAddress.province, 
          city: updatedAddress.city, 
          city_code: updatedAddress.city_code, 
          address: updatedAddress.address, 
          addressType: updatedAddress.addressType, 
          localType: "local", 
          user: userOne._id 
   
        });


       });
    
    
       test("should return 404 error if product already is not found", async () => {
        await insertUsers([userOne]);
        await insertAddresses([ addressTwo]);
    
        await request(app)
          .patch(`/v1/address/${addressOne._id}`)
          .set("Authorization", `Bearer ${userOneAccessToken}`)
          .send(updatedAddress)
          .expect(httpStatus.NOT_FOUND);
      });
      test("should return 403 error FORBIDDEN if user is updating  other user's address already is not found", async () => {
        await insertUsers([userOne]);
        await insertAddresses([ addressOne,addressTwo,addressThree]);
    
        await request(app)
          .patch(`/v1/address/${addressThree._id}`)
          .set("Authorization", `Bearer ${userOneAccessToken}`)
          .send(updatedAddress)
          .expect(httpStatus.FORBIDDEN);
      });

   })
  
  describe("DELETE /v1/address", () => {
     test("should return 204 if data is ok ", async () => {
      await insertUsers([userOne]);
      await insertAddresses([ addressOne, addressTwo]);
    
     
      const res= await request(app)
         .delete(`/v1/address/${addressTwo._id}`)
         .set("Authorization", `Bearer ${userOneAccessToken}`)
         .send()
        .expect(httpStatus.NO_CONTENT);
        const dbAddress = await Address.findOne({_id:addressTwo._id});
        expect(dbAddress).toBeNull();
  
     });

    test('retrun 200 if deleting the address which  is not found  ', async () => {
      await insertUsers([userOne]);
      await insertAddresses([ addressOne]);
    
     
      await request(app)
        .delete(`/v1/address/${addressTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
        
   })

   test('retrun 403 if deleting  address which  is not user-address  ', async () => {
    await insertUsers([userOne]);
    await insertAddresses([ addressOne,addressThree]);
  
   
    await request(app)
      .delete(`/v1/address/${addressThree._id}`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send()
      .expect(httpStatus.FORBIDDEN);
      
 })
 test('retrun 403  if deleting default address   ', async () => {
  await insertUsers([userOne]);
  await insertAddresses([ addressOne,addressThree]);

 
  await request(app)
    .delete(`/v1/address/${addressThree._id}`)
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .send()
    .expect(httpStatus.FORBIDDEN);
    
})


test('retrun 403  if deleting default address   ', async () => {
  await insertUsers([userOne]);
  await insertAddresses([ addressOne]);

 
  await request(app)
    .delete(`/v1/address/${addressOne._id}`)
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .send()
    .expect(httpStatus.FORBIDDEN);
    
})


    });


});

