const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	content: {
		type: String,
		required: true,
		trim: true,
	},
	tags: [
		{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'tag'
		},
	],
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	modifiedby: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	comments: [
		{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment",
		},
	],
	folder: {
		// New field to associate with a folder
		type: mongoose.Schema.Types.ObjectId,
		ref: "Folder",
	},
});

noteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const note = mongoose.model("Note", noteSchema);

module.exports = note;
