import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const saltRounds = 10;

export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, saltRounds);
};

export const comparePassword = (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateTokens = (userId: string, email: string, role: Role, name: string) => {
    const payload = { id: userId, email, role, name };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};