import { getPlayerStats, findPlayerById, findAllPlayers} from '../repositories/playerRepository';
import Player from '../models/player'
import League from '../models/league'
import Team from '../models/team'
import DraftPick, {RosterPosition} from '../models/draftPick'
import ScoringSettings from '../models/scoringSettings';
import RosterSettings from '../models/rosterSettings';

// Getting summary of league stats
export const getLeagueStats = async(players: Player[]) => {    
    const hitters = players.filter(p => p.isHitter);
    const pitchers = players.filter(p => !p.isHitter);

    // Position specific
    const catchers = hitters.filter(p => p.playablePositions[0] === 'CATCHER');
    const first = hitters.filter(p => p.playablePositions[0] === 'FIRST');
    const second = hitters.filter(p => p.playablePositions[0] === 'SECOND');
    const third = hitters.filter(p => p.playablePositions[0] === 'THIRD')
    const shortstop = hitters.filter(p => p.playablePositions[0] === 'SHORTSTOP');
    const outfield = hitters.filter(p => p.playablePositions[0] === 'OUTFIELD');

    return {
        hitters: computeLeagueSummary(hitters),
        pitchers: computeLeagueSummary(pitchers),
        catchers: computeLeagueSummary(catchers),
        first: computeLeagueSummary(first),
        second: computeLeagueSummary(second),
        third: computeLeagueSummary(third),
        shortstop: computeLeagueSummary(shortstop),
        outfield: computeLeagueSummary(outfield)
    }
}

// Computing summary of league stats
export const computeLeagueSummary = (players: Player[]): Record<string, Record<string, {min: number; max: number; avg: number}>> => {
    // Collecting min, max, and average of each stat for each set of stats
    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;
    const summary: Record<string, Record<string, {min: number, max: number, avg: number}>> = {}; // e.g., lastYearStats: { G: {min: 10, max: 11, avg: 10.5}}

    for(const statSet of statSets) {
        const allStats = players.map(player => player[statSet]); // Get the data from the particular player stat
        const statLabels = Object.keys(allStats[0])

        summary[statSet] = {};

        for(const statLabel of statLabels) { // Going through each individual stat
            const values = allStats.map(s => s[statLabel]).filter(v => v !== null && v !== undefined); // Getting the proper stat for each player (minus the ones that are null)
            summary[statSet][statLabel] = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a,b) => a + b, 0) / values.length,
            };
        }
    }

    return summary;
}

// Normalize player data
export const getNormalizeStats = (playerStats: Record<string, Record<string, number>>, leagueSummary: Record<string, Record<string, {min: number; max: number; avg: number}>>) : Record<string, Record<string, number>> => {
    const normalized: Record<string, Record<string, number>> = {}
    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;

    for(const statSet of statSets){
        const statLabels = Object.keys(leagueSummary[statSet])
        
        normalized[statSet] = {};

        for(const statLabel of statLabels){
            const { min, max } = leagueSummary[statSet][statLabel];
            normalized[statSet][statLabel] = (playerStats[statSet][statLabel] - min) / (max-min);
        }
    }

    return normalized;
}

// Compute Average Player (for deciding on monetary value)
export const getAveragePlayer = (leagueSummary: Record<string, Record<string, {min: number; max: number; avg: number}>>) : Record<string, Record<string, number>> => {
    const average: Record<string, Record<string, number>> = {}
    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;

    for(const statSet of statSets){
        const statLabels = Object.keys(leagueSummary[statSet])
        
        average[statSet] = {};

        for(const statLabel of statLabels){
            average[statSet][statLabel] = leagueSummary[statSet][statLabel].avg;
        }
    }

    return average;
}

// IL Adjustments

// Age Adjustments

// Consistent/Upward Stats Adjustments

// Low IP Adjustment

// Low AB Adjustment

