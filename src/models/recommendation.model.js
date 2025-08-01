import mongoose, { Schema } from "mongoose";

const recommendationSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		tags: [
			{
				type: String,
				trim: true,
			},
		],
		excludedTags: [
			{
				type: String,
				trim: true,
			},
		],
		parentUser: [{
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null
		}],
	},
	{ timestamps: true },
);

export const Recommendation = mongoose.model(
	"Recommendation",
	recommendationSchema,
);
