import GroupModel from "../Models/groupModel";
import UserModel from "../Models/userModel";
import SourceModel from "../Models/sourceModel";
import mongoose from 'mongoose';
mongoose.models = {GroupModel,UserModel}

export default class SourceRepository {
    async findUser (obj) {
        try {
            const found = await UserModel.findById(obj)
            return found;
        } catch (error) {
            throw error
        }
    }


    async findGroup (obj) {
        try {
            const found = await GroupModel.findById(obj,'-groupPayment').populate('sources');
            return found;
        } catch (error) {
            throw error
        }
    }

    async findGroupApproval (obj) {
        try {
            const found = await SourceModel.find({approved:false}).populate('group');
            return found;
        } catch (error) {
            throw error
        }
    }

    async findSource (obj) {
        try {            
            const found = await SourceModel.findById(obj);
            return found;
        } catch (error) {
            throw error
        }
    }

    async addUserToGroup (args,verifyGroupId,verifyUserId) {
        try {
            const newTransaction = new Transaction(args);
            const sess = await mongoose.startSession();
            sess.startTransaction();      
            await newTransaction.save(); 
            verifyGroupId.groupPayment.push(newTransaction._id); 
            verifyGroupId.members.push(verifyUserId._id);
            verifyUserId.groups.push(verifyGroupId._id); 
            verifyUserId.transaction.push(newTransaction._id); 
            await verifyGroupId.save({ session: sess }); 
            await verifyUserId.save({ session: sess }); 
            await sess.commitTransaction(); 
            return "Joined";
        } catch (error) {
            throw error
        }
    }


    async createSource (obj) {
        try{
            const groupInfo = await this.findGroup(obj.groupId);
            const accountInfo = await this.findUser(obj.userId);
            const suggestorName = accountInfo.name;
            const {name,details,targetPrice,duration,price,unitsPurchase,groupId}=obj
            const approved = groupInfo.groupOwner == obj.userId?true:false;
            const sourceModel = new SourceModel({
                name,details,targetPrice,duration,price,unitsPurchase,approved:approved,suggestorName,group:groupId
            })
            if(approved){
                const sess = await mongoose.startSession();
                sess.startTransaction();
                await sourceModel.save({ session: sess });
                groupInfo.sources.push(sourceModel._id); 
                groupInfo.sources.push(sourceModel._id);
                await groupInfo.save({ session: sess }); 
                await sess.commitTransaction(); 
            }
            await sourceModel.save();
            // console.log(sourceModel,groupInfo)
            // const sess = await mongoose.startSession();
            // sess.startTransaction();
            // // await sourceModel.save({ session: sess });

            // groupInfo.sources.push(sourceModel._id); 
            // // await groupInfo.save({ session: sess }); 
            // await sess.commitTransaction(); 
            return {"success":true};
        } catch (error) {
            throw error
        }
    }
    async saveSource(groupInfo,sourceInfo){
        try{
            sourceInfo.approved = true;
            const sess = await mongoose.startSession();
            sess.startTransaction();
            console.log(groupInfo,sourceInfo);
            await sourceInfo.save({ session: sess });
            groupInfo.sources.push(sourceInfo._id); 
            await groupInfo.save({ session: sess }); 
            await sess.commitTransaction(); 
            console.log(groupInfo,sourceInfo);
            return true;
        }catch (error){
            throw error
        }
    }
    async deleteSourceSet(obj){
        try{    
            await obj.remove();
        } catch (error){
            throw error;
        }
    }
    async deleteSource (obj) {
        try{
            const groupInfo = await this.findGroup(obj.groupId);
            const sourceInfo = await this.findSource(obj.sourceId);
            const sess = await mongoose.startSession();
            sess.startTransaction();
            await sourceInfo.remove({session:sess});
            groupInfo.sources.pull(obj.sourceId); 
            await groupInfo.save({ session: sess }); 
            await sess.commitTransaction();; 
        } catch (error) {
            throw error
        }
        return {"success":true};
    }
}
