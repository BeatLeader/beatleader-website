import process from './process';

export default response => {
	if (!response) return null;

	const {profile, ...hydrated} = response;

	return process({
		...hydrated,
		id: profile?.id ?? null,
		name: profile?.name ?? null,
		alias: profile?.alias ?? null,
		avatar: hydrated.avatar?.length ? hydrated.avatar : (profile?.avatar ?? null),
		country: profile?.country ?? null,
		role: profile?.role ?? '',
		level: profile?.level ?? 0,
		prestige: profile?.prestige ?? 0,
		experience: profile?.experience ?? 0,
	});
};
