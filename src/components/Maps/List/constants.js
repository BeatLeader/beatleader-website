export const SORT_BY_VALUES = [
	{value: 'stars', name: 'Star', title: 'Sort by stars', icon: 'fa-star'},
	{value: 'accRating', name: 'Accability', title: 'Sort by acc rating', icon: 'fa-star'},
	{value: 'passRating', name: 'Passability', title: 'Sort by pass rating', icon: 'fa-star'},
	{value: 'techRating', name: 'Tech', title: 'Sort by tech rating', icon: 'fa-star'},
	{value: 'name', name: 'Name', title: 'Sort by name', icon: 'fa-a'},
	{value: 'timestamp', name: 'Map date', title: 'Sort by the map date', icon: 'fa-map'},
	{value: 'voting', name: 'Voting', title: 'Sort by positive minus negative vote count', icon: 'fa-vote-yea'},
	{value: 'voteratio', name: 'Vote ratio', title: 'Sort by vote ratio', icon: 'fa-smile-beam'},
	{value: 'votecount', name: 'Vote count', title: 'Sort by amount of votes for the map', icon: 'fa-calculator'},
	{value: 'playcount', name: 'Plays', title: 'Sort by play count', icon: 'fa-user'},
	{value: 'scoreTime', name: 'Newest score', title: 'Sort by the last made score', icon: 'fa-leaf'},
	{value: 'attempts', name: 'Attempts', title: 'Sort by the number of attempts', icon: 'fa-dumbbell'},
	{value: 'duration', name: 'Duration', title: 'Sort by the song duration', icon: 'fa-clock'},
	{value: 'bpm', name: 'BPM', title: 'Sort by the song BPM', icon: 'fa-drum'},
];

export const STAR_COLOR_OPTIONS = {
	pivot: 0.56,
	whiteTreshold: 8,
	darkenTreshold: 12,
	component2: 0.75,
	component3: 0.9,
	range: 'hsv',
	leftColor: {
		r: 0,
		g: 255,
		b: 0,
		a: 1,
	},
	centerColor: {
		r: 255,
		g: 0,
		b: 0,
		a: 1,
	},
	rightColor: {
		r: 255,
		g: 0,
		b: 255,
		a: 1,
	},
};
