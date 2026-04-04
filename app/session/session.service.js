const mongoose = require('mongoose');
const Session = require('./session.model');


const createSession = async (user) => {
 
     const session = await updateSession(user)
    return session;
};

const getSession = async (user,iatTime) => {

    const session = await findSession(user)
    if(!session) return true
    const tokenIatDate = new Date(iatTime * 1000);
    if(session.logoutTime&& tokenIatDate <= session.logoutTime) return false
    else return true
};

const findSession = async (user) => {
    const session = await Session.findOne({ user:user });
    return session
}
const updateSession = async (user) => {
    const session = await Session.updateOne({ user:user }, { $set: { logoutTime: new Date() } }, { upsert: true });
    if(!session) return new Error('Error while updating session');
    return session
}
module.exports = {  
    createSession,  
    getSession
}