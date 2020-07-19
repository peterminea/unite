const users = [];

const addUser = ({ id, username, room }) => {//Submitting the chatLogin form should trigger this new User addition.
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();
  
  if(!username || !room) {
    return {
      error: 'Both User Name and Room are required. Please complete the data.'
    }
  }
  
  const existingUser = users.find( (user) => {
    return user.room === room && user.username === username;    
  })
  
  if(existingUser) {
    return {
      error: 'This username is already taken!'
    }
  }
  
  const user = {id, username, room};
  users.push(user);
  return {user};  
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if(index !== -1) {
    return users.splice(index, 1)[0];
  }
}

const getUser = (id) => {
  return users.find((user) => user.id === id);
}

const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => user.room === room);
}


if(typeof module !== 'undefined') module.exports = {
  addUser, removeUser, getUser, getUsersInRoom
};