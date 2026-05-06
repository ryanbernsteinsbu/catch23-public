jest.mock('../config/database', () => ({
    default: { define: jest.fn(), authenticate: jest.fn(), sync: jest.fn(), query: jest.fn() }
}));

jest.mock('../repositories/apiUserRepository', () => ({
    findApiUserByEmail: jest.fn(),
    incrementApiUserUsage: jest.fn()
}));

import { Request, Response, NextFunction } from 'express';
import requireAuth from '../middleware/requireAuth';
import * as apiUserRepository from '../repositories/apiUserRepository';
import crypto from 'crypto';

const mockedRepo = apiUserRepository as jest.Mocked<typeof apiUserRepository>;

// Helper to build a valid signature for a given body + secret
const makeSignature = (body: object, secret: string): string => {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
};

const mockUser = { id: 1, email: 'test@test.com', apiKey: 'supersecret' };

const mockReq = (overrides: Partial<Request> = {}): Request => ({
    headers: {},
    body: {},
    ...overrides
} as Request);

const mockRes = (): { res: Response, status: jest.Mock, send: jest.Mock, json: jest.Mock } => {
    const send = jest.fn();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ send, json });
    return { res: { status } as unknown as Response, status, send, json };
};

const mockNext: NextFunction = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('requireAuth', () => {
    it('returns 400 when email header is missing', async () => {
        const { res, status } = mockRes();
        await requireAuth(mockReq({ headers: { 'x-signature': 'abc' } }), res, mockNext);
        expect(status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when signature header is missing', async () => {
        const { res, status } = mockRes();
        await requireAuth(mockReq({ headers: { 'x-email': 'test@test.com' } }), res, mockNext);
        expect(status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when user not found', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(null);
        const { res, status } = mockRes();
        await requireAuth(mockReq({
            headers: { 'x-email': 'test@test.com', 'x-signature': 'abc' }
        }), res, mockNext);
        expect(status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when signature is invalid', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);
        const { res, status } = mockRes();
        await requireAuth(mockReq({
            headers: { 'x-email': 'test@test.com', 'x-signature': 'wrongsignature' },
            body: {}
        }), res, mockNext);
        expect(status).toHaveBeenCalledWith(401);
    });

    it('calls next() when signature is valid', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);
        mockedRepo.incrementApiUserUsage.mockResolvedValue(undefined as any);
        const body = { test: 'data' };
        const sig = makeSignature(body, mockUser.apiKey);
        const { res } = mockRes();
        const next = jest.fn();

        await requireAuth(mockReq({
            headers: { 'x-email': mockUser.email, 'x-signature': sig },
            body
        }), res, next);

        expect(next).toHaveBeenCalled();
    });

    it('increments usage on successful auth', async () => {
        mockedRepo.findApiUserByEmail.mockResolvedValue(mockUser as any);
        mockedRepo.incrementApiUserUsage.mockResolvedValue(undefined as any);
        const body = {};
        const sig = makeSignature(body, mockUser.apiKey);
        const { res } = mockRes();

        await requireAuth(mockReq({
            headers: { 'x-email': mockUser.email, 'x-signature': sig },
            body
        }), res, mockNext);

        expect(mockedRepo.incrementApiUserUsage).toHaveBeenCalledWith(mockUser.id);
    });

    it('returns 500 on unexpected error', async () => {
        mockedRepo.findApiUserByEmail.mockRejectedValue(new Error('DB down'));
        const { res, status } = mockRes();

        await requireAuth(mockReq({
            headers: { 'x-email': 'test@test.com', 'x-signature': 'abc' }
        }), res, mockNext);

        expect(status).toHaveBeenCalledWith(500);
    });
});