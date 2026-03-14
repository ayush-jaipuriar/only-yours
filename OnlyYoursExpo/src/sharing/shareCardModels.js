const topChipTitles = (items = [], limit = 3) =>
  items
    .map((item) => item?.title)
    .filter(Boolean)
    .slice(0, limit);

const inferMilestoneKind = (milestone) => {
  const code = milestone?.code || '';
  const title = (milestone?.title || '').toLowerCase();
  const description = (milestone?.description || '').toLowerCase();

  if (milestone?.type === 'LEVEL_UP') {
    return 'Level Up';
  }
  if (code.includes('STREAK') || title.includes('streak') || description.includes('streak')) {
    return 'Streak';
  }
  if (title.includes('achievement') || milestone?.type === 'ACHIEVEMENT_UNLOCK') {
    return 'Achievement';
  }
  return 'Celebration';
};

export const buildResultShareCard = (scores) => {
  if (!scores) {
    return null;
  }

  const combinedScore = (scores.player1Score || 0) + (scores.player2Score || 0);
  const totalCombined = (scores.totalQuestions || 0) * 2;

  return {
    type: 'RESULT',
    shareLabel: 'Share result card',
    fileName: 'only-yours-result-card',
    eyebrow: 'Only Yours Result',
    title: `${scores.player1Name} + ${scores.player2Name}`,
    subtitle: scores.message,
    spotlightLabel: 'Combined Score',
    spotlightValue: `${combinedScore}/${totalCombined}`,
    body: `Final score ${scores.player1Score}-${scores.player2Score}`,
    stats: [
      { label: scores.player1Name, value: `${scores.player1Score}/${scores.totalQuestions}` },
      { label: scores.player2Name, value: `${scores.player2Score}/${scores.totalQuestions}` },
      {
        label: 'Couple Level',
        value: scores.coupleProgression?.level ? `Lv ${scores.coupleProgression.level}` : 'Growing',
      },
    ],
    chips: topChipTitles(scores.recentMilestones, 2),
    footer: 'Names and final scores are shared. Answers stay private.',
  };
};

export const buildMilestoneShareCard = (milestone) => {
  if (!milestone) {
    return null;
  }

  const milestoneKind = inferMilestoneKind(milestone);
  const spotlightValue = milestone.newLevel
    ? `Lv ${milestone.newLevel}`
    : milestone.xpDelta
      ? `+${milestone.xpDelta} XP`
      : milestoneKind;

  return {
    type: 'MILESTONE',
    shareLabel: 'Share celebration card',
    fileName: 'only-yours-celebration-card',
    eyebrow: 'Only Yours Celebration',
    title: milestone.title,
    subtitle: milestone.description,
    spotlightLabel: milestone.scope === 'COUPLE' ? 'Shared Moment' : 'Personal Moment',
    spotlightValue,
    body: milestone.ownerLabel || (milestone.scope === 'COUPLE' ? 'Couple milestone' : 'Personal milestone'),
    stats: [
      { label: 'Type', value: milestoneKind },
      { label: 'Scope', value: milestone.scope === 'COUPLE' ? 'Couple' : 'Personal' },
    ],
    chips: [milestoneKind].filter(Boolean),
    footer: 'Celebration card only. Gameplay details stay private.',
  };
};

export const buildProgressionShareCard = (snapshot) => {
  if (!snapshot) {
    return null;
  }

  return {
    type: 'PROGRESSION',
    shareLabel: 'Share progression card',
    fileName: 'only-yours-progression-card',
    eyebrow: snapshot.scope === 'COUPLE' ? 'Only Yours Couple Progress' : 'Only Yours Progress',
    title: snapshot.label,
    subtitle: snapshot.scope === 'COUPLE' ? 'Growing together' : 'Personal growth snapshot',
    spotlightLabel: 'Level',
    spotlightValue: `Lv ${snapshot.level}`,
    body: `${snapshot.xp} XP earned so far`,
    stats: [
      { label: 'To Next', value: `${snapshot.xpToNextLevel} XP` },
      { label: 'Current Streak', value: `${snapshot.currentStreakDays} days` },
      { label: 'Achievements', value: `${snapshot.achievementsUnlocked}` },
    ],
    chips: [snapshot.scope === 'COUPLE' ? 'Couple Track' : 'Personal Track'],
    footer: 'Shareable snapshot only. No private answers or question text included.',
  };
};

export const buildAchievementsShareCard = ({ ownerLabel, achievements }) => {
  const achievementList = achievements || [];
  if (!achievementList.length) {
    return null;
  }

  return {
    type: 'ACHIEVEMENTS',
    shareLabel: 'Share achievements card',
    fileName: 'only-yours-achievements-card',
    eyebrow: 'Only Yours Achievements',
    title: ownerLabel || 'Achievement Snapshot',
    subtitle: `Unlocked ${achievementList.length} achievement${achievementList.length === 1 ? '' : 's'}`,
    spotlightLabel: 'Unlocked',
    spotlightValue: `${achievementList.length}`,
    body: 'A quick look at recent progress milestones.',
    stats: [
      { label: 'Latest', value: achievementList[0]?.title || 'Achievement' },
      { label: 'Collection', value: `${achievementList.length} total` },
    ],
    chips: topChipTitles(achievementList, 3),
    footer: 'Collection snapshot only. No hidden gameplay details are shared.',
  };
};
