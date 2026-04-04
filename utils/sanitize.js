
    function sanitize(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v!=""));
        console.log(obj);
      }
      
  
  
  module.exports = sanitize;