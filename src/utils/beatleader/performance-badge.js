import {formatNumber} from '../format';
import {computeModifiedRating, getFCPPTitle, getPPFromAcc} from './pp';
import Badge from '../../components/Common/Badge.svelte';
import Value from '../../components/Common/Value.svelte';
import Pp from '../../components/Common/PerformanceBadge/Pp.svelte';
import Accuracy from '../../components/Common/PerformanceBadge/Accuracy.svelte';
import {configStore} from '../../stores/config';
import Mistakes from '../../components/Common/PerformanceBadge/Mistakes.svelte';
import Label from '../../components/Common/PerformanceBadge/Label.svelte';
import {describeModifiersAndMultipliers} from './format';

export const getPerformanceBadge = (def, score, improvements, beatSavior, modifiers = {}, isDemo = false) => {
	let component = Badge;
	let componentProps = {onlyLabel: true, color: 'white'};
	let title = isDemo ? 'Click to setup' : null;
	let slotComponent = Value;
	let slotComponentProps = {};
	let className = '';
	let icon = null;

	const metric = def?.metric ?? null;

	switch (metric) {
		case 'pp':
			title = isDemo
				? 'Click to setup'
				: score?.ppWeighted || isNaN(score?.ppWeighted)
				? ''
				: getNominatedPPHoverTitle(score, beatSavior, modifiers);
			className = 'pp';

			if (score?.pp) {
				componentProps = {
					onlyLabel: true,
					color: 'white',
					styling: score?.ppWeighted ? '' : 'nominated-pp',
					bgColor: score?.ppWeighted ? 'var(--ppColour)' : 'transparent',
					title,
				};

				slotComponent = Pp;
				slotComponentProps = {
					pp: score?.pp,
					bonusPp: score?.bonusPp,
					accPp: score?.accPP,
					techPp: score?.techPP,
					passPp: score?.passPP,
					weighted: score?.ppWeighted,
					fcPp: score?.fcPp,
					improvements,
					whatIf: score?.whatIfPp,
					zero: formatNumber(0),
					withZeroSuffix: true,
					inline: false,
					color: 'white',
				};
			} else {
				component = null;
			}
			break;

		case 'acc':
			title = isDemo ? 'Click to setup' : null;
			className = 'acc';

			component = Accuracy;
			componentProps = {
				score,
				modifiers,
				showMods: !!def?.withMods,
				showImprovements: !!def?.withImprovements,
			};
			break;

		case 'score':
			title = isDemo ? 'Click to setup' : null;
			className = 'score';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			const modifiedScore = score?.score ?? 0;
			slotComponentProps = {
				value: modifiedScore,
				prevValue: def?.withImprovements ? modifiedScore - (improvements?.score ?? 0) : null,
				inline: false,
				digits: 0,
			};
			break;

		case 'accLeft':
			title = isDemo
				? 'Click to setup'
				: beatSavior?.stats?.leftAverageCut
				? `Left accuracy: ${beatSavior?.stats?.leftAverageCut ? beatSavior?.stats?.leftAverageCut.map(v => formatNumber(v)).join('/') : ''}`
				: null;
			className = 'beatSavior';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'rgba(168,32,32,1)',
				inline: true,
				title,
			};

			const accLeft = beatSavior?.stats?.accLeft ?? 0;
			const prevAccLeft = def?.withImprovements ? accLeft - (improvements?.accLeft ?? 0) : null;

			slotComponentProps = {
				value: accLeft,
				prevValue: prevAccLeft,
				inline: true,
				digits: 2,
			};
			break;

		case 'accRight':
			title = isDemo
				? 'Click to setup'
				: beatSavior?.stats?.rightAverageCut
				? `Right accuracy: ${
						beatSavior?.stats?.rightAverageCut ? beatSavior?.stats?.rightAverageCut.map(v => formatNumber(v)).join('/') : ''
				  }`
				: null;
			className = 'beatSavior';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'rgba(32,100,168,1)',
				inline: true,
				title,
			};

			const accRight = beatSavior?.stats?.accRight ?? 0;
			const prevAccRight = def?.withImprovements ? accRight - (improvements?.accRight ?? 0) : null;

			slotComponentProps = {
				value: accRight,
				prevValue: prevAccRight,
				inline: true,
				digits: 2,
			};
			break;

		case 'mistakes':
			title = isDemo ? 'Click to setup' : null;
			className = 'beatSavior';

			if (Number.isFinite(beatSavior?.stats?.miss)) {
				component = Mistakes;
				componentProps = {
					beatSavior,
					improvements: def?.withImprovements ? improvements : null,
				};
			} else {
				component = null;
			}
			break;

		case 'pauses':
			title = isDemo ? 'Click to setup' : `${score?.[metric] ?? 0} pause(s)`;
			className = 'beatSavior';
			icon = 'fa-solid fa-pause';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponentProps = {
				value: score?.[metric],
				prevValue: def?.withImprovements ? improvements?.[score?.[metric]] : null,
				inline: true,
				digits: 0,
			};
			break;

		case 'maxStreak':
			title = isDemo ? 'Click to setup' : `${score?.[metric] ?? 0} "115s" in a row`;
			className = 'beatSavior';
			icon = 'fa-solid fa-crosshairs';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponentProps = {
				value: score?.[metric],
				inline: true,
				digits: 0,
			};
			break;

		case 'maxCombo':
			title = isDemo ? 'Click to setup' : `Max combo: ${score?.[metric] ?? 0}`;
			className = 'beatSavior';
			icon = 'fa-solid fa-cube';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponentProps = {
				value: score?.[metric],
				inline: true,
				digits: 0,
			};
			break;

		case 'fcAccuracy':
			if (score?.[metric]) {
				title = isDemo ? 'Click to setup' : `FC accuracy: ${formatNumber((score?.[metric] ?? 0) * 100)}%`;
				className = 'beatSavior';

				componentProps = {
					onlyLabel: true,
					color: 'white',
					bgColor: 'var(--dimmed)',
					title,
				};

				slotComponentProps = {
					value: (score?.[metric] ?? 0) * 100,
					prevValue: def?.withImprovements && improvements?.[score?.[metric]] ? (improvements?.[score?.[metric]] ?? 0) * 100 : null,
					inline: true,
					digits: 2,
					prefix: 'FC: ',
					suffix: `%`,
				};
			} else {
				component = null;
			}
			break;

		case 'accPP':
		case 'passPP':
		case 'techPP':
			if (score?.[metric]) {
				title = isDemo ? 'Click to setup' : `${formatNumber(score?.[metric] ?? 0)} ${metric}`;
				className = 'beatSavior';

				switch (metric) {
					case 'accPP':
						icon = 'fa-solid fa-crosshairs';
						break;
					case 'passPP':
						icon = 'fa-solid fa-unlock';
						break;
					case 'techPP':
						icon = 'fa-solid fa-wrench';
						break;
				}

				componentProps = {
					onlyLabel: true,
					color: 'white',
					bgColor: 'var(--dimmed)',
					title,
				};

				slotComponentProps = {
					value: score?.[metric],
					prevValue: def?.withImprovements ? improvements?.[score?.[metric]] : null,
					inline: true,
					digits: 2,
					suffix: `pp`,
				};
			} else {
				component = null;
			}
			break;

		case 'replaysWatched':
			title = isDemo ? 'Click to setup' : `Replays watched: ${score?.[metric] ?? 0}`;
			className = 'beatSavior';
			icon = 'fas fa-eye';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponentProps = {
				value: score?.[metric],
				inline: true,
				digits: 0,
			};
			break;

		case 'mods':
			title = isDemo ? 'Click to setup' : Array.isArray(score?.mods) ? describeModifiersAndMultipliers(score.mods, modifiers) : null;
			className = 'beatSavior';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponent = Label;
			slotComponentProps = {
				label: Array.isArray(score?.mods) ? score.mods.join(' ') : 'No mods',
			};
			break;

		case 'ap':
			title = isDemo ? 'Click to setup' : null;
			className = 'pp';

			if (score?.ap) {
				componentProps = {
					onlyLabel: true,
					color: 'white',
					bgColor: 'var(--ppColour)',
				};

				slotComponent = Pp;
				slotComponentProps = {
					playerId: score?.playerId,
					pp: score?.ap,
					weighted: score?.weightedAp,
					zero: formatNumber(0),
					withZeroSuffix: true,
					inline: false,
					suffix: 'AP',
					color: 'white',
				};
			} else {
				component = null;
			}
			break;

		case '__not-set':
			title = isDemo ? 'Click to setup' : null;
			className = 'beatSavior';

			componentProps = {
				onlyLabel: true,
				color: 'white',
				bgColor: 'var(--dimmed)',
				title,
			};

			slotComponent = Label;
			slotComponentProps = {
				label: 'Click me',
			};
			break;

		default:
			component = null;
			break;
	}

	return {
		component,
		componentProps,
		slotComponent,
		slotComponentProps,
		title,
		className,
		icon,
	};
};

