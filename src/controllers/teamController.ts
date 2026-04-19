import { Request, Response } from 'express';
import Team from '../models/team';
import DraftPick from '../models/draftPick';

// Create Team
export const createTeam = async (req: Request, res: Response) => {
    try {
        const { name, budget, league_id } = req.body

        const team = await Team.create({
            name, budget, league_id
        })

        res.status(201).json(team);
    } catch (error: any) {
        console.error('Error creating team: ', error.message);
        res.status(500).json({ message: 'Error creating team', error });
    }
}

// Get Team
export const getTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findByPk(Number(req.params.id), {
            include: [
                { association: 'league' },
                { association: 'players' }
            ]
        });

        if (!team) throw new Error('Team not found');

        res.status(200).json(team);
    } catch (error: any) {
        console.error("Error creating league:", error);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Errors:", error.errors);
        res.status(500).json({ message: 'Error creating league', error: error.message });
    }
};

// Get League Teams
export const getLeagueTeams = async (req: Request, res: Response) => {
    try {
        const { league_id } = req.params;

        const teams = await Team.findAll({
            where: { league_id },
            // include: [
            //     { association: 'players' },
            // ]
        });

        res.status(200).json(teams);
    } catch (error: any) {
        console.error('Error getting league teams:', error.message);
        res.status(500).json({ message: 'Error getting league teams', error });
    }
}

// Update Team
export const updateTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findByPk(Number(req.params.id));
        if (!team) throw new Error('Team not found');

        await team.update(req.body);

        const updatedTeam = await Team.findByPk(team.id, {
            include: [{ association: 'league' }, { association: 'players' }]
        });

        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: 'Error updating team', error });
    }
}

// Delete Team
export const deleteTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findByPk(Number(req.params.id));
        if (!team) throw new Error('Team not found');

        await DraftPick.destroy({ where: { team_id: team.id } });
        await team.destroy();

        res.status(200).json({ message: 'Team deleted successfully ' });
    } catch (error: any) {
        console.error('Error deleting team:', error.message);
        res.status(500).json({ message: 'Error deleting team', error });
    }
}