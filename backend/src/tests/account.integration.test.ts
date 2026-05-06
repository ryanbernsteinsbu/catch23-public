jest.mock('../config/database', () => ({
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/apiUser', () => ({ default: { init: jest.fn() } }));
jest.mock('../models/player', () => ({
    default: { init: jest.fn() },
    Position: {}, Status: {}
}));
jest.mock('../models/draftPick', () => ({ RosterPosition: {} }));
jest.mock('../models/playerSettings', () => ({ default: { init: jest.fn() }, Division: {} }));
jest.mock('../models/scoringSettings',  () => ({ default: { init: jest.fn() } }));
jest.mock('../models/rosterSettings',   () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftSettings',    () => ({ default: { init: jest.fn() } }));
jest.mock('../models/draftPrep',        () => ({ default: { init: jest.fn() } }));
jest.mock('../models/league',           () => ({ default: { init: jest.fn(), hasOne: jest.fn(), hasMany: jest.fn() } }));
jest.mock('../models/team',             () => ({ default: { init: jest.fn() } }));

jest.mock('../middleware/requireAuth', () => (req: any, res: any, next: any) => next());
jest.mock('../services/transactionPoller', () => ({
    attachWSS: jest.fn(), startPoller: jest.fn(),
    getTransactionHistory: jest.fn().mockReturnValue([])
}));
jest.mock('../repositories/playerRepository', () => ({ findAllPlayers: jest.fn() }));

jest.mock('../repositories/apiUserRepository', () => ({
    createApiUser: jest.fn(),
    findApiUserByEmail: jest.fn(),
    incrementApiUserUsage: jest.fn()
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token')
}));

import request from 'supertest';
import app from '../app';
import * as apiUserRepository from '../repositories/apiUserRepository';
import bcrypt from 'bcrypt';

const mockedRepo = apiUserRepository as jest.Mocked<typeof apiUserRepository>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUser = {
    id: 1,
    email: 'test@test.com',
    apiKey: 'test-api-key',
    passwordHash: 'hashedpassword',
    usage: 5
};

beforeEach(() => jest.clearAllMocks());

// --- POST /api/create-key ---
describe('POST /api/create-key', () => {
    it('returns 201 with api key on success', async () => {
        mockedRepo.createApiUser.mockResolvedValue(mockUser as any);

        const response = await request(app)
            .post('/api/create-key')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(response.status).toBe(201);
        expect(response.body).toBe(mockUser.apiKey);
    });

    it('returns 400 when email is missing', async () => {
        const response = await request(app)
            .post('/api/create-key')
            .send({ password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when password is missing', async () => {
        const response = await request(app)
            .post('/api/create-key')
            .send({ email: 'test@test.com' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('returns 400 when user already exists', async () => {
        mockedRepo.createApiUser.mockRejectedValue(new Error('User already exists'));

        const response = await request(app)
            .post('/api/create-key')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

// --- POST /api/login ---
describe('POST /api/login', () => {
    it('returns 200 with token on valid credentials', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);
        (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@test.com', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user_id', mockUser.id);
    });

    it('returns 400 when email is missing', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ password: 'password123' });

        expect(response.status).toBe(400);
    });

    it('returns 400 when user not found', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(null);

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'unknown@test.com', password: 'password123' });

        expect(response.status).toBe(400);
    });

    it('returns 400 when password is invalid', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);
        (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@test.com', password: 'wrongpassword' });

        expect(response.status).toBe(400);
    });
});

// // --- GET /api/account/user-info/:email ---
// describe('GET /api/account/user-info/:email', () => {
//     it('returns 200 with user info', async () => {
//         mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);

//         const response = await request(app)
//             .get(`/api/account/user-info/${encodeURIComponent(mockUser.email)}`);

//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('key', mockUser.apiKey);
//         expect(response.body).toHaveProperty('usage', mockUser.usage);
//         expect(response.body).toHaveProperty('email', mockUser.email);
//     });

//     it('returns 404 when user not found', async () => {
//         mockedRepo.findApiUserByEmail.mockResolvedValue(null);

//         const response = await request(app)
//             .get('/api/account/user-info/unknown%40test.com');

//         expect(response.status).toBe(404);
//         expect(response.body).toHaveProperty('error', 'User not found');
//     });
// });