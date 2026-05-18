// Mock database module
jest.mock('../config/database', () => ({
  default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/player', () => ({
  default: { init: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  Position: { CATCHER: 'CATCHER', FIRST: 'FIRST', SECOND: 'SECOND', THIRD: 'THIRD', SHORTSTOP: 'SHORTSTOP', OUTFIELD: 'OUTFIELD', PITCHER: 'PITCHER', UTILITY: 'UTILITY' },
  Status: { ACTIVE: 'ACTIVE', IL_10: 'IL_10', IL_15: 'IL_15', IL_60: 'IL_60', MINORS: 'MINORS', OUT: 'OUT' }
}));

jest.mock('../models/draftPick', () => ({
    RosterPosition: {
        CATCHER: 'CATCHER',
        FIRST: 'FIRST',
        SECOND: 'SECOND',
        THIRD: 'THIRD',
        SHORTSTOP: 'SHORTSTOP',
        CORNER: 'CORNER',
        MIDDLE: 'MIDDLE',
        OUTFIELD: 'OUTFIELD',
        UTILITY: 'UTILITY',
        PITCHER: 'PITCHER'
    }
}));

jest.mock('../models/playerSettings', () => ({
    default: { init: jest.fn(), hasOne: jest.fn(), belongsTo: jest.fn() },
    Division: {
        MIXED: 'MIXED',
        AL: 'AL',
        NL: 'NL'
    }
}));

import { 
    getNormalizeStats, getHittingScore, getScarcity, 
    getReplacementPlayerScore, computePlayerCost, getDepthChartMultiplier,
    getActiveStatSets, computePlayerScores, getLeagueStats, getEligibleRosterPositions
} from '../services/rankingService';
import { RosterPosition } from '../models/draftPick';
import { Position, Status } from '../models/player';
import ScoringSettings from '../models/scoringSettings';
import Player from '../models/player';

///////////////////////
// SHARED FIXTURES
///////////////////////
const mockScoringSettings = (): ScoringSettings => ({
    hrWeight: 0.175, rbiWeight: 0.155, sbWeight: 0.125,
    avgWeight: 0.150, runsWeight: 0.125, eraWeight: 0.200,
    whipWeight: 0.200, winsWeight: 0.100, strikeoutsWeight: 0.150,
    savesWeight: 0.100, useLastYear: true, useThreeYearAvg: true, useProjected: true
} as unknown as ScoringSettings);

const mockLeagueNeeds = () => ({
    [RosterPosition.CATCHER]: 2, [RosterPosition.FIRST]: 1,
    [RosterPosition.SECOND]: 1, [RosterPosition.THIRD]: 1,
    [RosterPosition.SHORTSTOP]: 1, [RosterPosition.CORNER]: 1,
    [RosterPosition.MIDDLE]: 1, [RosterPosition.OUTFIELD]: 5,
    [RosterPosition.UTILITY]: 1, [RosterPosition.PITCHER]: 9
});

const mockHitterStats = {
    lastYearStats:  { HR: 30, RBI: 90, SB: 15, AVG: 0.360, R: 85 },
    threeYearAvg:   { HR: 25, RBI: 80, SB: 12, AVG: 0.340, R: 78 },
    projectedStats: { HR: 28, RBI: 85, SB: 14, AVG: 0.350, R: 80 },
};

// Fixed: added sd to every stat
const mockHitterSummary = {
    lastYearStats: {
        HR:  { min: 0, max: 60, avg: 20, sd: 10 },
        RBI: { min: 0, max: 130, avg: 65, sd: 25 },
        SB:  { min: 0, max: 60, avg: 15, sd: 10 },
        AVG: { min: 0.200, max: 0.450, avg: 0.320, sd: 0.05 },
        R:   { min: 0, max: 130, avg: 65, sd: 25 },
    },
    threeYearAvg: {
        HR:  { min: 0, max: 60, avg: 20, sd: 10 },
        RBI: { min: 0, max: 130, avg: 65, sd: 25 },
        SB:  { min: 0, max: 60, avg: 15, sd: 10 },
        AVG: { min: 0.200, max: 0.450, avg: 0.320, sd: 0.05 },
        R:   { min: 0, max: 130, avg: 65, sd: 25 },
    },
    projectedStats: {
        HR:  { min: 0, max: 60, avg: 20, sd: 10 },
        RBI: { min: 0, max: 130, avg: 65, sd: 25 },
        SB:  { min: 0, max: 60, avg: 15, sd: 10 },
        AVG: { min: 0.200, max: 0.450, avg: 0.320, sd: 0.05 },
        R:   { min: 0, max: 130, avg: 65, sd: 25 },
    },
};

const mockHitter = (overrides = {}): Player => ({
    id: 1, mlbPlayerId: 101,
    firstName: 'John', lastName: 'Doe',
    age: 28, isHitter: true,
    playablePositions: [Position.CATCHER],
    status: Status.ACTIVE,
    seasonsLeft: 3, realTeam: 'NYY', realLeague: 'AL',
    ...mockHitterStats,
    ...overrides
} as unknown as Player);

///////////////////////
// TESTS
///////////////////////
describe('rankingService', () => {

    // --- getNormalizeStats ---
    describe('getNormalizeStats', () => {
        it('correctly z-scores a known value', () => {
            // HR: (30 - 20) / 10 = 1.0
            const result = getNormalizeStats(mockHitterStats, mockHitterSummary, mockScoringSettings());
            expect(result['lastYearStats'].HR).toBeCloseTo(1.0);
        });

        it('returns 0 when sd is 0 (no crash)', () => {
            const flatSummary = {
                lastYearStats:  { HR: { min: 20, max: 20, avg: 20, sd: 0 }, RBI: { min: 65, max: 65, avg: 65, sd: 0 }, SB: { min: 15, max: 15, avg: 15, sd: 0 }, AVG: { min: 0.320, max: 0.320, avg: 0.320, sd: 0 }, R: { min: 65, max: 65, avg: 65, sd: 0 } },
                threeYearAvg:   { HR: { min: 20, max: 20, avg: 20, sd: 0 }, RBI: { min: 65, max: 65, avg: 65, sd: 0 }, SB: { min: 15, max: 15, avg: 15, sd: 0 }, AVG: { min: 0.320, max: 0.320, avg: 0.320, sd: 0 }, R: { min: 65, max: 65, avg: 65, sd: 0 } },
                projectedStats: { HR: { min: 20, max: 20, avg: 20, sd: 0 }, RBI: { min: 65, max: 65, avg: 65, sd: 0 }, SB: { min: 15, max: 15, avg: 15, sd: 0 }, AVG: { min: 0.320, max: 0.320, avg: 0.320, sd: 0 }, R: { min: 65, max: 65, avg: 65, sd: 0 } },
            };
            const result = getNormalizeStats(mockHitterStats, flatSummary, mockScoringSettings());
            expect(result['lastYearStats'].HR).toBe(0);
        });

        it('only normalizes active stat sets', () => {
            const settings = { ...mockScoringSettings(), useLastYear: false, useThreeYearAvg: false };
            const result = getNormalizeStats(mockHitterStats, mockHitterSummary, settings as ScoringSettings);
            expect(result['lastYearStats']).toBeUndefined();
            expect(result['projectedStats']).toBeDefined();
        });
    });

    // --- getHittingScore ---
    describe('getHittingScore', () => {
        it('better player scores higher than worse player', () => {
            const worseStats = {
                lastYearStats:  { HR: 5, RBI: 20, SB: 2, AVG: 0.220, R: 25 },
                threeYearAvg:   { HR: 5, RBI: 20, SB: 2, AVG: 0.220, R: 25 },
                projectedStats: { HR: 5, RBI: 20, SB: 2, AVG: 0.220, R: 25 },
            };
            const good = getHittingScore(mockHitterStats, mockHitterSummary, mockScoringSettings());
            const bad  = getHittingScore(worseStats, mockHitterSummary, mockScoringSettings());
            expect(good['lastYearStats']).toBeGreaterThan(bad['lastYearStats']);
        });

        it('best possible hitter scores higher than average', () => {
            const bestStats = {
                lastYearStats:  { HR: 60, RBI: 130, SB: 60, AVG: 0.450, R: 130 },
                threeYearAvg:   { HR: 60, RBI: 130, SB: 60, AVG: 0.450, R: 130 },
                projectedStats: { HR: 60, RBI: 130, SB: 60, AVG: 0.450, R: 130 },
            };
            const best = getHittingScore(bestStats, mockHitterSummary, mockScoringSettings());
            const avg  = getHittingScore(mockHitterStats, mockHitterSummary, mockScoringSettings());
            expect(best['lastYearStats']).toBeGreaterThan(avg['lastYearStats']);
        });
    });

    // --- getScarcity ---
    describe('getScarcity', () => {
        it('returns 1.0 when no players passed in', () => {
            expect(getScarcity([], 5)).toBe(1.0);
        });

        it('boosts value when scarce', () => {
            const players = [{ rank: 1.0 }, { rank: 0.8 }]; // only 2 quality, need 5
            expect(getScarcity(players, 5)).toBeGreaterThan(1.0);
        });

        it('caps boost at 1.20', () => {
            const players = [{ rank: 1.0 }];
            expect(getScarcity(players, 100)).toBeCloseTo(1.20, 1);
        });

        it('discounts value when deep', () => {
            const players = Array(20).fill({ rank: 1.0 });
            expect(getScarcity(players, 2)).toBeLessThan(1.0);
        });

        it('floors discount at 0.90', () => {
            const players = Array(100).fill({ rank: 1.0 });
            expect(getScarcity(players, 1)).toBe(0.90);
        });

        it('returns 1.0 when supply exactly meets demand', () => {
            const players = Array(5).fill({ rank: 1.0 });
            expect(getScarcity(players, 5)).toBe(1.0);
        });
    });

    // --- getDepthChartMultiplier ---
    describe('getDepthChartMultiplier', () => {
        it('returns 1.0 for starter', () => expect(getDepthChartMultiplier(1)).toBe(1.0));
        it('returns 0.85 for backup',  () => expect(getDepthChartMultiplier(2)).toBe(0.85));
        it('returns 0.60 for depth',   () => expect(getDepthChartMultiplier(3)).toBe(0.60));
        it('returns 0.40 for fringe',  () => expect(getDepthChartMultiplier(4)).toBe(0.40));
        it('returns 0.40 for any index above 3', () => expect(getDepthChartMultiplier(99)).toBe(0.40));
    });

    // --- getReplacementPlayerScore ---
    describe('getReplacementPlayerScore', () => {
        it('returns correct Nth ranked score', () => {
            const players = [
                { mlbPlayerId: 1, rank: 10 },
                { mlbPlayerId: 2, rank: 5  },
                { mlbPlayerId: 3, rank: 8  },
            ];
            // sorted: [10, 8, 5], leagueNeed=2 so replacement = index 2 = rank 5
            expect(getReplacementPlayerScore(players, 2)).toBe(5);
        });

        it('returns 0 when fewer players than league need', () => {
            expect(getReplacementPlayerScore([{ mlbPlayerId: 1, rank: 10 }], 5)).toBe(0);
        });
    });

    // --- computePlayerCost ---
    describe('computePlayerCost', () => {
        const scores = [
            { mlbPlayerId: 1, rank: 10, position: RosterPosition.CATCHER },
            { mlbPlayerId: 2, rank: 5,  position: RosterPosition.CATCHER },
            { mlbPlayerId: 3, rank: 8,  position: RosterPosition.PITCHER },
        ];
        const numTeams = 1; // ← changed from 10 to 1

        it('total costs do not exceed total league budget', () => {
            const result = computePlayerCost(scores, 260, mockLeagueNeeds(), numTeams);
            const total = result.reduce((sum, p) => sum + p.cost, 0);
            expect(total).toBeLessThanOrEqual(260 * numTeams);
        });

        it('minimum cost is always 1', () => {
            const belowReplacement = [{ mlbPlayerId: 1, rank: -99, position: RosterPosition.CATCHER }];
            const result = computePlayerCost(belowReplacement, 260, mockLeagueNeeds(), numTeams);
            expect(result[0].cost).toBe(1);
        });

        it('higher ranked player gets higher cost', () => {
            const result = computePlayerCost(scores, 260, mockLeagueNeeds(), numTeams);
            const p1 = result.find(p => p.mlbPlayerId === 1)!;
            const p2 = result.find(p => p.mlbPlayerId === 2)!;
            expect(p1.cost).toBeGreaterThan(p2.cost);
        });
        
        // ... rest of tests unchanged

        it('below replacement players still get cost of at least 1', () => {
            const withBelowReplacement = [
                ...scores,
                { mlbPlayerId: 4, rank: 0.1, position: RosterPosition.CATCHER }, // just above 0, below replacement
            ];
            const result = computePlayerCost(withBelowReplacement, 260, mockLeagueNeeds(), numTeams);
            const p4 = result.find(p => p.mlbPlayerId === 4)!;
            expect(p4.cost).toBeGreaterThanOrEqual(1);
        });

        it('below replacement players are priced proportionally to each other', () => {
            const withBelowReplacement = [
                ...scores,
                { mlbPlayerId: 4, rank: 0.5, position: RosterPosition.CATCHER },
                { mlbPlayerId: 5, rank: 0.1, position: RosterPosition.CATCHER },
            ];
            const result = computePlayerCost(withBelowReplacement, 260, mockLeagueNeeds(), numTeams);
            const p4 = result.find(p => p.mlbPlayerId === 4)!;
            const p5 = result.find(p => p.mlbPlayerId === 5)!;
            expect(p4.cost).toBeGreaterThanOrEqual(p5.cost);
        });
    });

    // --- computePlayerScores age/IL adjustments ---
    describe('computePlayerScores adjustments', () => {
        const getrank = (overrides = {}) => {
            const player = mockHitter(overrides);
            const anchor = mockHitter({ 
                mlbPlayerId: 999,
                lastYearStats:  { HR: 5, RBI: 30, SB: 2, AVG: 0.220, R: 25 },
                threeYearAvg:   { HR: 5, RBI: 30, SB: 2, AVG: 0.220, R: 25 },
                projectedStats: { HR: 5, RBI: 30, SB: 2, AVG: 0.220, R: 25 },
            });
            const leagueStats = getLeagueStats([player, anchor]);
            return computePlayerScores([player, anchor], leagueStats, mockScoringSettings(), mockLeagueNeeds())[0].rank;
        };

        it('age <=22 scores higher than age 28', () => {
            expect(getrank({ age: 22 })).toBeGreaterThan(getrank({ age: 28 }));
        });

        it('age >35 scores lower than age 28', () => {
            expect(getrank({ age: 36 })).toBeLessThan(getrank({ age: 28 }));
        });

        it('OUT status results in rank of 0', () => {
            expect(getrank({ status: Status.OUT })).toBe(0);
        });

        it('IL_60 scores lower than ACTIVE', () => {
            expect(getrank({ status: Status.IL_60 })).toBeLessThan(getrank({ status: Status.ACTIVE }));
        });

        it('IL_10 scores lower than ACTIVE but higher than IL_60', () => {
            const il10  = getrank({ status: Status.IL_10 });
            const il60  = getrank({ status: Status.IL_60 });
            const active = getrank({ status: Status.ACTIVE });
            expect(il10).toBeLessThan(active);
            expect(il10).toBeGreaterThan(il60);
        });
    });

    // --- getActiveStatSets ---
    describe('getActiveStatSets', () => {
        it('returns all three when all flags true', () => {
            expect(getActiveStatSets(mockScoringSettings())).toHaveLength(3);
        });
        it('returns only lastYearStats when others false', () => {
            const s = { ...mockScoringSettings(), useThreeYearAvg: false, useProjected: false };
            expect(getActiveStatSets(s as ScoringSettings)).toEqual(['lastYearStats']);
        });
        it('returns empty array when all flags false', () => {
            const s = { ...mockScoringSettings(), useLastYear: false, useThreeYearAvg: false, useProjected: false };
            expect(getActiveStatSets(s as ScoringSettings)).toEqual([]);
        });
    });

});

describe('getEligibleRosterPositions', () => {
    it('catcher is eligible for CATCHER and UTILITY', () => {
        expect(getEligibleRosterPositions(Position.CATCHER))
            .toEqual([RosterPosition.CATCHER, RosterPosition.UTILITY]);
    });
    it('shortstop is eligible for SHORTSTOP, MIDDLE, and UTILITY', () => {
        expect(getEligibleRosterPositions(Position.SHORTSTOP))
            .toEqual([RosterPosition.SHORTSTOP, RosterPosition.MIDDLE, RosterPosition.UTILITY]);
    });
    it('unknown position returns only UTILITY', () => {
        expect(getEligibleRosterPositions('UNKNOWN' as Position))
            .toEqual([RosterPosition.UTILITY]);
    });
});