import { StoreService } from './service';

describe('test store', () => {
    test('set, update delete value', async () => {
        await StoreService.setValue('test', {
            foo: 'bar'
        });

        const value = await StoreService.getValue('test');

        expect(value.foo).toBe('bar');
        expect(JSON.stringify(value)).toBe(JSON.stringify({ foo: 'bar' }));

        await StoreService.setValue('test', {
            bar: 'foo'
        });

        const updatedValue = await StoreService.getValue('test');

        expect(updatedValue.bar).toBe('foo');
        expect(JSON.stringify(updatedValue)).toBe(JSON.stringify({ bar: 'foo' }));

        await StoreService.deleteValue('test');

        const deletedValue = await StoreService.getValue('test');

        expect(deletedValue).toBeFalsy();
    });
});