
const httpStatus = require("http-status");
const Rbac = require('./rbac.model')
const ApiError = require("../../utils/ApiError");
const {getCache,setCache,deleteCasheByKey} = require("../../utils/cache/cache");
const {rbacCache} = require('../../config/enums')
const { getAllPermissions} = require('../rbac-access/access.service');
const Accesses = require("../rbac-access/access.model");
const mongoose = require("mongoose");

/**
 * Creates a role in the system.
 *
 * @param {object} body - The role object to be created.
 * @param {string} body.roleType - The type of the role.
 * @param {Array} body.accessTypes - The access types associated with the role.
 * @throws {ApiError} FORBIDDEN - If the role already exists.
 * @throws {ApiError} FORBIDDEN - If there is an error creating the role.
 * @return {Promise<object>} - The created role object.
 */
const createRole = async (body) => {
  try {
    if(body.role === "admin") {
      throw new ApiError(httpStatus.FORBIDDEN , 'FORBIDDEN');
    }
    const roleAlreadyExists = await Rbac.findOne({ role: body.role });
    if (roleAlreadyExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Role already exists');
    }
    const uniqueAccess = [...new Set(body.access)];
     const newAccess = await Accesses.find({ name: { $in: uniqueAccess } });
     if(newAccess.length === 0 ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Access not found');
    }
    body.access = newAccess.map((access) => access._id);
    const role = await Rbac.create(body);
    if (!role) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Role could not be created");
    }
    // console.log("role type : "+typeof(role)+role)
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

/**
 * Updates a role with the given ID with the provided body.
 *
 * @param {string} id - The ID of the role to update.
 * @param {object} body - The new information for the role.
 * @param {array} body.access - The new access permissions for the role. If `complete` is true, replaces the entire access array.
 * @param {string} body.label - The new label for the role.
 * @param {string} body.description - The new description for the role.
 * @throws {ApiError} If the role with the given ID is not found.
 * @return {Promise<object>} The updated role object.
 */
const updateRole = async (id, body) => {
  
  const role = await Rbac.findById(id);
  if(!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, "role not found")
  }
  if(role.role === "admin") {
    throw new ApiError(httpStatus.FORBIDDEN , 'FORBIDDEN');
  }
  const key =`${rbacCache.keys.RBAC}/${role._id}`
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, "role not found")
  }
  if(body.access && body.access.length > 0){
    const isAlready = await Accesses.find({ name: { $in: body.access } },{ _id: 1 });
    if(!isAlready || isAlready.length === 0){
      throw new ApiError(httpStatus.BAD_REQUEST, "access not found")
    }
    const newAccess = isAlready.map(({ _id }) => _id.toString())
    const uniqueAccess = [...new Set([...newAccess])]
    const access = uniqueAccess.map((access)=>mongoose.Types.ObjectId(access))
    role.access = access
  }
  
  if(body.access && body.access.length === 0){
    role.access = []
  }

  if (body.label) {
    role.label = body.label
  }

  if (body.description) {
    role.description = body.description
  }
  await role.save();
  await setCache(key,undefined,role,rbacCache.ttl.DAY);
  return role
}


/**
 * Retrieves all roles from the Rbac collection.
 *
 * @return {Promise<Array>} An array of roles.
 */
