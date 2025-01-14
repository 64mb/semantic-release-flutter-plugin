const { copyFileSync, readFileSync, rmSync } = require( 'fs');
const { test } = require( 'uvu');
const { expect } = require( 'expect');
const lifecycles = require('../')

const context = {
    options: {
        branches: [
            'main',
            { name: 'dev', prerelease: true },
            { name: 'staging', prerelease: true, channel: 'beta' },
        ],
    },
    nextRelease: {
        version: '2.1.3',
    },
    logger: {
        log: () => {},
        debug: () => {},
    },
};

const contextWithDevPreRelease = {
    ...context,
    nextRelease: {
        version: '2.1.3-dev.1',
    },
};

const contextWithStagingPreRelease = {
    ...context,
    nextRelease: {
        version: '2.1.3-beta.2',
    },
};

function runPrepareWithContext(context) {
    copyFileSync(
        'src/__tests__/pubspec.yaml',
        'src/__tests__/pubspec-testing.yaml'
    );

    lifecycles.prepare(
        {
            pubspecPath: 'src/__tests__/pubspec-testing.yaml',
        },
        context
    );

    return readFileSync('src/__tests__/pubspec-testing.yaml', 'utf8');
}

test('should throw error when pubspec is invalid', () => {
    expect(() => {
        lifecycles.prepare(
            {
                pubspecPath: 'src/__tests__/pubspec-invalid.yaml',
            },
            context
        );
    }).toThrowError();
});

test('should not throw error when pubspec is valid', () => {
    copyFileSync(
        'src/__tests__/pubspec.yaml',
        'src/__tests__/pubspec-testing.yaml'
    );
    expect(() => {
        lifecycles.prepare(
            {
                pubspecPath: 'src/__tests__/pubspec-testing.yaml',
            },
            context
        );
        rmSync('src/__tests__/pubspec-testing.yaml');
    }).not.toThrowError();
});

test(`should update pubspec's version field`, () => {
    const content = runPrepareWithContext(context);
    rmSync('src/__tests__/pubspec-testing.yaml');
    expect(content).toContain('version: 2.1.3+200103000');
});

test(`should update pubspec's version field (prerelease)`, () => {
    const content = runPrepareWithContext(contextWithDevPreRelease);
    rmSync('src/__tests__/pubspec-testing.yaml');
    expect(content).toContain('version: 2.1.3-dev.1+200103100');
});

test(`should update pubspec's version field (named channel)`, () => {
    const content = runPrepareWithContext(contextWithStagingPreRelease);
    rmSync('src/__tests__/pubspec-testing.yaml');
    expect(content).toContain('version: 2.1.3-beta.2+200103201');
});

test('custom weights should work', () => {
    copyFileSync(
        'src/__tests__/pubspec.yaml',
        'src/__tests__/pubspec-testing.yaml'
    );

    // pov: you are weird
    lifecycles.prepare(
        {
            pubspecPath: 'src/__tests__/pubspec-testing.yaml',
            majorWeight: 200000000,
            minorWeight: 600000,
            patchWeight: 1500,
            channelWeight: 100,
            preReleaseWeight: 2,
        },
        contextWithStagingPreRelease
    );

    const content = readFileSync('src/__tests__/pubspec-testing.yaml', 'utf8');
    rmSync('src/__tests__/pubspec-testing.yaml');
    // (2 * 200000000) + (1 * 600000) + (3 * 1500) + (2 * 100) + ((2 - 1) * 2) = 400604702
    expect(content).toContain('version: 2.1.3-beta.2+400604702');
});

test.run();
