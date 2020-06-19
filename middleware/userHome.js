module.exports = function getUserHome(req) {
  var ses = req.session? req.session : null;
  var userId = null, role = null, userName = null, userType = null, avatar = null;
  
  if(ses) {
    userId = ses.buyerId && ses.buyer? 
        ses.buyerId : ses.supervisorId && ses.supervisor? 
        ses.supervisorId : ses.supplierId && ses.supplier? 
        ses.supplierId : null;
    
    switch(userId) {
      case ses.buyerId:
        userType = 'Buyer';
        userName = ses.buyer.organizationName;
        role = ses.buyer.role;
        avatar = ses.buyer.avatar;
        break;
        
      case ses.supervisorId:
        userType = 'Supervisor';
        userName = ses.supervisor.organizationName;
        role = ses.supervisor.role;
        avatar = ses.supervisor.avatar;
        break;
        
      case ses.supplierId:
        userType = 'Supplier';
        userName = ses.supplier.companyName;
        role = ses.supplier.role;
        avatar = ses.supplier.avatar;
        break;
      
      default:
        break;        
    }
  }
  
  return {userId: userId, role: role, avatar: avatar, userName: userName, userType: userType};
}