const getRoles = async (filter, options) => {
  try {
    const key =`${rbacCache.keys.RBAC}-`

    const cache = await getCache(key,rbacCache);
    if (cache) {
      return cache;
    }

    let pipeline = [
      
        {
          '$lookup': {
            'from': 'accesses', 
            'localField': 'access', 
            'foreignField': '_id', 
            'as': 'accessDetails'
          }
        }, {
          '$set': {
            'access': {
              '$map': {
                'input': '$accessDetails', 
                'as': 'accessDoc', 
                'in': '$$accessDoc.name'
              }
            }
          }
        }
      ]
    


    if(filter && filter.role){
      pipeline.push({
        '$match': {
          'role': {
            '$regex': filter.role,
            '$options': 'i'
          }
        }
      })
    } 

    if(filter && filter.access){
      pipeline.push({
        '$match': {
          'access': {
            '$in': [filter.access]
          }
        }
      })
    }

    pipeline.push({
      '$project': { 
        'access': 1,
        'role': 1
      }
    })


    

    if(options && options.limit){
      pipeline.push({
        '$limit': options.limit
      })  
    }
      
    const roles = await Rbac.aggregate(pipeline)
    if (!roles) {
      throw new ApiError(httpStatus.BAD_REQUEST, "roles not found");
    }
    await setCache(key,undefined,roles,rbacCache.ttl.DAY);
    console.log(roles)
    return roles;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};


/**
 * Finds a role by its ID.
 *
 * @param {number} id - The ID of the role.
 * @return {Promise<object>} The role object if found.
 */
const findRoleById = async (user) => {
  try {
    const key =`${rbacCache.keys.RBAC}/${user.role}`
    const cache = await getCache(key);
    if (cache) {
      return cache;
    }
    const role = await Rbac.aggregate([
      {
        '$match': {
          'role': user.role
        }
      },
      {
        '$lookup': {
          'from': 'accesses', 
          'localField': 'access', 
          'foreignField': '_id', 
          'as': 'accessDetails'
        }
      }, {
        '$set': {
          'access': {
            '$map': {
              'input': '$accessDetails', 
              'as': 'accessDoc', 
              'in': '$$accessDoc.name'
            }
          }
        }
      },
      {
        '$project': { 
          "accessDetails":0
        }
      }
    ])
    if (!role) {
      throw new ApiError(httpStatus.BAD_REQUEST, "role not found");
    }
    await setCache(key,undefined,role,rbacCache.ttl.DAY);
    return role;
  }
  catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message)
  }

}


/**
 * Deletes a role with the given ID.
 *
 * @param {string} id - The ID of the role to delete.
 * @return {Promise} - A promise that resolves to the deleted role.
 */
const deleteRole = async (id) => {
  try {
    const key =`${rbacCache.keys.RBAC}/${id}`
    const isAdmin = await Rbac.findById(id);
    if(isAdmin.role === "admin") {
      throw new ApiError(httpStatus.FORBIDDEN , 'FORBIDDEN');
    }
    const role = Rbac.findByIdAndDelete(id);
    if (role == null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "role could not be deleted");
    }
    await deleteCasheByKey(key);
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message)
  }

};

/**
 * Deletes access types from a role.
 *
 * @param {string} roleId - The ID of the role to delete access types from.
 * @param {object} body - The body containing the access types to delete.
 * @return {Promise<object>} - A promise that resolves to the updated role object.
 * @throws {ApiError} - Throws an error if the role is not found.
 */

const deleteAccessTypes = async (roleId, body) => {
  try {
    const key =`${rbacCache.keys.RBAC}/${roleId}`

    const role = await Rbac.findById(roleId);
    if (role) {
      role.access = role.access.filter(access => !body.values.includes(access));
      await role.save();
      await setCache(key,undefined,role,rbacCache.ttl.DAY);
      return role;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found');
    }
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }


};

const getAllAccesses = async () => {
try{
  const permissions = await getAllPermissions()
  return permissions

}catch(error){
  throw new ApiError(httpStatus.BAD_REQUEST, error.message);
}
};


const accessCronJob = async () => {
  try{
    const accessArray = await Rbac.aggregate([
      {
        '$match': {
          'role': {
            '$ne': 'admin'
          }
        }
      }, {
        '$project': {
          'access': 1
        }
      }
    ])
    let accessNotFound = []

     for (let i = 0; i < accessArray.length; i++) {
      const access = accessArray[i].access;
      const newAccess = []
      for (let j = 0; j < access.length; j++) {
        const accessType = access[j];
        const doc = await Accesses.findOne({name:accessType});
        if(!doc||!doc._id){
          accessNotFound.push(accessType)
          continue
        } 
        newAccess.push(doc._id)
     }
     const x =6
     await Rbac.findOneAndUpdate({_id:accessArray[i]._id},{$set:{access:newAccess}})
     console.log("Not found : "+accessNotFound)
  }
}catch(error){
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}
module.exports = {
  createRole,
  updateRole,
  getRoles,
  deleteRole,
  deleteAccessTypes,
  findRoleById,
  getAllAccesses,
  accessCronJob
}



