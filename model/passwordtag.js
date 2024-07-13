const passwordTagSchema = new mongoose.Schema({
  password: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Password',
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  }
});

const PasswordTag = mongoose.model('PasswordTag', passwordTagSchema);
module.exports = PasswordTag;