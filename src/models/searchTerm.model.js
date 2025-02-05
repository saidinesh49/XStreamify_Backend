import mongoose, { Schema } from "mongoose";

const searchTermSchema = new Schema(
	{
		term: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		frequency: {
			type: Number,
			default: 1,
		},
	},
	{ timestamps: true },
);

export const SearchTerm = mongoose.model("SearchTerm", searchTermSchema);