function getNominatedPPHoverTitle(score, beatSavior, modifiers) {
	let title = 'Approximate PP if the map will be ranked';

	if (!Number.isFinite(beatSavior?.stats?.miss)) {
		return title;
	}

	let fcPp = score?.fcPp;
	if (!fcPp || fcPp <= 0) {
		// we need to compute it using fcAccuracy.
		const fcAccuracy = score?.fcAccuracy;

		// if the score is ranked, we should show how much pp this score would
		// have been worth if the player had not made any mistakes

		if (!fcAccuracy || !fcAccuracy <= 0) {
			// Not enough data to compute
			return title;
		}

		let modArr = [];
		if (score?.mods) {
			for (const mod of score?.mods) {
				const lookupKey = mod.toLowerCase();
				modArr.push({
					name: mod,
					value: modifiers[lookupKey],
				});
			}
		}

		const diff = score?.leaderboard?.difficulty;
		const modifiersRating = score?.leaderboard?.difficulty?.modifiersRating;

		const modifiedPassRating = computeModifiedRating(diff?.passRating, 'PassRating', modifiersRating, modArr);
		const modifiedAccRating = computeModifiedRating(diff?.accRating, 'AccRating', modifiersRating, modArr);
		const modifiedTechRating = computeModifiedRating(diff?.techRating, 'TechRating', modifiersRating, modArr);
		const pp = getPPFromAcc(fcAccuracy, modifiedPassRating, modifiedAccRating, modifiedTechRating);
		const roundedPP = Math.round(pp * 100) / 100;
		const fcPpTitle = getFCPPTitle(roundedPP, 'pp');
		title += `\n${fcPpTitle}`;
	}

	return title;
}
