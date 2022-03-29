import { prisma } from '../../tools/prismaClient';

export class StoreService {
    public static getValue = async (key: string) => {
        const item = await prisma.store.findUnique({
            where: {
                key
            }
        });

        return item ? JSON.parse(item.value) : undefined;
    }
    public static setValue = async (key: string, value: any) => {
        await prisma.store.update({ 
            where: {
                key
            },
            data: {
                value: JSON.stringify(value)
            }
        });
    }
    public static deleteValue = async (key: string) => {
        await prisma.store.delete({
            where: {
                key
            }
        });
    }
}