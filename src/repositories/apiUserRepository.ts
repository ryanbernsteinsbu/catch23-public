import ApiUser from '../models/apiUser';
const genRanHex = (size: number) : string => {return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')};


export const findApiUserByKey = async (apiKey: string): Promise<ApiUser | null> => {
    return await ApiUser.findOne({ where: { apiKey } });
};

export const findApiUserById = async (id: number): Promise<ApiUser | null> => {
    return await ApiUser.findOne({ where: { id } });
};

export const incrementApiUserUsage = async (id: number): Promise<void> => {
    await ApiUser.increment(
        { usage: 1 },
        { where: { id } }
    );
};

export const createApiUser = async (
    email: string,
    passwordHash: string,
): Promise<ApiUser> => {
    return await ApiUser.create({email, passwordHash, apiKey: genRanHex(16) });
}

