const accessService = require("./access.service");
const catchAsync = require("../../utils/catchAsync");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");

// Create a new access
const createAccess = catchAsync(async (req, res) => {
    const { module, data } = req.body;
    const result = await accessService.createAccess(module, data);
    res.sendStatus(result);
});

// Get all accesses
const getAllAccesses = catchAsync(async (req, res) => {
    const accesses = await accessService.getAllAccesses();
    res.sendStatus(accesses);
});

// Update module name
const updateModuleName = catchAsync(async (req, res) => {
    const { previousModule, newModule } = req.body;
    const accesses = await accessService.updateModuleName({ previousModule, newModule });
    res.sendStatus(accesses);
});

// Update access by ID
const updateAccessById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updatedAccess = await accessService.updateBYId(id, data);
    res.sendStatus(updatedAccess);
});

// Delete access by ID
const deleteAccess = catchAsync(async (req, res) => {
    const { id } = req.params;
   const  accesses =  await accessService.deleteAccess(id);
    res.sendStatus(accesses);
});

// Delete all accesses by module
const deleteModule = catchAsync(async (req, res) => {
    const { module } = req.params;
   const  accesses = await accessService.deleteModule(module);
    res.sendStatus(accesses);
});

// Get access by ID
const getAccessById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const access = await accessService.getAccessById(id);
    res.sendStatus(access);
});

// Get accesses by module
const getAccessByModule = catchAsync(async (req, res) => {
    const { module } = req.params;
    const accesses = await accessService.getAccessByModule(module);
    res.sendStatus(accesses);
});


module.exports = {
    createAccess,
    getAllAccesses,
    updateModuleName,
    updateAccessById,
    deleteAccess,
    deleteModule,
    getAccessById,
    getAccessByModule,
    
};
