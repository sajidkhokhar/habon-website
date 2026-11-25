import today from '../assets/shots/today.webp';
import streaks from '../assets/shots/streaks.webp';
import routines from '../assets/shots/routines.webp';
import goals from '../assets/shots/goals.webp';
import quit from '../assets/shots/quit.webp';
import insights from '../assets/shots/insights.webp';
import achievements from '../assets/shots/achievements.webp';
import calm from '../assets/shots/calm.webp';
import profile from '../assets/shots/profile.webp';
import watch from '../assets/shots/watch.webp';
import icon from '../assets/icon.webp';

/** Official App Store screenshots of Habon, with descriptive alt text. */
export const shots = {
  today: { src: today, alt: 'Habon Today screen on iPhone showing a 12 day streak, a progress ring and the daily habit list' },
  streaks: { src: streaks, alt: 'Habon streaks screen with a seven day chart, current streak, best streak and a month calendar' },
  routines: { src: routines, alt: 'Habon new routine screen for building a morning routine from existing habits' },
  goals: { src: goals, alt: 'Habon goal setup screen for yes or no, count and duration habit goals' },
  quit: { src: quit, alt: 'Habon screen for quitting a habit with a limit goal and ready-made templates' },
  insights: { src: insights, alt: 'Habon insights screen with monthly completion rate, perfect days and daily completion bars' },
  achievements: { src: achievements, alt: 'Habon achievements screen with badges for streaks, perfect days and routines' },
  calm: { src: calm, alt: 'Habon calm full-screen scene with relaxing sounds for meditation habits' },
  profile: { src: profile, alt: 'Habon profile screen with illustrated characters and theme choices' },
  watch: { src: watch, alt: 'Habon on Apple Watch with a watch-face complication showing habit progress' },
} as const;
export const appIcon = { src: icon, alt: 'Habon app icon: a white rounded letter h with an amber sun' };
