import { findAllPlayers} from '../repositories/playerRepository';
import Player from '../models/player'
import League from '../models/league'
import Team from '../models/team'
import {RosterPosition} from '../models/draftPick'
import ScoringSettings from '../models/scoringSettings';
import RosterSettings from '../models/rosterSettings';
import {Position, Status} from '../models/player'
import {Division} from '../models/playerSettings';

///////////////////////
// CONSTANTS
//////////////////////
export const DEFAULT_SCORING_SETTINGS = {
    hrWeight: 0.175,
    rbiWeight: 0.155,
    sbWeight: 0.125,
    avgWeight: 0.150,
    runsWeight: 0.125,
    eraWeight: 0.200,
    whipWeight: 0.200,
    winsWeight: 0.100,
    strikeoutsWeight: 0.150,
    savesWeight: 0.100,
    useLastYear: true,
    useThreeYearAvg: true,
    useProjected: true,
} as unknown as ScoringSettings

export const DEFAULT_LEAGUE_NEEDS: Record<RosterPosition, number> = {
    [RosterPosition.CATCHER]: 2,
    [RosterPosition.FIRST]: 1,
    [RosterPosition.SECOND]: 1,
    [RosterPosition.THIRD]: 1,
    [RosterPosition.SHORTSTOP]: 1,
    [RosterPosition.CORNER]: 1,
    [RosterPosition.MIDDLE]: 1,
    [RosterPosition.OUTFIELD]: 5,
    [RosterPosition.UTILITY]: 1,
    [RosterPosition.PITCHER]: 9
}

///////////////////////
// USER CALLED FUNCTIONS
//////////////////////
export const getAllPlayerRanks = async(): Promise<{mlbPlayerId: number, rank: number, cost: number}[]> => {
    const players = await findAllPlayers();
    return getPlayerRanksAndCost(260, players, DEFAULT_LEAGUE_NEEDS, DEFAULT_SCORING_SETTINGS);
}

export const getAllUpdatedPlayerRanks = async(league: League): Promise<{mlbPlayerId: number, rank: number, cost:number}[]> => {
    const allPlayers = await findAllPlayers();
    console.log("Sample player:", JSON.stringify(allPlayers[0]));
    console.log("Sample lastYearStats:", JSON.stringify(allPlayers[0]?.lastYearStats));

    const divisionFiltered = allPlayers.filter(player => {
        if(league.playerSettings.division === Division.MIXED) return true;
        return player.realLeague === league.playerSettings.division;
    }).filter(player => player.status !== Status.MINORS);

    if(league.teams == undefined){
        const league_needs: Record<RosterPosition, number> = {
            [RosterPosition.CATCHER]: league.rosterSettings.numCatchers,
            [RosterPosition.FIRST]: league.rosterSettings.numFirstBase,
            [RosterPosition.SECOND]: league.rosterSettings.numSecondBase,
            [RosterPosition.THIRD]: league.rosterSettings.numThirdBase,
            [RosterPosition.SHORTSTOP]: league.rosterSettings.numShortstop,
            [RosterPosition.CORNER]: league.rosterSettings.numCornerInfield,
            [RosterPosition.MIDDLE]: league.rosterSettings.numMiddleInfield,
            [RosterPosition.OUTFIELD]: league.rosterSettings.numOutfield,
            [RosterPosition.UTILITY]: league.rosterSettings.numUtility,
            [RosterPosition.PITCHER]: league.rosterSettings.numPitchers
        }
        
        return getPlayerRanksAndCost(league.draftSettings.budget, divisionFiltered, league_needs, league.scoringSettings);
    }
    
    const teamInformation = await getTeamInfo(league.teams);

    const activePlayers = divisionFiltered.filter(player => !teamInformation.currentDrafted.includes(Number(player.mlbPlayerId)));

    const allTeamNeeds: Record<RosterPosition, number>[] = []
    for(const team of league.teams){
        const teamNeeds = getTeamNeeds(team, league.rosterSettings)
        allTeamNeeds.push(teamNeeds)
    }
    const leagueNeeds = getLeagueNeeds(allTeamNeeds)

    const ranks = getPlayerRanksAndCost(league.draftSettings.budget, activePlayers, leagueNeeds, league.scoringSettings);
    
    // Make inferences based on each team's status

    console.log("Sample rank:", ranks[0]);
    console.log("Sample player mlbPlayerId type:", typeof activePlayers[0]?.mlbPlayerId);
    console.log("Sample rank mlbPlayerId type:", typeof ranks[0]?.mlbPlayerId);
    const nullRanks = ranks.filter(r => r.rank === null || r.cost === null);
    console.log("Null rank count:", nullRanks.length);
    console.log("Sample null rank:", nullRanks[0]);
    console.log("Total players:", activePlayers.length);
    console.log("Valid players after stats filter:", activePlayers.filter(p => 
        p.lastYearStats != null && Object.keys(p.lastYearStats).length > 0).length);

    const ranksWithNames = ranks.map(r => {
        const player = activePlayers.find(p => p.mlbPlayerId === r.mlbPlayerId);
        return {
            ...r,
            name: player ? `${player.firstName} ${player.lastName}` : "Unknown"
        };
    });

    return ranksWithNames;
}