// Calculating Pitching Score
export const getPitchingScore = (playerStats: Record<string, Record<string, number>>, pitcherSummary: Record<string, Record<string, {min: number; max: number; avg: number}>>) : Record<string, number> => {
    const normalizedStats = getNormalizeStats(playerStats, pitcherSummary);

    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;
    const score: Record<string, number> = {};

    for(const statSet of statSets){        
        score[statSet] = (1-normalizedStats[statSet].WHIP) * 0.2
                        + (1-normalizedStats[statSet].ERA) * 0.2
                        + (normalizedStats[statSet].SO) * 0.15
                        + (normalizedStats[statSet].IP) * 0.15
                        + (normalizedStats[statSet].W) * 0.1
                        + (normalizedStats[statSet].SV) * 0.1
                        + (normalizedStats[statSet].GS) * 0.1
                        + (1-normalizedStats[statSet].HR) * 0.011
                        // + (1-normalizedStats[statSet].SVG) * 0.011
                        + (normalizedStats[statSet].G) * 0.011
                        // + (normalizedStats[statSet].CG) * 0.011
                        // + (normalizedStats[statSet].SHO) * 0.011
                        // + (1-normalizedStats[statSet].R) * 0.011
                        // + (1-normalizedStats[statSet].HB) * 0.011;
    }

    return score;
}

// Calculating Hitting Score
export const getHittingScore = (playerStats: Record<string, Record<string, number>>, hitterSummary: Record<string, Record<string, {min: number; max: number; avg: number}>>) : Record<string, number> => {
    const normalizedStats = getNormalizeStats(playerStats, hitterSummary);

    const statSets = ['lastYearStats', 'threeYearAvg', 'projectedStats'] as const;
    const score: Record<string, number> = {};

    for(const statSet of statSets){      
        score[statSet] = (normalizedStats[statSet].HR) * 0.175
                        + (normalizedStats[statSet].RBI) * 0.155
                        + (normalizedStats[statSet].SB) * 0.125
                        + (normalizedStats[statSet].OBP) * 0.100
                        + (normalizedStats[statSet].SLG) * 0.100
                        + (normalizedStats[statSet].R) * 0.075
                        + (normalizedStats[statSet].H) * 0.075
                        + (normalizedStats[statSet].BB) * 0.060
                        // + (normalizedStats[statSet].SBR) * 0.055
                        + (normalizedStats[statSet]['2B']) * 0.025
                        + (normalizedStats[statSet].AB) * 0.020
                        // + (1-normalizedStats[statSet].SO) * 0.020;
                        + (normalizedStats[statSet]['3B']) * 0.015;
    }

    return score;
}

// Getting all the player ranks (without need for a league)
export const getAllPlayerRanks = async(): Promise<{mlbPlayerId: number, rank: number, cost: number}[]> => {
    const players = await findAllPlayers();
    return getPlayerRanksAndCost(260, players);
}

// Getting all the player ranks (with a league)

