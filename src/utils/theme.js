import {GLOBAL_LEADERBOARD_TYPE} from './format';

const FIXED_THEMES = ['default', 'ree-dark', 'halloween'];
const THEMED_CONTEXTS = ['dnc'];

export const isCustomizableTheme = theme => !FIXED_THEMES.includes(theme);

export const themedContext = () => (THEMED_CONTEXTS.includes(GLOBAL_LEADERBOARD_TYPE) ? GLOBAL_LEADERBOARD_TYPE : null);

export const currentTheme = preferences => {
	const context = themedContext();

	return (context && preferences?.contextThemes?.[context]) || preferences?.theme;
};

export const withTheme = (preferences, theme) => {
	const context = themedContext();

	return context ? {...preferences, contextThemes: {...preferences?.contextThemes, [context]: theme}} : {...preferences, theme};
};
