const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'Supervisor', 'Worker'],
    required: true,
    validate: {
      validator: function(v) {
        return ['Admin', 'Manager', 'Supervisor', 'Worker'].includes(v);
      },
      message: props => `${props.value} is not a valid role!`
    }
  }
});

module.exports = mongoose.model('User', UserSchema); 