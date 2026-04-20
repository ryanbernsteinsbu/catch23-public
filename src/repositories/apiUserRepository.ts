import ApiUser from '../models/apiUser';

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

export const createApiUser = async (): Promise<void> => {
    //return api key, we possibly need email deets
}