///////////////////////
// MAJOR FUNCTIONS
//////////////////////
export const getPlayerRanksAndCost = (totalBudget: number = 260, players: Player[], leagueNeeds: Record<RosterPosition, number>, scoringSettings: ScoringSettings): {mlbPlayerId: number, rank: number, cost: number}[] => {
    const validPlayers = players.filter(p =>
        p.lastYearStats != null && Object.keys(p.lastYearStats).length > 0 &&
        p.threeYearAvg != null && Object.keys(p.threeYearAvg).length > 0 &&
        p.projectedStats != null && Object.keys(p.projectedStats).length > 0
    );
    const leagueStats = getLeagueStats(validPlayers);
    const playerScores = computePlayerScores(validPlayers, leagueStats, scoringSettings, leagueNeeds)
    const playerCost = computePlayerCost(playerScores, totalBudget, leagueNeeds)
    return playerCost
}

export const computePlayerScores = (players: Player[], leagueStats: ReturnType<typeof getLeagueStats>, scoringSettings: ScoringSettings, leagueNeeds: Record<RosterPosition, number>): {mlbPlayerId: number, rank: number, position: RosterPosition}[] => {    
    const rawScores = players.filter(players =>
        players.lastYearStats != null && Object.keys(players.lastYearStats).length > 0 &&
        players.threeYearAvg != null && Object.keys(players.threeYearAvg).length > 0 &&
        players.projectedStats != null && Object.keys(players.projectedStats).length > 0
        )
        .map(player => {
        const playerStats = {
            lastYearStats: player.lastYearStats,
            threeYearAvg: player.threeYearAvg,
            projectedStats: player.projectedStats
        };

        const score = player.isHitter
            ? getHittingScore(playerStats, leagueStats.hitters, scoringSettings)
            : getPitchingScore(playerStats, leagueStats.pitchers, scoringSettings);
        
        const activeWindows = (scoringSettings.useLastYear? 1 : 0) + (scoringSettings.useThreeYearAvg? 1 : 0) + (scoringSettings.useProjected? 1 : 0)
        var rank = (score['lastYearStats'] * (scoringSettings.useLastYear? 1 : 0) + score['threeYearAvg'] * (scoringSettings.useThreeYearAvg? 1: 0) + score['projectedStats'] * (scoringSettings.useProjected? 1: 0))/activeWindows

        // AGE ADJUSTMENT
        if(player.age !=null && player.age<=22) rank *= 1.1;
        else if(player.age !=null && player.age > 22 && player.age<=25) rank *= 1.05;
        else if(player.age !=null && player.age > 31 && player.age<=35) rank *= 0.95;
        else if(player.age !=null && player.age > 35) rank *= 0.90

        // IL ADJUSTMENT
        switch(player.status) {
            case Status.IL_10: rank *= 0.90; break;
            case Status.IL_15: rank *=0.80; break;
            case Status.IL_60: rank *=0.50; break;
            case Status.OUT: rank *= 0; break;
        }

        const primaryPosition = getEligibleRosterPositions(player.playablePositions[0])[0];
        
        return { mlbPlayerId: player.mlbPlayerId, rank, position: primaryPosition};
    });

    // SCARCITY ADJUSTMENTS
    return rawScores.map(player => {
        const positionGroup = rawScores.filter(p => p.position === player.position);
        const scarcityMult = getScarcity(positionGroup, leagueNeeds[player.position]);
        return {...player, rank: player.rank * scarcityMult}
    })

}

