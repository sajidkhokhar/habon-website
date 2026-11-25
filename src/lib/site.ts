export const SITE = {
  name: 'Habon',
  fullName: 'Habit Tracker & Goals - Habon',
  url: (import.meta.env.SITE as string) || 'https://habon-app.pages.dev',
  tagline: 'A calm habit tracker and daily routine planner for iPhone',
  appId: '6828774437',
  appStoreUrl: 'https://apps.apple.com/us/app/habit-tracker-goals-habon/id6828774437',
  developerName: 'Sajid A Khokhar',
  developerUrl: 'https://apps.apple.com/us/developer/sajid-a-khokhar/id6780629199',
  appPrivacyUrl: 'https://sajidkhokhar.github.io/sajidkhokharapps/habittracker/privacy-policy.html',
  minIos: '18.0',
  released: '2026-11-24',
  repoUrl: 'https://github.com/sajidkhokhar/habon-website',
  cfToken: (import.meta.env.PUBLIC_CF_BEACON_TOKEN as string) || '',
  gaId: (import.meta.env.PUBLIC_GA_ID as string) || '',
};

export type NavItem = { label: string; href: string };

export const NAV: NavItem[] = [
  { label: 'Features', href: '/features/' },
  { label: 'Free tools', href: '/tools/' },
  { label: 'Printables', href: '/printable-habit-tracker/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'FAQ', href: '/faq/' },
];

export type Tool = {
  slug: string; // url path without slashes
  name: string;
  short: string;
  blurb: string;
  group: 'Track' | 'Plan' | 'Print' | 'Calculate' | 'Ideas';
};

/** Every free tool, used for the tools index, footer and cross-linking. */
export const TOOLS: Tool[] = [
  { slug: 'online-habit-tracker', name: 'Online habit tracker', short: 'Habit tracker', group: 'Track', blurb: 'Daily, weekly and monthly habits with a calendar, streaks, stats and charts.' },
  { slug: 'habit-streak-calculator', name: 'Habit streak calculator', short: 'Streak calculator', group: 'Calculate', blurb: 'Paste or tick your dates to get current streak, longest streak and missed days.' },
  { slug: '30-day-habit-challenge', name: '30-day habit challenge', short: '30-day challenge', group: 'Track', blurb: 'Pick a ready-made challenge or write your own, then check off 30 days.' },
  { slug: 'daily-routine-planner', name: 'Daily routine planner', short: 'Routine planner', group: 'Plan', blurb: 'Build morning, afternoon and evening routines with times, then drag to reorder.' },
  { slug: 'printable-habit-tracker', name: 'Printable habit tracker generator', short: 'Printable generator', group: 'Print', blurb: 'Weekly and monthly PDF trackers in A4 or US Letter with your habits and colors.' },
  { slug: 'weekly-habit-planner', name: 'Weekly habit planner', short: 'Weekly planner', group: 'Plan', blurb: 'A seven-day grid for the habits you want to hit this week.' },
  { slug: 'monthly-habit-calendar', name: 'Monthly habit calendar', short: 'Monthly calendar', group: 'Track', blurb: 'See a whole month of habits at once and spot the gaps.' },
  { slug: 'goal-planner', name: 'Goal planner', short: 'Goal planner', group: 'Plan', blurb: 'Turn a goal into milestones and weekly actions, and watch progress build.' },
  { slug: 'habit-ideas-generator', name: 'Habit ideas generator', short: 'Habit ideas', group: 'Ideas', blurb: 'Shuffle through small, specific habit ideas by category and send them to your tracker.' },
  { slug: 'morning-routine-generator', name: 'Morning routine generator', short: 'Morning routine', group: 'Ideas', blurb: 'Tell it your wake time and focus, get a timed morning routine.' },
  { slug: 'evening-routine-generator', name: 'Evening routine generator', short: 'Evening routine', group: 'Ideas', blurb: 'Wind down with a timed evening routine built around your bedtime.' },
  { slug: 'habit-consistency-calculator', name: 'Habit consistency calculator', short: 'Consistency calculator', group: 'Calculate', blurb: 'Turn days done and days planned into a consistency score and a next target.' },
];

export const toolHref = (slug: string) => `/${slug}/`;
