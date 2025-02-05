import Trie from "../utils/trie.js";
import { SearchTerm } from "../models/searchTerm.model.js";

class SearchService {
	constructor() {
		this.trie = new Trie();
		this.loadTermsFromDatabase();
	}

	async loadTermsFromDatabase() {
		const terms = await SearchTerm.find();
		terms.forEach((term) => {
			this.trie.insert(term.term, term.frequency);
		});
	}

	async addTerm(term) {
		const existingTerm = await SearchTerm.findOne({ term });
		if (existingTerm) {
			existingTerm.frequency += 1;
			await existingTerm.save();
		} else {
			await SearchTerm.create({ term });
		}
		this.trie.insert(term.toLowerCase());
	}

	getSuggestions(query) {
		return this.trie.getSuggestions(query.toLowerCase());
	}
}

const searchService = new SearchService();
export default searchService;