export const computePlayerCost = (playerScores: {mlbPlayerId: number, rank: number, position: RosterPosition}[], totalBudget: number, leagueNeeds: Record<RosterPosition, number>) => {
    const replacementScores: Record<RosterPosition, number> = {} as Record<RosterPosition, number>
    for(const position in leagueNeeds) {
        const rosterPosition = position as RosterPosition
        const positionPlayers = playerScores.filter(p => p.position === rosterPosition);
        replacementScores[rosterPosition] = getReplacementPlayerScore(positionPlayers, leagueNeeds[rosterPosition])
    }

    const surpluses = playerScores.map(p => Math.max(0, p.rank - replacementScores[p.position]))
    const totalSurplus = surpluses.reduce((sum, v) => sum + v, 0)
    if(totalSurplus === 0) return playerScores.map(p => ({...p, cost:1}));
    
    return playerScores.map((player, i) => ({
        mlbPlayerId: player.mlbPlayerId,
        rank: player.rank,
        cost: Math.max(
            1,
            Math.round((surpluses[i]/totalSurplus) * totalBudget)
        )
    }));
}

///////////////////////
// HELPER FUNCTIONS
//////////////////////
// COMPUTING INDIVIDUAL SCORES
export const getPitchingScore = (playerStats: Record<string, Record<string, number>>, pitcherSummary: Record<string, Record<string, {min: number; max: number; avg: number; sd: number}>>, scoringSettings: ScoringSettings) : Record<string, number> => {
    const normalizedStats = getNormalizeStats(playerStats, pitcherSummary, scoringSettings);

    const rawWeights = {
        WHIP: scoringSettings.whipWeight,
        ERA: scoringSettings.eraWeight,
        SO: scoringSettings.strikeoutsWeight,
        W: scoringSettings.winsWeight,
        SV: scoringSettings.savesWeight
    }

    const weights = getNormalizeWeights(rawWeights)

    const statSets = getActiveStatSets(scoringSettings)

    const score: Record<string, number> = {};

    for(const statSet of statSets){        
        score[statSet] = (1-normalizedStats[statSet].WHIP) * weights.WHIP
                        + (1-normalizedStats[statSet].ERA) * weights.ERA
                        + (normalizedStats[statSet].SO) * weights.SO
                        + (normalizedStats[statSet].W) * weights.W
                        + (normalizedStats[statSet].SV) * weights.SV
    }

    return score;
}

export const getHittingScore = (playerStats: Record<string, Record<string, number>>, hitterSummary: Record<string, Record<string, {min: number; max: number; avg: number, sd: number}>>, scoringSettings: ScoringSettings) : Record<string, number> => {
    const normalizedStats = getNormalizeStats(playerStats, hitterSummary, scoringSettings);

    const rawWeights = {
        HR: scoringSettings.hrWeight,
        RBI: scoringSettings.rbiWeight,
        SB: scoringSettings.sbWeight,
        AVG: scoringSettings.avgWeight,
        R: scoringSettings.runsWeight
    }

    const weights = getNormalizeWeights(rawWeights)

    const statSets = getActiveStatSets(scoringSettings);

    const score: Record<string, number> = {};

    for(const statSet of statSets){      
        score[statSet] = (normalizedStats[statSet].HR) * weights.HR
                        + (normalizedStats[statSet].RBI) * weights.RBI
                        + (normalizedStats[statSet].SB) * weights.SB
                        + (normalizedStats[statSet].AVG) * weights.AVG
                        + (normalizedStats[statSet].R) * weights.R
    }

    return score;
}

// ADJUSTMENTS
export const getDepthChartMultiplier = (depthPosition: number): number => {
    switch(depthPosition) {
        case 0: return 1.0;
        case 1: return 0.85;
        case 2: return 0.60;
        default: return 0.40;
    }
}

