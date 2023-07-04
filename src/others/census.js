export let censusData = [
	{
		name: 'Surveyed Population',
		categories: [
			{
				name: 'Total Play Time',
				question: 'To the nearest hour, how many total hours have you spent playing Beat Saber?',
				effects: true,
				values: [
					{
						name: '< 100 Hours',
						count: 200,
						percentage: 19.880715705765407,
						effect: -39.24107845267257,
					},
					{
						name: '100-499 Hours',
						count: 358,
						percentage: 35.586481113320076,
						effect: -18.844955753019615,
					},
					{
						name: '500-999 Hours',
						count: 208,
						percentage: 20.675944333996025,
						effect: 13.344016854457838,
					},
					{
						name: '1000-1999 Hours',
						count: 182,
						percentage: 18.09145129224652,
						effect: 38.723938375778864,
					},
					{
						name: '\u2265 2000 Hours',
						count: 58,
						percentage: 5.7654075546719685,
						effect: 41.11899135331766,
					},
				],
			},
			{
				name: 'Using Mods',
				question: 'Have you ever played BeatSaber with the ScoreSaber and/or BeatLeader mods installed?',
				effects: false,
				values: [
					{
						name: 'Both',
						count: 799,
						percentage: 79.42345924453281,
					},
					{
						name: 'BeatLeader Only',
						count: 119,
						percentage: 11.829025844930417,
					},
					{
						name: 'Neither',
						count: 73,
						percentage: 7.256461232604374,
					},
					{
						name: 'ScoreSaber Only',
						count: 15,
						percentage: 1.4910536779324055,
					},
				],
			},
			{
				name: 'Secondary Account',
				question: 'Have you ever submitted a score using a BeatLeader or ScoreSaber account not listed above?',
				effects: false,
				values: [
					{
						name: 'No',
						count: 979,
						percentage: 97.31610337972168,
					},
					{
						name: 'Yes',
						count: 27,
						percentage: 2.68389662027833,
					},
				],
			},
			{
				name: 'Multiple Users',
				question: 'Has any person other than yourself ever submitted a score to any of the BeatLeader or ScoreSaber accounts listed above?',
				effects: false,
				values: [
					{
						name: 'No',
						count: 784,
						percentage: 80.7415036045314,
					},
					{
						name: 'Yes',
						count: 107,
						percentage: 11.019567456230691,
					},
					{
						name: 'Maybe',
						count: 80,
						percentage: 8.2389289392379,
					},
				],
			},
		],
	},
	{
		name: 'Technical Specifications',
		categories: [
			{
				name: 'Computer Formfactor',
				question: '',
				effects: true,
				values: [
					{
						name: 'Desktop',
						count: 513,
						percentage: 90.3169014084507,
						effect: 1.7630381815522975,
					},
					{
						name: 'Laptop',
						count: 55,
						percentage: 9.683098591549296,
						effect: -16.070771116457617,
					},
				],
			},
			{
				name: 'Number of SSDs',
				question: '',
				effects: false,
				values: [
					{
						name: '1',
						count: 547,
						percentage: 96.64310954063605,
					},
					{
						name: '2',
						count: 5,
						percentage: 0.88339222614841,
					},
					{
						name: '5',
						count: 4,
						percentage: 0.7067137809187279,
					},
					{
						name: '6',
						count: 3,
						percentage: 0.5300353356890459,
					},
					{
						name: '3',
						count: 3,
						percentage: 0.5300353356890459,
					},
					{
						name: '4',
						count: 3,
						percentage: 0.5300353356890459,
					},
					{
						name: '11',
						count: 1,
						percentage: 0.17667844522968199,
					},
				],
			},
			{
				name: 'Number of HDDs',
				question: '',
				effects: false,
				values: [
					{
						name: '1',
						count: 557,
						percentage: 98.40989399293287,
					},
					{
						name: '2',
						count: 7,
						percentage: 1.2367491166077738,
					},
					{
						name: '3',
						count: 1,
						percentage: 0.17667844522968199,
					},
				],
			},
			{
				name: 'CPU Vendor',
				question: '',
				effects: true,
				values: [
					{
						name: 'AMD',
						count: 333,
						percentage: 58.21678321678322,
						effect: 1.3990886837335914,
					},
					{
						name: 'Intel',
						count: 239,
						percentage: 41.78321678321678,
						effect: -1.9198257274550736,
					},
				],
			},
			{
				name: 'Processor Core Count',
				question: '',
				effects: false,
				values: [
					{
						name: '4',
						count: 8,
						percentage: 1.4059753954305798,
					},
					{
						name: '6',
						count: 22,
						percentage: 3.8664323374340945,
					},
					{
						name: '8',
						count: 48,
						percentage: 8.43585237258348,
					},
					{
						name: '12',
						count: 199,
						percentage: 34.973637961335676,
					},
					{
						name: '16',
						count: 199,
						percentage: 34.973637961335676,
					},
					{
						name: '20',
						count: 30,
						percentage: 5.272407732864675,
					},
					{
						name: '24',
						count: 45,
						percentage: 7.9086115992970125,
					},
					{
						name: '32',
						count: 18,
						percentage: 3.163444639718805,
					},
				],
			},
			{
				name: 'Processor Speed',
				question: '',
				effects: false,
				values: [
					{
						name: '\u2264 2400 Mhz',
						count: 16,
						percentage: 2.807017543859649,
					},
					{
						name: '2401-2799 Mhz',
						count: 41,
						percentage: 7.192982456140351,
					},
					{
						name: '2800-2999 Mhz',
						count: 51,
						percentage: 8.947368421052632,
					},
					{
						name: '3000-3499 Mhz',
						count: 107,
						percentage: 18.771929824561404,
					},
					{
						name: '3500-3749 Mhz',
						count: 219,
						percentage: 38.421052631578945,
					},
					{
						name: '3750-3999 Mhz',
						count: 79,
						percentage: 13.859649122807017,
					},
					{
						name: '4000-4499 Mhz',
						count: 44,
						percentage: 7.719298245614035,
					},
					{
						name: '\u2265 4500 Mhz',
						count: 13,
						percentage: 2.280701754385965,
					},
				],
			},
			{
				name: 'Operating System',
				question: '',
				effects: true,
				values: [
					{
						name: 'Windows 10\n(64 bit)',
						count: 385,
						percentage: 67.07317073170732,
						effect: 4.175806236997525,
					},
					{
						name: 'Windows 11\n(64 bit)',
						count: 177,
						percentage: 30.836236933797913,
						effect: -6.583743186612499,
					},
					{
						name: 'Other',
						count: 12,
						percentage: 2.0905923344947737,
						effect: -38.95098451564471,
					},
				],
			},
			{
				name: 'Video Card',
				question: '',
				effects: false,
				values: [
					{
						name: 'RTX 3060',
						count: 60,
						percentage: 10.471204188481675,
					},
					{
						name: 'RTX 3060 Ti',
						count: 47,
						percentage: 8.202443280977311,
					},
					{
						name: 'RTX 3070',
						count: 46,
						percentage: 8.027923211169284,
					},
					{
						name: 'RTX 3080',
						count: 41,
						percentage: 7.155322862129145,
					},
					{
						name: 'RTX 2060',
						count: 32,
						percentage: 5.5846422338568935,
					},
					{
						name: 'RTX 3070 Ti',
						count: 21,
						percentage: 3.664921465968586,
					},
					{
						name: 'RTX 2070 SUPER',
						count: 17,
						percentage: 2.966841186736475,
					},
					{
						name: 'GTX 1660 SUPER',
						count: 15,
						percentage: 2.6178010471204187,
					},
					{
						name: 'RTX 2060 SUPER',
						count: 15,
						percentage: 2.6178010471204187,
					},
					{
						name: 'RTX 2080 Ti',
						count: 15,
						percentage: 2.6178010471204187,
					},
					{
						name: 'GTX 1080 Ti',
						count: 13,
						percentage: 2.2687609075043627,
					},
					{
						name: 'RTX 2080',
						count: 13,
						percentage: 2.2687609075043627,
					},
					{
						name: 'GTX 1080',
						count: 12,
						percentage: 2.094240837696335,
					},
					{
						name: 'RTX 2070',
						count: 11,
						percentage: 1.9197207678883073,
					},
					{
						name: 'RTX 2080 SUPER',
						count: 11,
						percentage: 1.9197207678883073,
					},
					{
						name: 'Radeon\nRX 580 Series',
						count: 10,
						percentage: 1.7452006980802792,
					},
					{
						name: 'Intel(R)\nUHD Graphics',
						count: 9,
						percentage: 1.5706806282722512,
					},
					{
						name: 'RTX 3080 Ti',
						count: 9,
						percentage: 1.5706806282722512,
					},
					{
						name: 'RTX 3090',
						count: 9,
						percentage: 1.5706806282722512,
					},
					{
						name: 'Radeon\nRX 6700 XT',
						count: 9,
						percentage: 1.5706806282722512,
					},
					{
						name: 'Radeon(TM)\n Graphics',
						count: 9,
						percentage: 1.5706806282722512,
					},
					{
						name: 'GTX 1660',
						count: 8,
						percentage: 1.3961605584642234,
					},
					{
						name: 'Radeon\nRX 5700 XT',
						count: 8,
						percentage: 1.3961605584642234,
					},
					{
						name: 'GTX 1060 6GB',
						count: 7,
						percentage: 1.2216404886561953,
					},
					{
						name: 'Intel(R)\nUHD Graphics 770',
						count: 7,
						percentage: 1.2216404886561953,
					},
					{
						name: 'RTX 3060\nLaptop GPU',
						count: 7,
						percentage: 1.2216404886561953,
					},
					{
						name: 'GTX 1050 Ti',
						count: 6,
						percentage: 1.0471204188481675,
					},
					{
						name: 'Other',
						count: 106,
						percentage: 18.49912739965096,
					},
				],
			},
			{
				name: 'Amount of RAM',
				question: '',
				effects: true,
				values: [
					{
						name: '< 8 GB',
						count: 7,
						percentage: 1.2216404886561953,
						effect: -7.3955202952330445,
					},
					{
						name: '8-15 GB',
						count: 257,
						percentage: 44.85165794066317,
						effect: -0.7488644978521979,
					},
					{
						name: '16-31 GB',
						count: 261,
						percentage: 45.54973821989529,
						effect: 0.7961695594416658,
					},
					{
						name: '32-63 GB',
						count: 44,
						percentage: 7.678883071553229,
						effect: 0.7961695594416658,
					},
					{
						name: '\u2265 64 GB',
						count: 4,
						percentage: 0.6980802792321117,
						effect: 0.7961695594416658,
					},
				],
			},
			{
				name: 'Base stations count',
				question: '',
				effects: false,
				values: [
					{
						name: '1',
						count: 13,
						percentage: 6.701030927835052,
					},
					{
						name: '2',
						count: 133,
						percentage: 68.55670103092784,
					},
					{
						name: '3',
						count: 35,
						percentage: 18.04123711340206,
					},
					{
						name: '4',
						count: 13,
						percentage: 6.701030927835052,
					},
				],
			},
			{
				name: 'Space available',
				question: '',
				effects: false,
				values: [
					{
						name: '< 256 GB',
						count: 6,
						percentage: 1.0582010582010581,
					},
					{
						name: '256-512 GB',
						count: 28,
						percentage: 4.938271604938271,
					},
					{
						name: '512-1024 GB',
						count: 86,
						percentage: 15.167548500881834,
					},
					{
						name: '1-2 TB',
						count: 128,
						percentage: 22.57495590828924,
					},
					{
						name: '2-4 TB',
						count: 174,
						percentage: 30.687830687830687,
					},
					{
						name: '4-8 TB',
						count: 106,
						percentage: 18.69488536155203,
					},
					{
						name: '\u2265 8 TB',
						count: 39,
						percentage: 6.878306878306878,
					},
				],
			},
		],
	},
	{
		name: 'Demographics',
		categories: [
			{
				name: 'Sex',
				question: 'What is your sex?',
				effects: false,
				values: [
					{
						name: 'Male',
						count: 806,
						percentage: 82.32890704800818,
					},
					{
						name: 'Female',
						count: 91,
						percentage: 9.295199182839632,
					},
					{
						name: 'Other',
						count: 82,
						percentage: 8.375893769152196,
					},
				],
			},
			{
				name: 'Age',
				question: 'What is your age in years?',
				effects: true,
				values: [
					{
						name: '18-20',
						count: 242,
						percentage: 41.36752136752136,
						effect: 3.731787875557654,
					},
					{
						name: '21-24',
						count: 147,
						percentage: 25.128205128205128,
						effect: 0.1237700801271971,
					},
					{
						name: '25-29',
						count: 80,
						percentage: 13.675213675213676,
						effect: 0.1237700801271971,
					},
					{
						name: '30-39',
						count: 71,
						percentage: 12.136752136752136,
						effect: -12.842071507293207,
					},
					{
						name: '40-49',
						count: 28,
						percentage: 4.786324786324787,
						effect: -29.31,
					},
					{
						name: '\u2265 50',
						count: 17,
						percentage: 2.905982905982906,
						effect: -29.31,
					},
				],
			},
			{
				name: 'Ethnicity',
				question: 'What is your ethnicity?',
				effects: false,
				values: [
					{
						name: 'White',
						count: 760,
						percentage: 77.8688524590164,
					},
					{
						name: 'Asian',
						count: 109,
						percentage: 11.168032786885245,
					},
					{
						name: 'Black or\nAfrican American',
						count: 26,
						percentage: 2.663934426229508,
					},
					{
						name: 'American Indian or\nAlaska Native',
						count: 8,
						percentage: 0.819672131147541,
					},
					{
						name: 'Native Hawaiian\nor Pacific Islander',
						count: 3,
						percentage: 0.3073770491803279,
					},
					{
						name: 'Other',
						count: 70,
						percentage: 7.172131147540983,
					},
				],
			},
			{
				name: 'Language',
				question: 'Which languages do you speak fluently? If multiple, list all languages spoken in order of proficiency.',
				effects: true,
				values: [
					{
						name: 'English',
						count: 845,
						percentage: 60.099573257467995,
						effect: -0.19299518324295048,
					},
					{
						name: 'German',
						count: 71,
						percentage: 5.049786628733997,
						effect: -3.431821381702115,
					},
					{
						name: 'French',
						count: 58,
						percentage: 4.125177809388336,
						effect: 10.740742434501872,
					},
					{
						name: 'Spanish',
						count: 49,
						percentage: 3.4850640113798006,
						effect: 19.023188976206836,
					},
					{
						name: 'Japanese',
						count: 37,
						percentage: 2.631578947368421,
						effect: 2.2559455986986934,
					},
					{
						name: 'Dutch',
						count: 33,
						percentage: 2.3470839260312943,
						effect: 2.37351576591021,
					},
					{
						name: 'Polish',
						count: 22,
						percentage: 1.5647226173541962,
						effect: 11.828771439795537,
					},
					{
						name: 'Russian',
						count: 21,
						percentage: 1.4935988620199145,
						effect: -3.883210078888297,
					},
					{
						name: 'Chinese',
						count: 19,
						percentage: 1.3513513513513513,
						effect: -2.5692123959415176,
					},
					{
						name: 'Portuguese',
						count: 12,
						percentage: 0.8534850640113799,
					},
					{
						name: 'Danish',
						count: 12,
						percentage: 0.8534850640113799,
					},
					{
						name: 'Finnish',
						count: 12,
						percentage: 0.8534850640113799,
					},
					{
						name: 'Norwegian',
						count: 10,
						percentage: 0.7112375533428165,
					},
					{
						name: 'Hungarian',
						count: 9,
						percentage: 0.6401137980085349,
					},
					{
						name: 'Korean',
						count: 7,
						percentage: 0.4978662873399715,
					},
					{
						name: 'Czech',
						count: 6,
						percentage: 0.42674253200568996,
					},
					{
						name: 'Italian',
						count: 6,
						percentage: 0.42674253200568996,
					},
					{
						name: 'Swedish',
						count: 5,
						percentage: 0.35561877667140823,
					},
					{
						name: 'Estonian',
						count: 5,
						percentage: 0.35561877667140823,
					},
					{
						name: 'Other',
						count: 167,
						percentage: 11.877667140825036,
					},
				],
			},
			{
				name: 'Employment Status',
				question: 'Which of the following options best represents your current employment status?',
				effects: true,
				values: [
					{
						name: 'Student',
						count: 521,
						percentage: 53.71134020618557,
						effect: 0.7804425660220291,
					},
					{
						name: 'Employed full time',
						count: 229,
						percentage: 23.60824742268041,
						effect: -6.260519300290585,
					},
					{
						name: 'Employed part time',
						count: 96,
						percentage: 9.896907216494846,
						effect: 4.827272250100984,
					},
					{
						name: 'Unemployed\nlooking for work',
						count: 77,
						percentage: 7.9381443298969065,
					},
					{
						name: 'Unemployed not\nlooking for work',
						count: 37,
						percentage: 3.814432989690722,
					},
					{
						name: 'Disabled',
						count: 8,
						percentage: 0.8247422680412372,
					},
					{
						name: 'Other',
						count: 2,
						percentage: 0.2061855670103093,
						effect: 3.9296885616246855,
					},
				],
			},
			{
				name: 'Income',
				question:
					'Which of the following options best represents your total gross income in 2022? Convert your answer to United States Dollars (USD).',
				effects: false,
				values: [
					{
						name: 'Less than\n$10,000',
						count: 583,
						percentage: 64.20704845814979,
					},
					{
						name: '$10,000\nto $19,999',
						count: 94,
						percentage: 10.352422907488986,
					},
					{
						name: '$20,000\nto $29,999',
						count: 39,
						percentage: 4.295154185022026,
					},
					{
						name: '$30,000\nto $39,999',
						count: 45,
						percentage: 4.955947136563877,
					},
					{
						name: '$40,000\nto $49,999',
						count: 39,
						percentage: 4.295154185022026,
					},
					{
						name: '$50,000\nto $59,999',
						count: 25,
						percentage: 2.753303964757709,
					},
					{
						name: '$60,000\nto $69,999',
						count: 14,
						percentage: 1.5418502202643172,
					},
					{
						name: '$70,000\nto $79,999',
						count: 14,
						percentage: 1.5418502202643172,
					},
					{
						name: '$80,000\nto $89,999',
						count: 16,
						percentage: 1.762114537444934,
					},
					{
						name: '$90,000\nto $99,999',
						count: 5,
						percentage: 0.5506607929515419,
					},
					{
						name: '$100,000\nto $149,999',
						count: 20,
						percentage: 2.2026431718061676,
					},
					{
						name: 'More than\n$150,000',
						count: 14,
						percentage: 1.5418502202643172,
					},
				],
			},
			{
				name: 'Educational Status',
				question: 'What is the highest degree or level of school you have completed?',
				effects: true,
				values: [
					{
						name: 'Less than\nhigh school',
						count: 345,
						percentage: 36.12565445026178,
						effect: 2.723437471152589,
					},
					{
						name: 'High school\ngraduate',
						count: 246,
						percentage: 25.759162303664922,
						effect: 4.321348996200147,
					},
					{
						name: 'Some college',
						count: 169,
						percentage: 17.69633507853403,
						effect: -0.8899227169426072,
					},
					{
						name: '4 year degree',
						count: 108,
						percentage: 11.30890052356021,
						effect: -13.450985493503609,
					},
					{
						name: 'Professional\ndegree',
						count: 47,
						percentage: 4.9214659685863875,
					},
					{
						name: '2 year degree',
						count: 34,
						percentage: 3.56020942408377,
						effect: -10.989546614321299,
					},
					{
						name: 'Doctorate',
						count: 6,
						percentage: 0.6282722513089005,
						effect: -33.90958840511479,
					},
				],
			},
			{
				name: 'Marital Status',
				question: 'Which of the following options best represents your current marital status?',
				effects: true,
				values: [
					{
						name: 'Never married',
						count: 896,
						percentage: 93.43065693430657,
						effect: 1.317116319069453,
					},
					{
						name: 'Married',
						count: 39,
						percentage: 4.066736183524505,
						effect: -22.167061185689917,
					},
					{
						name: 'Divorced',
						count: 16,
						percentage: 1.6684045881126173,
						effect: -17.8995720499322,
					},
					{
						name: 'Separated',
						count: 6,
						percentage: 0.6256517205422315,
						effect: -23.887591291400163,
					},
					{
						name: 'Widowed',
						count: 2,
						percentage: 0.20855057351407716,
						effect: -13.122155010826233,
					},
				],
			},
			{
				name: 'Political Orientation',
				question: 'Which of the following generally best represents your political views?',
				effects: true,
				values: [
					{
						name: 'Independent\nor Neither',
						count: 454,
						percentage: 48.60813704496788,
						effect: 3.775551410061756,
					},
					{
						name: 'Liberal\nor Left Wing',
						count: 334,
						percentage: 35.76017130620985,
						effect: -7.26679674811797,
						image: '/assets/body/blue_hat.png',
					},
					{
						name: 'Conservative\nor Right Wing',
						count: 72,
						percentage: 7.708779443254818,
						effect: 12.499259144494744,
						image: '/assets/body/red_hat.png',
					},
					{
						name: 'Other',
						count: 74,
						percentage: 7.922912205567452,
						effect: -9.834919816184428,
						image: '/assets/body/other_hat.png',
					},
				],
			},
		],
	},
	{
		name: 'Background',
		categories: [
			{
				name: 'Any Music',
				question: 'Have you ever skillfully played a musical instrument?',
				effects: true,
				values: [
					{
						name: 'No',
						count: 558,
						percentage: 55.46719681908549,
						effect: 2.617434482777791,
					},
					{
						name: 'Yes',
						count: 448,
						percentage: 44.53280318091451,
						effect: -3.0404541971661456,
					},
				],
			},
			{
				name: 'Music',
				question: 'If you have ever skillfully played a musical instrument, list the instrument(s).',
				effects: true,
				values: [
					{
						name: 'Piano',
						count: 195,
						percentage: 27.310924369747898,
						effect: 0.8742868898296597,
					},
					{
						name: 'Guitar',
						count: 107,
						percentage: 14.985994397759104,
						effect: 4.126087479879375,
					},
					{
						name: 'Drums',
						count: 63,
						percentage: 8.823529411764707,
						effect: -2.5839331280581033,
					},
					{
						name: 'Trumpet',
						count: 58,
						percentage: 8.123249299719888,
						effect: -1.8589827346141552,
					},
					{
						name: 'Violin',
						count: 41,
						percentage: 5.742296918767507,
						effect: -12.697033272803104,
					},
					{
						name: 'Saxophone',
						count: 26,
						percentage: 3.6414565826330536,
						effect: -19.472742656009483,
					},
					{
						name: 'Trombone',
						count: 23,
						percentage: 3.221288515406162,
						effect: 1.3067563642873365,
					},
					{
						name: 'Clarinet',
						count: 21,
						percentage: 2.941176470588235,
						effect: -25.35524845305443,
					},
					{
						name: 'Flute',
						count: 18,
						percentage: 2.5210084033613445,
						effect: -4.909467962492517,
					},
					{
						name: 'Cello',
						count: 16,
						percentage: 2.2408963585434174,
						effect: -18.282631395752986,
					},
					{
						name: 'Bass',
						count: 14,
						percentage: 1.9607843137254901,
						effect: -1.4452605818736823,
					},
					{
						name: 'Recorder',
						count: 11,
						percentage: 1.5406162464985995,
						effect: -19.808251478596073,
					},
					{
						name: 'Ukulele',
						count: 8,
						percentage: 1.1204481792717087,
					},
					{
						name: 'Viola',
						count: 7,
						percentage: 0.9803921568627451,
					},
					{
						name: 'Percussion',
						count: 6,
						percentage: 0.8403361344537815,
					},
					{
						name: 'French Horn',
						count: 5,
						percentage: 0.700280112044818,
					},
					{
						name: 'Tuba',
						count: 4,
						percentage: 0.5602240896358543,
					},
					{
						name: 'Other',
						count: 91,
						percentage: 12.745098039215685,
					},
				],
			},
			{
				name: 'Any Rhythm Games',
				question: 'Have you ever played a rhythm game other than Beat Saber?',
				effects: true,
				values: [
					{
						name: 'Yes',
						count: 660,
						percentage: 65.60636182902584,
						effect: -1.0363352113090267,
					},
					{
						name: 'No',
						count: 346,
						percentage: 34.39363817097416,
						effect: 2.2371073749659702,
					},
				],
			},
			{
				name: 'Rhythm Games',
				question: 'If you have ever played a rhythm game other than Beat Saber, list the game(s).',
				effects: true,
				values: [
					{
						name: 'Other',
						count: 625,
						percentage: 33.78378378378378,
					},
					{
						name: 'osu!',
						count: 383,
						percentage: 20.7027027027027,
						effect: 2.9251138705398323,
					},
					{
						name: 'Guitar Hero',
						count: 107,
						percentage: 5.783783783783783,
						effect: -4.324310980906644,
					},
					{
						name: 'A Dance Of \nFire And Ice',
						count: 100,
						percentage: 5.405405405405405,
					},
					{
						name: 'Geometry Dash',
						count: 100,
						percentage: 5.405405405405405,
						effect: -6.928947576259394,
					},
					{
						name: 'Quaver',
						count: 82,
						percentage: 4.4324324324324325,
						effect: 18.7846789892678,
					},
					{
						name: 'Muse Dash',
						count: 65,
						percentage: 3.5135135135135136,
						effect: 6.6039222971786495,
					},
					{
						name: 'Dance Dance\nRevolution',
						count: 42,
						percentage: 2.27027027027027,
						effect: -22.95101571434843,
					},
					{
						name: 'Synth Riders',
						count: 38,
						percentage: 2.054054054054054,
						effect: -4.959969419680079,
					},
					{
						name: 'Arcaea',
						count: 36,
						percentage: 1.9459459459459458,
						effect: 14.384734315514864,
					},
					{
						name: 'Pistol Whip',
						count: 27,
						percentage: 1.4594594594594594,
						effect: -2.035945528529496,
					},
					{
						name: 'Rock Band',
						count: 25,
						percentage: 1.3513513513513513,
					},
					{
						name: 'Sound Voltex',
						count: 22,
						percentage: 1.1891891891891893,
						effect: -9.29810666860659,
					},
					{
						name: 'Audica',
						count: 22,
						percentage: 1.1891891891891893,
						effect: 10.632130693800798,
					},
					{
						name: 'Adofai',
						count: 21,
						percentage: 1.135135135135135,
						effect: -1.2330015529840572,
					},
					{
						name: 'Rhythm Doctor',
						count: 18,
						percentage: 0.9729729729729729,
					},
					{
						name: 'Osumania',
						count: 18,
						percentage: 0.9729729729729729,
					},
					{
						name: 'Spin Rhythm Xd',
						count: 18,
						percentage: 0.9729729729729729,
					},
					{
						name: 'Wacca',
						count: 17,
						percentage: 0.9189189189189189,
					},
					{
						name: 'Phigros',
						count: 17,
						percentage: 0.9189189189189189,
					},
					{
						name: 'Just Dance',
						count: 14,
						percentage: 0.7567567567567568,
					},
					{
						name: 'Stepmania',
						count: 14,
						percentage: 0.7567567567567568,
					},
					{
						name: 'Clone Hero',
						count: 13,
						percentage: 0.7027027027027027,
					},
					{
						name: 'Trombone Champ',
						count: 13,
						percentage: 0.7027027027027027,
					},
					{
						name: 'Boombox',
						count: 13,
						percentage: 0.7027027027027027,
					},
				],
			},
			{
				name: 'Any Athletics',
				question: 'Have you ever competitively participated in an individual or team-based athletic sport?',
				effects: true,
				values: [
					{
						name: 'No',
						count: 548,
						percentage: 54.47316103379721,
						effect: -5.616402054746535,
					},
					{
						name: 'Yes',
						count: 458,
						percentage: 45.52683896620278,
						effect: 6.254314386890589,
					},
				],
			},
			{
				name: 'Athletics',
				question: 'If you have ever competitively participated in an individual or team-based athletic sport, list the sport(s)',
				effects: true,
				values: [
					{
						name: 'Swimming',
						count: 114,
						percentage: 13.286713286713287,
						effect: 16.02158129682751,
					},
					{
						name: 'Soccer',
						count: 101,
						percentage: 11.771561771561771,
						effect: 8.359605711483937,
					},
					{
						name: 'Basketball',
						count: 83,
						percentage: 9.673659673659674,
						effect: 6.981596691421078,
					},
					{
						name: 'Tennis',
						count: 49,
						percentage: 5.710955710955711,
						effect: 18.535429985437155,
					},
					{
						name: 'Baseball',
						count: 47,
						percentage: 5.477855477855478,
						effect: -4.18798169893516,
					},
					{
						name: 'Track',
						count: 36,
						percentage: 4.195804195804196,
						effect: -7.864000723345336,
					},
					{
						name: 'Football',
						count: 34,
						percentage: 3.9627039627039626,
						effect: 2.7912618686689554,
					},
					{
						name: 'Cross Country',
						count: 23,
						percentage: 2.6806526806526807,
						effect: 2.5035989868506023,
					},
					{
						name: 'Badminton',
						count: 20,
						percentage: 2.331002331002331,
						effect: 23.477526473502557,
					},
					{
						name: 'Golf',
						count: 19,
						percentage: 2.2144522144522143,
						effect: 19.199717128321968,
					},
					{
						name: 'Volleyball',
						count: 15,
						percentage: 1.7482517482517483,
					},
					{
						name: 'Hockey',
						count: 15,
						percentage: 1.7482517482517483,
					},
					{
						name: 'Karate',
						count: 14,
						percentage: 1.6317016317016315,
					},
					{
						name: 'Judo',
						count: 14,
						percentage: 1.6317016317016315,
					},
					{
						name: 'Handball',
						count: 10,
						percentage: 1.1655011655011656,
					},
					{
						name: 'Table Tennis',
						count: 10,
						percentage: 1.1655011655011656,
					},
					{
						name: 'Rugby',
						count: 9,
						percentage: 1.048951048951049,
					},
					{
						name: 'Gymnastics',
						count: 8,
						percentage: 0.9324009324009324,
					},
					{
						name: 'Ice Hockey',
						count: 8,
						percentage: 0.9324009324009324,
					},
					{
						name: 'Climbing',
						count: 7,
						percentage: 0.8158508158508158,
					},
					{
						name: 'Bowling',
						count: 7,
						percentage: 0.8158508158508158,
					},
					{
						name: 'Cricket',
						count: 7,
						percentage: 0.8158508158508158,
					},
					{
						name: 'Cycling',
						count: 6,
						percentage: 0.6993006993006993,
					},
					{
						name: 'Rowing',
						count: 4,
						percentage: 0.4662004662004662,
					},
					{
						name: 'Other',
						count: 198,
						percentage: 23.076923076923077,
					},
				],
			},
			{
				name: 'Dance',
				question: 'Have you ever skillfully practiced or exhibited a recognized form of dance?',
				effects: true,
				values: [
					{
						name: 'No',
						count: 808,
						percentage: 83.64389233954451,
						effect: 1.5346028946878365,
					},
					{
						name: 'Yes, recreationally',
						count: 134,
						percentage: 13.871635610766045,
						effect: -5.709171970573638,
					},
					{
						name: 'Yes, professionally\nor competitively',
						count: 24,
						percentage: 2.484472049689441,
						effect: -22.089582818617178,
					},
				],
			},
		],
	},
	{
		name: 'Behavior Patterns',
		categories: [
			{
				name: 'Grip',
				question: 'Which of the following grips do you prefer to use on standalone VR devices?',
				effects: true,
				values: [
					{
						name: 'Default Grip',
						count: 229,
						percentage: 48.21052631578947,
						effect: -8.2188621322567,
						image: '/assets/body/default_grip.png',
					},
					{
						name: 'Claw Grip',
						count: 154,
						percentage: 32.421052631578945,
						effect: 7.129561121660033,
						image: '/assets/body/claw_grip.png',
					},
					{
						name: 'Standard M-Grip',
						count: 13,
						percentage: 2.736842105263158,
						effect: 56.518464817375914,
						image: '/assets/body/m_grip.png',
					},
					{
						name: 'Yoshi M-Grip',
						count: 10,
						percentage: 2.1052631578947367,
						effect: 22.631562078901275,
						image: '/assets/body/myoshi_grip.png',
					},
					{
						name: 'Standard C-Grip',
						count: 7,
						percentage: 1.4736842105263157,
						effect: -30.6129790123101,
						image: '/assets/body/c_grip.png',
					},
					{
						name: 'Crab Grip',
						count: 6,
						percentage: 1.263157894736842,
						effect: 28.574233034146435,
						image: '/assets/body/crab_grip.png',
					},
					{
						name: 'Reverse Claw Grip',
						count: 6,
						percentage: 1.263157894736842,
						effect: -70.682,
						image: '/assets/body/reverseclaw_grip.png',
					},
					{
						name: 'Not Applicable\n/ Varies',
						count: 4,
						percentage: 0.8421052631578947,
						effect: 0,
						image: '/assets/body/unknown_grip.png',
					},
					{
						name: 'Nose Grip',
						count: 1,
						percentage: 0.21,
						effect: -100,
						image: '/assets/body/nose_grip.png',
					},
					{
						name: 'Other',
						count: 52,
						percentage: 10.947368421052632,
						effect: 0,
						image: '/assets/body/unknown_grip.png',
					},
				],
			},
			{
				name: 'Caffinated Beverages',
				question:
					'Approximately how many caffeinated foods or beverages (e.g., Coffee, Black Tea, Energy Drinks, etc.) do you consume on a regular basis?',
				effects: true,
				values: [
					{
						name: 'None (or Rarely)',
						count: 393,
						percentage: 40.34907597535934,
						effect: -1.4803886654339828,
					},
					{
						name: '1-2 Items Weekly',
						count: 211,
						percentage: 21.66324435318275,
						effect: 3.104125404321248,
					},
					{
						name: '1-2 Items Daily',
						count: 278,
						percentage: 28.54209445585216,
						effect: 6.0936979356988585,
					},
					{
						name: '3-4 Items Daily',
						count: 61,
						percentage: 6.262833675564681,
						effect: -17.29916469651528,
					},
					{
						name: '5+ Items Daily',
						count: 31,
						percentage: 3.1827515400410675,
						effect: -22.094844004566454,
					},
				],
			},
			{
				name: 'Caffeine',
				question: 'Do you usually consume caffeine in the 3 hours before starting to play Beat Saber?',
				effects: true,
				values: [
					{
						name: "No, I don't often\nconsume caffeine",
						count: 477,
						percentage: 49.12461380020597,
						effect: -1.376218995263945,
					},
					{
						name: 'No, usually not\nwithin 3 hours',
						count: 172,
						percentage: 17.71369721936148,
						effect: 2.666217709971291,
					},
					{
						name: 'Yes, sometimes\nwithin 3 hours',
						count: 110,
						percentage: 11.328527291452112,
						effect: 0.7632503222158633,
					},
					{
						name: 'Yes, usually\nwithin 1 hour',
						count: 93,
						percentage: 9.577754891864057,
						effect: -1.2982388914180156,
					},
					{
						name: 'Yes, sometimes\nwithin 1 hour',
						count: 82,
						percentage: 8.444902162718847,
						effect: 2.2614445894361115,
					},
					{
						name: 'Yes, usually\nwithin 3 hours',
						count: 37,
						percentage: 3.810504634397528,
						effect: 1.0795504194021044,
					},
				],
			},
			{
				name: 'Preparation',
				question: 'Which of the following activities, if any, do you perform immediately before playing Beat Saber?',
				effects: true,
				values: [
					{
						name: 'None',
						count: 247,
						percentage: 24.552683896620277,
						effect: -8.917772073579954,
					},
					{
						name: 'Warmup Only',
						count: 244,
						percentage: 24.254473161033797,
						effect: 14.470923981727124,
					},
					{
						name: 'Warmup\nand Stretches',
						count: 192,
						percentage: 19.08548707753479,
						effect: 3.6491723636668247,
					},
					{
						name: 'Other',
						count: 323,
						percentage: 32.10735586481113,
						effect: -3.624251312109837,
					},
				],
			},
			{
				name: 'Physical Fitness',
				question: 'How would you rate your current level of overall physical fitness?',
				effects: false,
				values: [
					{
						name: 'Far below average',
						count: 51,
						percentage: 5.246913580246913,
					},
					{
						name: 'Below average',
						count: 252,
						percentage: 25.925925925925924,
					},
					{
						name: 'Average',
						count: 387,
						percentage: 39.81481481481482,
					},
					{
						name: 'Above average',
						count: 242,
						percentage: 24.897119341563787,
					},
					{
						name: 'Far above average',
						count: 40,
						percentage: 4.11522633744856,
					},
				],
			},
			{
				name: 'Had COVID',
				question: ' In the past year, have you experienced COVID19?',
				effects: false,
				values: [
					{
						name: 'No',
						count: 655,
						percentage: 65.10934393638172,
					},
					{
						name: 'Yes',
						count: 351,
						percentage: 34.890656063618295,
					},
				],
			},
			{
				name: 'Substance Use',
				question: 'How often do you play Beat Saber while under the influence of an intoxicating substance (including alcohol)?',
				effects: true,
				values: [
					{
						name: 'Never',
						count: 778,
						percentage: 80.20618556701031,
						effect: -0.6405504876992093,
					},
					{
						name: 'Rarely',
						count: 130,
						percentage: 13.402061855670103,
						effect: 10.688021789556629,
					},
					{
						name: 'Somewhat Often',
						count: 24,
						percentage: 2.4742268041237114,
						effect: -14.2815538993324,
					},
					{
						name: 'Often',
						count: 38,
						percentage: 3.917525773195876,
						effect: -17.620920409327052,
					},
				],
			},
		],
	},
	{
		name: 'Health',
		categories: [
			{
				name: 'Eyesight',
				question: 'Do you regularly wear prescription glasses or contact lenses?',
				effects: true,
				values: [
					{
						name: 'Never',
						count: 532,
						percentage: 54.62012320328542,
						effect: 3.4455941754485684,
					},
					{
						name: 'Often',
						count: 349,
						percentage: 35.831622176591374,
						effect: -2.7116862423583536,
					},
					{
						name: 'Sometimes',
						count: 93,
						percentage: 9.548254620123203,
						effect: -9.864765693326763,
					},
				],
			},
			{
				name: 'Lenses',
				question: 'Do you usually wear prescription glasses or contact lenses while playing Beat Saber?',
				effects: true,
				values: [
					{
						name: 'Never',
						count: 721,
						percentage: 74.1769547325103,
						effect: 2.173689297291548,
					},
					{
						name: 'Often',
						count: 231,
						percentage: 23.765432098765434,
						effect: -5.159145497527505,
					},
					{
						name: 'Sometimes',
						count: 20,
						percentage: 2.05761316872428,
						effect: -15.928698690110135,
					},
				],
			},
			{
				name: 'Color Blindness',
				question: 'Do you have any form of color blindness or color vision deficiency?',
				effects: true,
				values: [
					{
						name: 'No',
						count: 888,
						percentage: 91.45211122554068,
						effect: -0.018322155098275596,
					},
					{
						name: 'Yes',
						count: 52,
						percentage: 5.355303810504634,
						effect: 0.3094850980730239,
					},
					{
						name: 'Maybe',
						count: 31,
						percentage: 3.192584963954686,
					},
				],
			},
			{
				name: 'Any Physical Disabilities',
				question: 'Have you ever been diagnosed with a physical disability or other physical health condition?',
				effects: false,
				values: [
					{
						name: 'No',
						count: 850,
						percentage: 84.49304174950298,
					},
					{
						name: 'Yes',
						count: 156,
						percentage: 15.50695825049702,
					},
				],
			},
			{
				name: 'Any Mental Disabilities',
				question: '. Have you ever been diagnosed with a mental disability or other mental health condition?',
				effects: false,
				values: [
					{
						name: 'No',
						count: 783,
						percentage: 77.83300198807157,
					},
					{
						name: 'Yes',
						count: 223,
						percentage: 22.166998011928428,
					},
				],
			},
		],
	},
	{
		name: 'Environment',
		categories: [
			{
				name: 'Venue',
				question: 'In which location do you most often play Beat Saber?',
				effects: true,
				values: [
					{
						name: 'At Home',
						count: 958,
						percentage: 98.76288659793815,
						effect: 0.428917129542331,
					},
					{
						name: 'At School',
						count: 9,
						percentage: 0.9278350515463918,
						effect: -51.28623391813252,
					},
					{
						name: 'Other',
						count: 3,
						percentage: 0.30927835051546393,
					},
				],
			},
			{
				name: 'Room Area',
				question: 'What are the dimensions of the play area in which you most often play Beat Saber?',
				effects: false,
				values: [
					{
						name: '< 2.0 m\u00b2',
						count: 82,
						percentage: 13.921901528013583,
					},
					{
						name: '2.0-3.9 m\u00b2',
						count: 187,
						percentage: 31.748726655348047,
					},
					{
						name: '4.0-5.9 m\u00b2',
						count: 161,
						percentage: 27.33446519524618,
					},
					{
						name: '6.0-7.9 m\u00b2',
						count: 99,
						percentage: 16.808149405772497,
					},
					{
						name: '\u2265 8.0 m\u00b2',
						count: 60,
						percentage: 10.186757215619695,
					},
				],
			},
			{
				name: 'Country',
				question: '',
				effects: false,
				values: [
					{
						name: 'United States',
						count: 376,
						percentage: 40.60475161987041,
					},
					{
						name: 'Canada',
						count: 55,
						percentage: 5.939524838012959,
					},
					{
						name: 'United Kingdom',
						count: 48,
						percentage: 5.183585313174946,
					},
					{
						name: 'Australia',
						count: 36,
						percentage: 3.8876889848812093,
					},
					{
						name: 'Germany',
						count: 34,
						percentage: 3.6717062634989204,
					},
					{
						name: 'France',
						count: 33,
						percentage: 3.5637149028077757,
					},
					{
						name: 'England',
						count: 30,
						percentage: 3.2397408207343417,
					},
					{
						name: 'Japan',
						count: 22,
						percentage: 2.375809935205184,
					},
					{
						name: 'Netherlands',
						count: 16,
						percentage: 1.7278617710583155,
					},
					{
						name: 'Finland',
						count: 15,
						percentage: 1.6198704103671708,
					},
					{
						name: 'Poland',
						count: 15,
						percentage: 1.6198704103671708,
					},
					{
						name: 'New Zealand',
						count: 12,
						percentage: 1.2958963282937366,
					},
					{
						name: 'Denmark',
						count: 11,
						percentage: 1.187904967602592,
					},
					{
						name: 'Austria',
						count: 10,
						percentage: 1.079913606911447,
					},
					{
						name: 'China',
						count: 9,
						percentage: 0.9719222462203023,
					},
					{
						name: 'Other',
						count: 204,
						percentage: 22.03023758099352,
					},
				],
			},
			{
				name: 'State Country',
				question: '',
				effects: false,
				values: [
					{
						name: 'California, US',
						count: 44,
						percentage: 5.35931790499391,
					},
					{
						name: 'Texas, US',
						count: 28,
						percentage: 3.41047503045067,
					},
					{
						name: 'Pennsylvania, US',
						count: 19,
						percentage: 2.3142509135200973,
					},
					{
						name: 'Michigan, US',
						count: 18,
						percentage: 2.192448233861145,
					},
					{
						name: 'Washington, US',
						count: 17,
						percentage: 2.0706455542021924,
					},
					{
						name: 'New York, US',
						count: 13,
						percentage: 1.5834348355663823,
					},
					{
						name: 'Ontario, CA',
						count: 13,
						percentage: 1.5834348355663823,
					},
					{
						name: 'British Columbia, CA',
						count: 11,
						percentage: 1.3398294762484775,
					},
					{
						name: 'Florida, US',
						count: 11,
						percentage: 1.3398294762484775,
					},
					{
						name: 'Indiana, US',
						count: 11,
						percentage: 1.3398294762484775,
					},
					{
						name: 'Illinois, US',
						count: 10,
						percentage: 1.2180267965895248,
					},
					{
						name: 'Victoria, AU',
						count: 10,
						percentage: 1.2180267965895248,
					},
					{
						name: 'Alberta, CA',
						count: 9,
						percentage: 1.0962241169305724,
					},
					{
						name: 'Massachusetts, US',
						count: 8,
						percentage: 0.9744214372716199,
					},
					{
						name: 'Oregon, US',
						count: 8,
						percentage: 0.9744214372716199,
					},
					{
						name: 'Virginia, US',
						count: 8,
						percentage: 0.9744214372716199,
					},
					{
						name: 'Colorado, US',
						count: 7,
						percentage: 0.8526187576126675,
					},
					{
						name: 'Idaho, US',
						count: 7,
						percentage: 0.8526187576126675,
					},
					{
						name: 'Minnesota, US',
						count: 7,
						percentage: 0.8526187576126675,
					},
					{
						name: 'Quebec, CA',
						count: 7,
						percentage: 0.8526187576126675,
					},
					{
						name: 'England, UK',
						count: 6,
						percentage: 0.730816077953715,
					},
					{
						name: 'Georgia, US',
						count: 6,
						percentage: 0.730816077953715,
					},
					{
						name: 'Kentucky, US',
						count: 6,
						percentage: 0.730816077953715,
					},
					{
						name: 'Missouri, US',
						count: 6,
						percentage: 0.730816077953715,
					},
					{
						name: 'North Carolina, US',
						count: 6,
						percentage: 0.730816077953715,
					},
					{
						name: 'Other',
						count: 525,
						percentage: 63.94640682095007,
					},
				],
			},
			{
				name: 'City',
				question: '',
				effects: false,
				values: [
					{
						name: 'London',
						count: 9,
						percentage: 1.1166253101736971,
					},
					{
						name: 'Chicago',
						count: 7,
						percentage: 0.8684863523573202,
					},
					{
						name: 'Vienna',
						count: 7,
						percentage: 0.8684863523573202,
					},
					{
						name: 'Berkeley',
						count: 6,
						percentage: 0.7444168734491315,
					},
					{
						name: 'Budapest',
						count: 6,
						percentage: 0.7444168734491315,
					},
					{
						name: 'Seattle',
						count: 6,
						percentage: 0.7444168734491315,
					},
					{
						name: 'Los Angeles',
						count: 5,
						percentage: 0.620347394540943,
					},
					{
						name: 'Melbourne',
						count: 5,
						percentage: 0.620347394540943,
					},
					{
						name: 'Toronto',
						count: 5,
						percentage: 0.620347394540943,
					},
					{
						name: 'Auckland',
						count: 4,
						percentage: 0.49627791563275436,
					},
					{
						name: 'Fort Worth',
						count: 4,
						percentage: 0.49627791563275436,
					},
					{
						name: 'Louisville',
						count: 4,
						percentage: 0.49627791563275436,
					},
					{
						name: 'Pittsburgh',
						count: 4,
						percentage: 0.49627791563275436,
					},
					{
						name: 'Adelaide',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Austin',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Birmingham',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Brisbane',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Calgary',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Christchurch',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Detroit',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Edmonton',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Hamilton',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Joensuu',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Leeds',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Lodz',
						count: 3,
						percentage: 0.37220843672456577,
					},
					{
						name: 'Other',
						count: 698,
						percentage: 86.60049627791562,
					},
				],
			},
		],
	},
	{
		name: 'Anthropometrics',
		categories: [
			{
				name: 'Height',
				question: 'What is your exact height in centimeters?',
				effects: false,
				values: [
					{
						name: '< 1.70 m',
						count: 191,
						percentage: 22.79236276849642,
					},
					{
						name: '1.70-1.79 m',
						count: 321,
						percentage: 38.3054892601432,
					},
					{
						name: '1.80-1.89 m',
						count: 288,
						percentage: 34.36754176610978,
					},
					{
						name: '\u2265 1.90 m',
						count: 38,
						percentage: 4.534606205250596,
					},
				],
			},
			{
				name: 'Wingspan',
				question: 'What is your exact wingspan in centimeters?',
				effects: true,
				values: [
					{
						name: '< 1.60 m',
						count: 133,
						percentage: 18.732394366197184,
						effect: -8.093815013511968,
					},
					{
						name: '1.60-1.69 m',
						count: 149,
						percentage: 20.985915492957748,
						effect: -5.407265526357633,
					},
					{
						name: '1.70-1.79 m',
						count: 205,
						percentage: 28.87323943661972,
						effect: 1.4162264495386563,
					},
					{
						name: '1.80-1.89 m',
						count: 167,
						percentage: 23.52112676056338,
						effect: 6.512900383251771,
					},
					{
						name: '\u2265 1.90 m',
						count: 56,
						percentage: 7.887323943661972,
						effect: 8.32008380652303,
					},
				],
			},
			{
				name: 'Left Arm',
				question: 'What is the exact length of your left arm in centimeters?',
				effects: false,
				values: [
					{
						name: '< 0.60 m',
						count: 62,
						percentage: 8.959537572254336,
					},
					{
						name: '0.60-0.69 m',
						count: 256,
						percentage: 36.99421965317919,
					},
					{
						name: '0.70-0.79 m',
						count: 306,
						percentage: 44.21965317919075,
					},
					{
						name: '\u2265 0.80 m',
						count: 68,
						percentage: 9.826589595375722,
					},
				],
			},
			{
				name: 'Right Arm',
				question: 'What is the exact length of your right arm in centimeters?',
				effects: false,
				values: [
					{
						name: '< 0.60 m',
						count: 57,
						percentage: 8.236994219653178,
					},
					{
						name: '0.60-0.69 m',
						count: 256,
						percentage: 36.99421965317919,
					},
					{
						name: '0.70-0.79 m',
						count: 305,
						percentage: 44.07514450867052,
					},
					{
						name: '\u2265 0.80 m',
						count: 74,
						percentage: 10.69364161849711,
					},
				],
			},
			{
				name: 'Handedness',
				question: 'Are you left or right handed?',
				effects: true,
				values: [
					{
						name: 'Right Handed',
						count: 737,
						percentage: 81.88888888888889,
						effect: -0.6709099908611059,
						color: 'blue',
					},
					{
						name: 'Left Handed',
						count: 103,
						percentage: 11.444444444444445,
						effect: -2.2206217445329726,
						color: 'red',
					},
					{
						name: 'Ambidextrous',
						count: 60,
						percentage: 6.666666666666667,
						effect: 12.573872476854344,
						color: 'purple',
					},
				],
			},
			{
				name: 'Weight',
				question: 'What is your approximate weight in kilograms?',
				effects: false,
				values: [
					{
						name: '< 40.0 kg',
						count: 5,
						percentage: 0.5995203836930456,
					},
					{
						name: '40.0-49.9 kg',
						count: 51,
						percentage: 6.115107913669065,
					},
					{
						name: '50.0-59.9 kg',
						count: 154,
						percentage: 18.465227817745802,
					},
					{
						name: '60.0-69.9 kg',
						count: 189,
						percentage: 22.66187050359712,
					},
					{
						name: '70.0-79.9 kg',
						count: 193,
						percentage: 23.14148681055156,
					},
					{
						name: '80.0-89.9 kg',
						count: 103,
						percentage: 12.350119904076738,
					},
					{
						name: '90.0-99.9 kg',
						count: 70,
						percentage: 8.393285371702639,
					},
					{
						name: '\u2265 100.0 kg',
						count: 69,
						percentage: 8.273381294964029,
					},
				],
			},
			{
				name: 'Hand Length',
				question: 'What is the exact length of your hand in centimeters?',
				effects: true,
				values: [
					{
						name: '< 16.0 cm',
						count: 41,
						percentage: 5.394736842105264,
						effect: -14.912617055004132,
					},
					{
						name: '16.0-16.9 cm',
						count: 57,
						percentage: 7.5,
					},
					{
						name: '17.0-17.9 cm',
						count: 132,
						percentage: 17.36842105263158,
					},
					{
						name: '18.0-18.9 cm',
						count: 151,
						percentage: 19.86842105263158,
					},
					{
						name: '19.0-19.9 cm',
						count: 185,
						percentage: 24.342105263157894,
					},
					{
						name: '20.0-20.9 cm',
						count: 99,
						percentage: 13.026315789473683,
					},
					{
						name: '21.0-21.9 cm',
						count: 32,
						percentage: 4.2105263157894735,
					},
					{
						name: '\u2265 22.0 cm',
						count: 63,
						percentage: 8.289473684210526,
					},
				],
			},
			{
				name: 'IPD',
				question: 'What is your exact interpupillary distance (IPD) in millimeters?',
				effects: true,
				values: [
					{
						name: '< 58.0 mm',
						count: 28,
						percentage: 3.7991858887381276,
						effect: -14.953249300237959,
					},
					{
						name: '58.0-62.9 mm',
						count: 153,
						percentage: 20.759837177747624,
						effect: 1.4260104860622902,
					},
					{
						name: '63.0-67.9 mm',
						count: 373,
						percentage: 50.61058344640435,
						effect: -0.10700624144381479,
					},
					{
						name: '68.0-71.9 mm',
						count: 143,
						percentage: 19.402985074626866,
						effect: -0.5490534916531618,
					},
					{
						name: '\u2265 72.0 mm',
						count: 40,
						percentage: 5.4274084124830395,
						effect: 9.25312402997297,
					},
				],
			},
			{
				name: 'Reaction Time',
				question: 'What is your average reaction time in milliseconds?',
				effects: false,
				values: [
					{
						name: '< 125 ms',
						count: 8,
						percentage: 0.9389671361502347,
					},
					{
						name: '125-174 ms',
						count: 59,
						percentage: 6.924882629107981,
					},
					{
						name: '175-199 ms',
						count: 166,
						percentage: 19.483568075117372,
					},
					{
						name: '200-224 ms',
						count: 233,
						percentage: 27.347417840375588,
					},
					{
						name: '225-274 ms',
						count: 230,
						percentage: 26.995305164319248,
					},
					{
						name: '275-324 ms',
						count: 103,
						percentage: 12.089201877934272,
					},
					{
						name: '\u2265 325 ms',
						count: 53,
						percentage: 6.220657276995305,
					},
				],
			},
			{
				name: 'Foot Size',
				question: 'What is the exact length of your foot in centimeters?',
				effects: false,
				values: [
					{
						name: '< 24.0 cm',
						count: 63,
						percentage: 7.768187422934648,
					},
					{
						name: '24.0-24.9 cm',
						count: 62,
						percentage: 7.644882860665844,
					},
					{
						name: '25.0-25.9 cm',
						count: 140,
						percentage: 17.26263871763255,
					},
					{
						name: '26.0-26.9 cm',
						count: 183,
						percentage: 22.564734895191123,
					},
					{
						name: '27.0-27.9 cm',
						count: 178,
						percentage: 21.948212083847103,
					},
					{
						name: '28.0-28.9 cm',
						count: 98,
						percentage: 12.083847102342787,
					},
					{
						name: '29.0-29.9 cm',
						count: 39,
						percentage: 4.808877928483354,
					},
					{
						name: '\u2265 30.0 cm',
						count: 48,
						percentage: 5.9186189889025895,
					},
				],
			},
		],
	},
	{
		name: 'Clothing',
		categories: [
			{
				name: 'Footwear',
				question: 'What footwear, if any, do you typically wear when playing Beat Saber?',
				effects: true,
				values: [
					{
						name: 'Typically\nBarefoot',
						count: 350,
						percentage: 39.637599093997736,
						effect: 2.4585314489645174,
					},
					{
						name: 'Typically\nWear Socks',
						count: 347,
						percentage: 39.29784824462061,
						effect: -1.1342118277333986,
						image: '/assets/body/footwear_sock.png',
					},
					{
						name: 'Inconsistent/Varies',
						count: 105,
						percentage: 11.89127972819932,
						effect: 2.1361875413768745,
						image: '/assets/body/footwear_other.png',
					},
					{
						name: 'Typically\nWear Shoes',
						count: 81,
						percentage: 9.173272933182334,
						effect: -8.174891226440993,
						image: '/assets/body/footwear_shoe.png',
					},
				],
			},
			{
				name: 'Lower Body',
				question: 'What clothing, if any, do you typically wear on your lower body when playing Beat Saber?',
				effects: true,
				values: [
					{
						name: 'Knee-Height\nGarment',
						count: 350,
						percentage: 39.77272727272727,
						effect: 0.6745416005132461,
						image: '/assets/body/kneegarment.png',
					},
					{
						name: 'Ankle-Height\nGarment',
						count: 248,
						percentage: 28.18181818181818,
						effect: -0.8873063382113376,
						image: '/assets/body/anklegarment.png',
					},
					{
						name: 'Inconsistent/Varies',
						count: 194,
						percentage: 22.045454545454547,
						effect: -6.886082102895465,
						image: '/assets/body/underother.png',
					},
					{
						name: 'Undergarment Only',
						count: 88,
						percentage: 10.0,
						effect: 15.187545506325995,
						image: '/assets/body/undergarment.png',
					},
				],
			},
			{
				name: 'Upper Body',
				question: 'What clothing, if any, do you typically wear on your upper body when playing Beat Saber?',
				effects: true,
				values: [
					{
						name: 'Short Sleeve\nGarment',
						count: 526,
						percentage: 68.84816753926701,
						effect: 3.4648935666468264,
						image: '/assets/body/tshirt.png',
					},
					{
						name: 'Inconsistent/Varies',
						count: 133,
						percentage: 17.408376963350786,
						effect: -3.6787413987423023,
						image: '/assets/body/upperother.png',
					},
					{
						name: 'Sleeveless\nGarment',
						count: 52,
						percentage: 6.806282722513089,
						effect: -11.927492345345438,
						image: '/assets/body/sleveless.png',
					},
					{
						name: 'Undergarment Only',
						count: 23,
						percentage: 3.0104712041884816,
						effect: -0.807501103505369,
					},
					{
						name: 'Long Sleeve\nGarment',
						count: 20,
						percentage: 2.6178010471204187,
						effect: -20.26668909871146,
						image: '/assets/body/longsleve.png',
					},
					{
						name: 'Multiple Layers',
						count: 10,
						percentage: 1.3089005235602094,
						effect: -34.64888935207951,
						image: '/assets/body/multilayer.png',
					},
				],
			},
		],
	},
];
