module.exports = function getUserHome(req) {
  var ses = req.session? req.session : null;
  var userId = null, userName = null, userType = null;
  
  if(ses) {
    userId = ses.buyerId? 
        ses.buyerId : ses.supervisorId? 
        ses.supervisorId : ses.supplierId? 
        ses.supplierId : null;
    
    switch(userId) {
      case ses.buyerId:
        userType = 'Buyer';
        userName = ses.buyer? ses.buyer.organizationName : null;
        break;
        
      case ses.supervisorId:
        userType = 'Supervisor';
        userName = ses.supervisor? ses.supervisor.organizationName : null;
        break;
        
      case ses.supplierId:
        userType = 'Supplier';
        userName = ses.supplier? ses.supplier.organizationName : null;
        break;
      
      default:
        break;        
    }
  }
  
  return {userId: userId, userName: userName, userType: userType};
}