export const getScarcity = (positionPlayers: {rank: number}[], leagueNeed: number): number => {
    if (positionPlayers.length === 0) return 1.0;

    const QUALITY_THRESHOLD = 0.5; // above average based on z-score norm
    const qualityPlayerCount = positionPlayers.filter(p => p.rank > QUALITY_THRESHOLD).length;
    const scarcityRatio = qualityPlayerCount / leagueNeed;

    if (scarcityRatio < 1.0) { // boosting value up to 20%
        // scarce — boost value, cap at 20%
        return Math.min(1 + (0.20 * (1 - scarcityRatio)), 1.20);
    } else { // decreasing value up to 10%
        return Math.max(1 - (0.10 * (scarcityRatio - 1)), 0.90);
    }

}

// GET SUMMARY STATS
export const getLeagueStats = (players: Player[]) => {
    const hitters = players.filter(p => p.isHitter);
    const pitchers = players.filter(p => !p.isHitter);

    const catchers = hitters.filter(p => p.playablePositions[0] === 'CATCHER');
    const first = hitters.filter(p => p.playablePositions[0] === 'FIRST');
    const second = hitters.filter(p => p.playablePositions[0] === 'SECOND');
    const third = hitters.filter(p => p.playablePositions[0] === 'THIRD')
    const shortstop = hitters.filter(p => p.playablePositions[0] === 'SHORTSTOP');
    const outfield = hitters.filter(p => p.playablePositions[0] === 'OUTFIELD');

    return {
        hitters: getLeagueSummary(hitters),
        pitchers: getLeagueSummary(pitchers),
        catchers: getLeagueSummary(catchers),
        first: getLeagueSummary(first),
        second: getLeagueSummary(second),
        third: getLeagueSummary(third),
        shortstop: getLeagueSummary(shortstop),
        outfield: getLeagueSummary(outfield)
    }
}

export const getLeagueSummary = (players: Player[]): Record<string, Record<string, {min: number; max: number; avg: number, sd: number}>> => {
    if (players.length === 0) return {};

    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;
    const summary: Record<string, Record<string, {min: number, max: number, avg: number, sd: number}>> = {}; // e.g., lastYearStats: { G: {min: 10, max: 11, avg: 10.5}}

    for(const statSet of statSets) {
        const allStats = players.map(player => player[statSet]); // Get the data from the particular player stat
        const statLabels = Object.keys(allStats[0])

        summary[statSet] = {};

        for(const statLabel of statLabels) { // Going through each individual stat
            const values = allStats.map(s => Number(s[statLabel])).filter(v => v !== null && v !== undefined); // Getting the proper stat for each player (minus the ones that are null)
            const avg = values.reduce((a,b) => a + b, 0)/ values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

            summary[statSet][statLabel] = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: avg,
                sd: Math.sqrt(variance)
            };
        }
    }

    return summary;
}


// NORMILIZATION
export const getNormalizeStats = (playerStats: Record<string, Record<string, number>>, leagueSummary: Record<string, Record<string, {min: number; max: number; avg: number, sd: number}>>, scoringSettings: ScoringSettings) : Record<string, Record<string, number>> => {
    const normalized: Record<string, Record<string, number>> = {}
    const statSets = getActiveStatSets(scoringSettings);

    for(const statSet of statSets){
        const statLabels = Object.keys(leagueSummary[statSet])
        
        normalized[statSet] = {};

        for(const statLabel of statLabels){
            const { avg, sd } = leagueSummary[statSet][statLabel];
            normalized[statSet][statLabel] = sd === 0 ? 0 : (Number(playerStats[statSet][statLabel] - avg) / sd);
        }
    }

    return normalized;
}

const getNormalizeWeights = (weights: Record<string, number>): Record<string, number> => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    return Object.fromEntries(
        Object.entries(weights).map(([key, val]) => [key, val / total])
    )
}

// TEAM + LEAGUE INFORMATION
export const getTeamInfo = async(teams: Team[]): Promise<{teamInfo: Record<number, number>[], currentDrafted: number[]}> => {   
    
    const teamInfo: Record<number, number>[] = [];
    var currentDrafted: number[] = [];

    for(const team of teams){
        var totalDrafted = 0;
        if(team.players != null){
            for(const player of team.players){
                totalDrafted ++;
                currentDrafted.push(Number(player.player_id));
            }
        }
        teamInfo.push({[team.id]: totalDrafted});
    }

    return {teamInfo: teamInfo, currentDrafted: currentDrafted};
}

