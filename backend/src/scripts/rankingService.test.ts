// tests/rankingService.test.ts

import { getNormalizeStats, getPitchingScore, getHittingScore } from '../services/rankingService';

// Mock one player stats
const mockHitterStats = {
    lastYearStats:  { HR: 30, RBI: 90, SB: 15, OBP: 0.360, SLG: 0.520, R: 85, H: 160, BB: 60, '2B': 35, AB: 500, '3B': 3 },
    threeYearAvg:   { HR: 25, RBI: 80, SB: 12, OBP: 0.340, SLG: 0.490, R: 78, H: 150, BB: 55, '2B': 30, AB: 480, '3B': 2 },
    projectedStats: { HR: 28, RBI: 85, SB: 14, OBP: 0.350, SLG: 0.510, R: 80, H: 155, BB: 58, '2B': 32, AB: 520, '3B': 3 },
};

// Mock all player summary
const mockHitterSummary = {
    lastYearStats:  { HR: { min: 0, max: 60, avg: 20 }, RBI: { min: 0, max: 130, avg: 65 }, SB: { min: 0, max: 60, avg: 15 }, OBP: { min: 0.200, max: 0.450, avg: 0.320 }, SLG: { min: 0.250, max: 0.650, avg: 0.420 }, R: { min: 0, max: 130, avg: 65 }, H: { min: 0, max: 220, avg: 130 }, BB: { min: 0, max: 120, avg: 50 }, '2B': { min: 0, max: 55, avg: 25 }, AB: { min: 0, max: 650, avg: 450 }, '3B': { min: 0, max: 15, avg: 3 } },
    threeYearAvg:   { HR: { min: 0, max: 60, avg: 20 }, RBI: { min: 0, max: 130, avg: 65 }, SB: { min: 0, max: 60, avg: 15 }, OBP: { min: 0.200, max: 0.450, avg: 0.320 }, SLG: { min: 0.250, max: 0.650, avg: 0.420 }, R: { min: 0, max: 130, avg: 65 }, H: { min: 0, max: 220, avg: 130 }, BB: { min: 0, max: 120, avg: 50 }, '2B': { min: 0, max: 55, avg: 25 }, AB: { min: 0, max: 650, avg: 450 }, '3B': { min: 0, max: 15, avg: 3 } },
    projectedStats: { HR: { min: 0, max: 60, avg: 20 }, RBI: { min: 0, max: 130, avg: 65 }, SB: { min: 0, max: 60, avg: 15 }, OBP: { min: 0.200, max: 0.450, avg: 0.320 }, SLG: { min: 0.250, max: 0.650, avg: 0.420 }, R: { min: 0, max: 130, avg: 65 }, H: { min: 0, max: 220, avg: 130 }, BB: { min: 0, max: 120, avg: 50 }, '2B': { min: 0, max: 55, avg: 25 }, AB: { min: 0, max: 650, avg: 450 }, '3B': { min: 0, max: 15, avg: 3 } },
};

describe('rankingService', () => {

    test('getNormalizeStats returns values between 0 and 1', () => {
        const normalized = getNormalizeStats(mockHitterStats, mockHitterSummary);

        for (const statSet of ['lastYearStats', 'threeYearAvg', 'projectedStats']) {
            for (const [key, value] of Object.entries(normalized[statSet])) {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            }
        }
    });

    test('getNormalizeStats returns the correct value', () => {
        const normalized = getNormalizeStats(mockHitterStats, mockHitterSummary);
        expect(normalized['lastYearStats'].HR).toBe(0.5);
        expect(normalized['threeYearAvg'].SB).toBe(0.2);
        expect(normalized['projectedStats'].AB).toBe(0.8);
    });

    test('getHittingScore returns correct score for mock data', () => {
        const score = getHittingScore(mockHitterStats, mockHitterSummary);

        expect(score['lastYearStats']).toBeCloseTo(0.5254);
        expect(score['threeYearAvg']).toBeCloseTo(0.4634);
        expect(score['projectedStats']).toBeCloseTo(0.4987);
    });

    test('checking an average hitter', () => {
        const averageHitterStats = {
            lastYearStats:  { HR: 60, RBI: 130, SB: 60, OBP: 0.450, SLG: 0.65, R: 130, H: 220, BB: 120, '2B': 55, AB: 650, '3B': 15 },
            threeYearAvg:   { HR: 60, RBI: 130, SB: 60, OBP: 0.450, SLG: 0.65, R: 130, H: 220, BB: 120, '2B': 55, AB: 650, '3B': 15 },
            projectedStats: { HR: 60, RBI: 130, SB: 60, OBP: 0.450, SLG: 0.65, R: 130, H: 220, BB: 120, '2B': 55, AB: 650, '3B': 15 },
        };

        const score = getHittingScore(averageHitterStats, mockHitterSummary);

        expect(score['lastYearStats']).toBeCloseTo(0.92);
    });

    test('better player scores higher than worse player', () => {
        const worseHitterStats = {
            lastYearStats:  { HR: 5, RBI: 20, SB: 2, OBP: 0.280, SLG: 0.330, R: 25, H: 90, BB: 20, '2B': 10, AB: 300, '3B': 0 },
            threeYearAvg:   { HR: 5, RBI: 20, SB: 2, OBP: 0.280, SLG: 0.330, R: 25, H: 90, BB: 20, '2B': 10, AB: 300, '3B': 0 },
            projectedStats: { HR: 5, RBI: 20, SB: 2, OBP: 0.280, SLG: 0.330, R: 25, H: 90, BB: 20, '2B': 10, AB: 300, '3B': 0 },
        };

        const goodScore = getHittingScore(mockHitterStats, mockHitterSummary);
        const badScore  = getHittingScore(worseHitterStats, mockHitterSummary);

        expect(goodScore['lastYearStats']).toBeGreaterThan(badScore['lastYearStats']);
    });

});