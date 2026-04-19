export const SORT_BY_VALUES = [
	{value: 'stars', name: 'Star', title: 'Sort by stars', icon: 'fa-star'},
	
	{value: 'name', name: 'Name', title: 'Sort by name', icon: 'fa-a'},
	{value: 'timestamp', name: 'Map date', title: 'Sort by the map date', icon: 'fa-map'},
	{value: 'voting', name: 'Likes', title: 'Sort by positive minus negative like count', icon: 'fa-thumbs-up'},
	
	{value: 'playcount', name: 'Plays', title: 'Sort by play count', icon: 'fa-user'},
	{value: 'attempts', name: 'Attempts', title: 'Sort by the number of attempts', icon: 'fa-dumbbell'},
	{value: 'duration', name: 'Duration', title: 'Sort by the song duration', icon: 'fa-clock'},
	{value: 'ebpm', name: 'EBPM', title: 'Sort by the peak sustained effective BPM', icon: 'fa-drum'},

	{value: 'scoreTime', name: 'Newest score', title: 'Sort by the last made score', icon: 'fa-leaf'},
	
	{value: 'accRating', name: 'Acc rating', title: 'Sort by acc rating', icon: 'fa-crosshairs'},
	{value: 'passRating', name: 'Pass rating', title: 'Sort by pass rating', icon: 'fa-person-walking-dashed-line-arrow-right'},
	{value: 'techRating', name: 'Tech rating', title: 'Sort by tech rating', icon: 'fa-arrows-split-up-and-left'},
	{value: 'multiRating', name: 'Multi hits', title: 'Sort by percentage of multi note hits', icon: 'fa-diagram-project'},
	{value: 'linearPercentage', name: 'Linear %', title: 'Sort by map linearity ratio', icon: 'linear-icon'},
	// {value: 'voteratio', name: 'Vote ratio', title: 'Sort by vote ratio', icon: 'fa-smile-beam'},
	// {value: 'votecount', name: 'Vote count', title: 'Sort by amount of votes for the map', icon: 'fa-calculator'},
	{value: 'bpm', name: 'BPM', title: 'Sort by the song BPM', icon: 'metronome-icon'},
	
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