export const getTeamNeeds = (team: Team, rosterSettings: RosterSettings): Record<RosterPosition, number> => {
    const needs: Record<RosterPosition, number> = {
        [RosterPosition.CATCHER]: rosterSettings.numCatchers,
        [RosterPosition.FIRST]: rosterSettings.numFirstBase,
        [RosterPosition.SECOND]: rosterSettings.numSecondBase,
        [RosterPosition.THIRD]: rosterSettings.numThirdBase,
        [RosterPosition.SHORTSTOP]: rosterSettings.numShortstop,
        [RosterPosition.CORNER]: rosterSettings.numCornerInfield,
        [RosterPosition.MIDDLE]: rosterSettings.numMiddleInfield,
        [RosterPosition.OUTFIELD]: rosterSettings.numOutfield,
        [RosterPosition.UTILITY]: rosterSettings.numUtility,
        [RosterPosition.PITCHER]: rosterSettings.numPitchers,
    };

    for (const player of team.players ?? []) {
        if(player.rosterPosition in needs) {
            needs[player.rosterPosition] = Math.max(0, needs[player.rosterPosition] - 1);
        }
    }

    return needs;
}

export const getLeagueNeeds = (allTeamNeeds: Record<RosterPosition, number>[]): Record<RosterPosition, number> => {
    const needs: Record<RosterPosition, number> = {
        [RosterPosition.CATCHER]: 0,
        [RosterPosition.FIRST]: 0,
        [RosterPosition.SECOND]: 0,
        [RosterPosition.THIRD]: 0,
        [RosterPosition.SHORTSTOP]: 0,
        [RosterPosition.CORNER]: 0,
        [RosterPosition.MIDDLE]: 0,
        [RosterPosition.OUTFIELD]: 0,
        [RosterPosition.UTILITY]: 0,
        [RosterPosition.PITCHER]: 0
    }

    for(const team of allTeamNeeds) {
        for(const position in team){
            const rosterPosition = position as RosterPosition;
            needs[rosterPosition] +=team[rosterPosition];
        }    }

    return needs
}

// OTHER
export const getReplacementPlayerScore = (playerScores: {mlbPlayerId: number, rank: number}[], leaguePlayerNeed: number): number => {
    playerScores.sort((a, b) => b.rank - a.rank);
    return playerScores[leaguePlayerNeed]?.rank ?? 0;
}

export const getActiveStatSets = (scoringSettings: ScoringSettings): string[] => {
    return [scoringSettings.useLastYear? 'lastYearStats': null,
                scoringSettings.useThreeYearAvg? 'threeYearAvg': null,
                scoringSettings.useProjected ? 'projectedStats': null
            ].filter(Boolean) as string[]
}

export const getEligibleRosterPositions = (position: Position): RosterPosition[] => {
    switch(position) {
        case Position.CATCHER:
            return [RosterPosition.CATCHER, RosterPosition.UTILITY];
        case Position.FIRST:
            return [RosterPosition.FIRST, RosterPosition.CORNER, RosterPosition.UTILITY];
        case Position.SECOND:
            return [RosterPosition.SECOND, RosterPosition.MIDDLE, RosterPosition.UTILITY];
        case Position.THIRD:
            return [RosterPosition.THIRD, RosterPosition.CORNER, RosterPosition.UTILITY];
        case Position.SHORTSTOP:
            return [RosterPosition.SHORTSTOP, RosterPosition.MIDDLE, RosterPosition.UTILITY];
        case Position.OUTFIELD:
        case Position.RIGHTFIELD:
        case Position.CENTERFIELD:
        case Position.LEFTFIELD:
            return [RosterPosition.OUTFIELD, RosterPosition.UTILITY];
        case Position.PITCHER:
        case Position.TWOWAY:
            return [RosterPosition.PITCHER, RosterPosition.UTILITY];
        default:
            return [RosterPosition.UTILITY];
    }
}