export const FAILED_SCORE_TYPES = [
	{
		value: 'UploadPace',
		name: 'Uploaded too soon',
		icon: 'fa-stopwatch',
		tone: 'review',
		title: 'Uploaded sooner after the previous score than the replay takes to play',
	},
	{
		value: 'NewAccount',
		name: 'New account top',
		icon: 'fa-user-clock',
		tone: 'review',
		title: 'Top 50 ranked score on a fresh login account',
	},
	{
		value: 'SameAccuracy',
		name: 'Same accuracy',
		icon: 'fa-clone',
		tone: 'suspicious',
		title: "Exactly the accuracy and score of another player's score",
	},
	{
		value: 'ScoreMismatch',
		name: 'Score mismatch',
		icon: 'fa-not-equal',
		tone: 'suspicious',
		title: 'The score recalculated from the replay differs from the uploaded one',
	},
	{
		value: 'AboveMaxScore',
		name: 'Above max score',
		icon: 'fa-arrow-up-wide-short',
		tone: 'suspicious',
		title: 'Bigger than the max score of the map',
	},
	{
		value: 'InvalidReplay',
		name: 'Invalid replay',
		icon: 'fa-file-circle-xmark',
		tone: 'suspicious',
		title: 'Too few notes or the wrong saber on a good cut',
	},
	{value: 'Statistics', name: 'Stats error', icon: 'fa-chart-line', tone: 'technical', title: "The replay stats couldn't be calculated"},
	{value: 'Exception', name: 'Server error', icon: 'fa-bug', tone: 'technical', title: 'The server threw while saving the score'},
	{
		value: 'Other',
		name: 'Other',
		icon: 'fa-circle-question',
		tone: 'technical',
		title: 'Not classified, or saved before the types existed',
	},
];

export const failedScoreType = value => FAILED_SCORE_TYPES.find(t => t.value == value) ?? FAILED_SCORE_TYPES[FAILED_SCORE_TYPES.length - 1];
