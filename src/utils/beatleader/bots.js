export const BOT_CATEGORIES = [
	{
		id: 1,
		value: 'humanlike',
		label: 'Human-like',
		iconFa: 'fas fa-person-running',
		color: '#2b7bff',
		description: 'Realistic movements and theoretically achievable scores',
	},
	{
		id: 2,
		value: 'solver',
		label: 'Solver',
		iconFa: 'fas fa-microchip',
		color: '#9c27b0',
		description: 'Deterministic algorithms that usually 100% everything',
	},
	{
		id: 0,
		value: 'other',
		label: 'Other',
		iconFa: 'fas fa-robot',
		color: '#607d8b',
		description: 'Anything that fits neither of the other two',
	},
];

export const DEFAULT_BOT_CATEGORY = 'humanlike';

export const botCategoryById = id => BOT_CATEGORIES.find(c => c.id === id) ?? BOT_CATEGORIES[2];
export const botCategoryByValue = value => BOT_CATEGORIES.find(c => c.value === value) ?? null;