// Determining League and cost
export const getPlayerRanksAndCost = async(totalBudget: number = 260, players: Player[]): Promise<{mlbPlayerId: number, rank: number, cost: number}[]> => {
    const leagueStats = await getLeagueStats(players);

    const avgCatcherRank = await getAveragePlayerRank(leagueStats.catchers, false);
    const avgFirstBaseRank = await getAveragePlayerRank(leagueStats.first, false);
    const avgSecondBaseRank = await getAveragePlayerRank(leagueStats.second, false);
    const avgThirdBaseRank = await getAveragePlayerRank(leagueStats.third, false);
    const avgShortstopRank = await getAveragePlayerRank(leagueStats.shortstop, false);
    const avgOutfieldRank = await getAveragePlayerRank(leagueStats.outfield, false);
    const avgHitterRank = await getAveragePlayerRank(leagueStats.hitters, false);
    const avgPitcherRank = await getAveragePlayerRank(leagueStats.pitchers, true);

    const playerScores = await Promise.all(players.map(async player => {
        const playerStats = {
            lastYearStats: player.lastYearStats,
            threeYearAvg: player.threeYearAvg,
            projectedStats: player.projectedStats
        };

        const score = player.isHitter
            ? getHittingScore(playerStats, leagueStats.hitters)
            : getPitchingScore(playerStats, leagueStats.pitchers);
        
        var rank = 0.4 * score['lastYearStats'] + 0.2 * score['threeYearAvg'] + 0.4 * score['projectedStats'];

        if(player.age !=null && player.age<=22) rank *= 1.1;
        else if(player.age !=null && player.age > 22 && player.age<=25) rank *= 1.05;
        else if(player.age !=null && player.age > 31 && player.age<=35) rank *= 0.95;
        else if(player.age !=null && player.age > 35) rank *= 0.90

        var avgRank;
        if (player.isHitter){
            switch(player.playablePositions[0]){
                case 'CATCHER': avgRank = avgCatcherRank; break;
                case 'FIRST': avgRank = avgFirstBaseRank; break;
                case 'SECOND': avgRank = avgSecondBaseRank; break;
                case 'THIRD': avgRank = avgThirdBaseRank; break;
                case 'SHORTSTOP': avgRank = avgShortstopRank; break;
                case 'OUTFIELD': avgRank = avgOutfieldRank; break;
                default: avgRank = avgHitterRank;
            }
        } else{
            avgRank = avgPitcherRank;
        }
        
        return { mlbPlayerId: player.mlbPlayerId, rank, avgRank };
    }));

    const totalRank = playerScores.reduce((sum, p) => sum + Math.max(p.avgRank, 0), 0);

    return playerScores.map(player => ({
        mlbPlayerId: player.mlbPlayerId,
        rank: player.rank,
        cost: Math.max(
            1,
            Math.round((player.rank/totalRank) * totalBudget * players.length)
        )
    }));
}

export const getAveragePlayerRank = async(allPlayers: Record<string, Record<string, {min: number; max: number; avg: number}>>, isPitcher: boolean): Promise<number> => {
    const avgPlayerStats = getAveragePlayer(allPlayers);
    const avgPlayerScore = isPitcher? getPitchingScore(avgPlayerStats, allPlayers) : getHittingScore(avgPlayerStats, allPlayers);
    const avgPlayerRank = 0.4 * avgPlayerScore['lastYearStats'] + 0.2 * avgPlayerScore['threeYearAvg'] + 0.4 * avgPlayerScore['projectedStats'];

    return avgPlayerRank;
}

export const getTeamInfo = async(teams: Team[]): Promise<{teamInfo: Record<number, {budget: number, totalDrafted: number}>[], currentDrafted: number[]}> => {   
    const teamInfo: Record<number, {budget: number, totalDrafted: number}>[] = [{}];
    var currentDrafted: number[] = [];

    for(const team of teams){
        var budget = team.budget;
        var totalDrafted = 0;
        if(team.players != null){
            for(const player of team.players){
                budget -= player.cost;
                totalDrafted ++;
                currentDrafted.push(player.player_id);
            }
        }
        teamInfo.push({[team.id]: {budget: budget, totalDrafted: totalDrafted}});
    }

    return {teamInfo: teamInfo, currentDrafted: currentDrafted};
}

export const getPrincipleNeeds = (team: Team, rosterSettings: RosterSettings): Record<RosterPosition, number> => {
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

export const getAllUpdatedPlayerRanks = async(league: League): Promise<{mlbPlayerId: number, rank: number, cost:number}[]> => {
    // If there are no teams, just return the ranks as is
    if(league.teams == undefined){
        return getAllPlayerRanks();
    }
    
    // Get all players
    const allPlayers = await findAllPlayers();

    // Get Team information (including budget, and total drafted)
    const teamInformation = await getTeamInfo(league.teams);

    // Remove all the players that are already in use
    const activePlayers = allPlayers.filter(player => !teamInformation.currentDrafted.includes(player.mlbPlayerId));

    // Get the current rankings of all players (using method already implemented)
    const ranks = getPlayerRanksAndCost(league.draftSettings.budget, activePlayers);
    

    // Make inferences based on each team's status


    return ranks;
}