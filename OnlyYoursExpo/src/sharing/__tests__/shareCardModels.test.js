import {
  buildAchievementsShareCard,
  buildMilestoneShareCard,
  buildProgressionShareCard,
  buildResultShareCard,
} from '../shareCardModels';

describe('shareCardModels', () => {
  it('builds a result share card with approved names and scores', () => {
    const model = buildResultShareCard({
      player1Name: 'Alice',
      player1Score: 6,
      player2Name: 'Bob',
      player2Score: 5,
      totalQuestions: 8,
      message: 'Great connection!',
      coupleProgression: { level: 4 },
      recentMilestones: [{ title: 'Couple Level Up' }],
    });

    expect(model.title).toBe('Alice + Bob');
    expect(model.spotlightValue).toBe('11/16');
    expect(model.stats[0].value).toBe('6/8');
    expect(model.footer).toContain('Answers stay private');
  });

  it('builds milestone share cards for level-up moments', () => {
    const model = buildMilestoneShareCard({
      type: 'LEVEL_UP',
      scope: 'COUPLE',
      ownerLabel: 'Alice + Bob',
      title: 'Couple Level Up',
      description: 'Your couple reached level 4.',
      newLevel: 4,
    });

    expect(model.spotlightValue).toBe('Lv 4');
    expect(model.stats[0].value).toBe('Level Up');
    expect(model.footer).toContain('Gameplay details stay private');
  });

  it('builds a progression share card from progression snapshots', () => {
    const model = buildProgressionShareCard({
      scope: 'COUPLE',
      label: 'Alice + Bob',
      level: 5,
      xp: 680,
      xpToNextLevel: 120,
      currentStreakDays: 3,
      achievementsUnlocked: 6,
    });

    expect(model.title).toBe('Alice + Bob');
    expect(model.spotlightValue).toBe('Lv 5');
    expect(model.stats[1].value).toBe('3 days');
  });

  it('builds an achievement collection snapshot card', () => {
    const model = buildAchievementsShareCard({
      ownerLabel: 'Phase User',
      achievements: [
        { title: 'First Spark' },
        { title: 'Warm Momentum' },
      ],
    });

    expect(model.title).toBe('Phase User');
    expect(model.spotlightValue).toBe('2');
    expect(model.chips).toEqual(['First Spark', 'Warm Momentum']);
  });
});
