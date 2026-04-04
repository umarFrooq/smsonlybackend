const Accesses = require('./access.model');
const ApiError = require("../../utils/ApiError");

const createAccess = async (module, data) => {

    let existingAccessesOfModule = await Accesses.find({ name: module });
    const newAccessesOfModule = data.filter(({ name }) => {
        return !existingAccessesOfModule.some((existingAccess) => existingAccess.name === name);
    });
    let insertArray = [];
    for (let i = 0; i < newAccessesOfModule.length; i++) {
        let newAccess = newAccessesOfModule[i];
        newAccess.module = module
        insertArray.push({
            insertOne: {
                document: newAccess,
                upsert: true          //  upsert to update if it exists, or insert if it doesn't
            }
        });
    }

    const result = await Accesses.bulkWrite(insertArray)

    const accesses = await Accesses.find({ module: module });
    return accesses

};

const getAllPermissions = async () => {
    const accesses = await Accesses.find({});
    
    const formattedAccesses = accesses.reduce((acc, access) => {
        const { module, name, label, description } = access;
        
        if (!acc[module]) {
            acc[module] = [];
        }

        acc[module].push({
            name,
            label,
            description
        });

        return acc;
    }, {});

    return formattedAccesses;
}


const updateModuleName = async (data) => {

    const update = await Accesses.updateMany({ module: data.previousModule }, { module: data.newModule })
    return update
}
const updateBYId = async (id, data) => {
    const update = await Accesses.findByIdAndUpdate({ _id: id }, data,{new:true}) 
    if (!update) {
        throw new ApiError(404, 'Access not found')
    }
    return update
}

const deleteAccess = async (id) => {
    const deleteAccess = await Accesses.findByIdAndDelete({ _id: id })
    if (!deleteAccess) {
        throw new ApiError(404, 'Access not found')
    }
    return deleteAccess
}

const deleteModule = async (module) => {
    const deleteAccess = await Accesses.deleteMany({ module: module })
    if (!deleteAccess) {
        throw new ApiError(404, 'Access not found')
    }
    return deleteAccess
}

const getAccessById = async (id) => {
    const accesses = await Accesses.findById({ _id: id })
    if (!accesses) {
        throw new ApiError(404, 'Access not found')
    }
    return accesses
}

const getAccessByModule = async (module) => {
    const accesses = await Accesses.find({ module: module })
    if (!accesses) {
        throw new ApiError(404, 'Access not found')
    }
    return accesses
}

const getAllAccesses = async () => {
    const accesses = await Accesses.find({})
    return accesses
}

module.exports = {
    createAccess,
    getAllPermissions,
    updateModuleName,
    updateBYId,
    deleteAccess,
    deleteModule,
    getAccessById,
    getAccessByModule,
    getAllAccesses
}