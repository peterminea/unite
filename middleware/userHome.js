module.exports = function getUserHome(req) {
  var ses = req.session? req.session : null;
  var userId = null, role = null, userName = null, userType = null;
  
  if(ses) {
    userId = ses.buyerId? 
        ses.buyerId : ses.supervisorId? 
        ses.supervisorId : ses.supplierId? 
        ses.supplierId : null;
    
    switch(userId) {
      case ses.buyerId:
        userType = 'Buyer';
        userName = ses.buyer? ses.buyer.organizationName : null;
        role = ses.buyer? ses.buyer.role : null;
        break;
        
      case ses.supervisorId:
        userType = 'Supervisor';
        userName = ses.supervisor? ses.supervisor.organizationName : null;
        role = ses.supervisor? ses.supervisor.role : null;
        break;
        
      case ses.supplierId:
        userType = 'Supplier';
        userName = ses.supplier? ses.supplier.companyName : null;
        role = ses.supplier? ses.supplier.role : null;
        break;
      
      default:
        break;        
    }
    
    console.log(role);
  }
  
  return {userId: userId, role: role, userName: userName, userType: userType};
}