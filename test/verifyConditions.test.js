const { test } = require('uvu');
const { expect } = require('expect');
const lifecycles = require('../');

const context = {
    logger: {
        log: () => {},
        debug: () => {},
    },
};
const contextWithCwd = { ...context, cwd: 'src/__tests__' };

test("should throw error when manifest doesn't exist", () => {
    expect(() => {
        lifecycles.verifyConditions(
            {
                pubspecPath: 'this-file-does-not-exist.yaml',
            },
            contextWithCwd
        );
    }).toThrowError();
});

test('should throw an error when manifest does not exist in cwd', () => {
    expect(() => {
        lifecycles.verifyConditions(
            {
                pubspecPath: 'pubspec.yaml',
            },
            context
        );
    }).toThrowError();
});

test('should not throw error when manifest exists', () => {
    expect(() => {
        lifecycles.verifyConditions(
            {
                pubspecPath: 'pubspec.yaml',
            },
            contextWithCwd
        );
    }).not.toThrowError();
});

test('should not throw error when the auto-resolved manifest exists', () => {
    expect(() => {
        lifecycles.verifyConditions({}, contextWithCwd);
    }).not.toThrowError();
});

test('should not throw an error when manifest exists when using absolute paths', () => {
    expect(() => {
        lifecycles.verifyConditions(
            {
                pubspecPath: 'src/__tests__/pubspec.yaml',
            },
            context
        );
    }).not.toThrowError();
});

test.run();
