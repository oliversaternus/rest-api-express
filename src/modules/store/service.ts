import { prisma } from '../../tools/prismaClient';

export const StoreService = {
    getValue: async (key: string) => {
        const item = await prisma.store.findUnique({
            where: {
                key
            }
        });

        return item ? JSON.parse(item.value) : undefined;
    },
    setValue: async (key: string, value: any) => {
        const valueString = JSON.stringify(value);
        await prisma.store.upsert({
            where: {
                key
            },
            update: {
                value: valueString
            },
            create: {
                key,
                value: valueString
            }
        });
    },
    deleteValue: async (key: string) => {
        await prisma.store.delete({
            where: {
                key
            }
        });
    }
}