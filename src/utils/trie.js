class TrieNode {
	constructor() {
		this.children = {};
		this.isEndOfWord = false;
		this.frequency = 0;
	}
}

class Trie {
	constructor() {
		this.root = new TrieNode();
	}

	insert(word, frequency = 1) {
		let node = this.root;
		for (const char of word) {
			if (!node.children[char]) {
				node.children[char] = new TrieNode();
			}
			node = node.children[char];
		}
		node.isEndOfWord = true;
		node.frequency += frequency; // Increment frequency count
	}

	search(word) {
		let node = this.root;
		for (const char of word) {
			if (!node.children[char]) {
				return null;
			}
			node = node.children[char];
		}
		return node;
	}

	getSuggestions(prefix) {
		const node = this.search(prefix);
		if (!node) return [];

		const suggestions = [];
		this._dfs(node, prefix, suggestions);
		suggestions.sort((a, b) => b.frequency - a.frequency); // Sort by frequency
		return suggestions.slice(0, 4);
	}

	_dfs(node, prefix, suggestions) {
		if (node.isEndOfWord) {
			suggestions.push({ term: prefix, frequency: node.frequency });
		}
		for (const char in node.children) {
			this._dfs(node.children[char], prefix + char, suggestions);
		}
	}
}

export default Trie;
