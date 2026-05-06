jest.mock('../config/database', () => ({
    __esModule: true,
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../models/apiUser', () => ({
    __esModule: true,
    default: {
        create:    jest.fn(),
        findOne:   jest.fn(),
        increment: jest.fn()
    }
}));

import * as apiUserRepository from '../repositories/apiUserRepository';

const mockCreate  = jest.requireMock('../models/apiUser').default.create  as jest.Mock;
const mockFindOne = jest.requireMock('../models/apiUser').default.findOne as jest.Mock;

const mockUser = {
    id: 1, email: 'test@test.com',
    apiKey: 'abc123', passwordHash: 'hashed', usage: 0
};

beforeEach(() => jest.clearAllMocks());

describe('apiUserRepository', () => {
    describe('createApiUser', () => {
        it('creates a user with a generated api key', async () => {
            mockCreate.mockResolvedValue(mockUser);
            const result = await apiUserRepository.createApiUser('test@test.com', 'hashed');
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@test.com',
                    passwordHash: 'hashed',
                    apiKey: expect.any(String)
                })
            );
            expect(result).toEqual(mockUser);
        });

        it('generates a 16 character hex api key', async () => {
            mockCreate.mockResolvedValue(mockUser);
            await apiUserRepository.createApiUser('test@test.com', 'hashed');
            const callArg = mockCreate.mock.calls[0][0];
            expect(callArg.apiKey).toHaveLength(16);
            expect(callArg.apiKey).toMatch(/^[0-9a-f]+$/);
        });
    });

    describe('findApiUserByEmail', () => {
        it('returns user when found', async () => {
            mockFindOne.mockResolvedValue(mockUser);
            const result = await apiUserRepository.findApiUserByEmail('test@test.com');
            expect(result).toEqual(mockUser);
        });

        it('returns null when not found', async () => {
            mockFindOne.mockResolvedValue(null);
            const result = await apiUserRepository.findApiUserByEmail('unknown@test.com');
            expect(result).toBeNull();
        });
    });
});