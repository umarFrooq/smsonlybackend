const removeVirtuals = (schema, removeVirtuals) => {
  if (schema && removeVirtuals && removeVirtuals.length) {
    removeVirtuals.map(rm => {
      delete schema.schema.virtuals[rm];
    });
    return schema;
  }
  else return null
}

const phoneNumberValidation = (value) => {
  let reg = /^\+(?:[0-9] ?){6,14}[0-9]$/;
  const valid = reg.test(value)
  return valid;
}
module.exports = { removeVirtuals, phoneNumberValidation }