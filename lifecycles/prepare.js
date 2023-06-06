const fs = require('fs');
const path = require('path');
const { parse: parseYaml, stringify: stringifyYaml } = require('yaml');
const calculateVersionCode = require('../util/calculateVersionCode.js');

const prepare = function prepare(
    pluginConfig,
    context
) {
    const { logger, options } = context;
    const resolvedFile = path.join(
        context.cwd ?? process.cwd(),
        pluginConfig?.pubspecPath ?? 'pubspec.yaml'
    );

    logger.log('Loading pubspec file: %s', resolvedFile);

    const pubspec = parseYaml(fs.readFileSync(resolvedFile, 'utf8'));

    logger.debug('Pubspec file as JSON: %s', pubspec);

    const versionField = pubspec.version;
    if (!versionField)
        throw new AggregateError([`Cannot find version field in pubspec file`]);

    const versionCode = calculateVersionCode(
        Object.assign(
            {
                versionString: context.nextRelease.version,
                majorWeight: 100_000_000,
                minorWeight: 100_000,
                patchWeight: 1_000,
                channelWeight: 100,
                preReleaseWeight: 1,
            },
            pluginConfig
        ),
        options?.branches ?? []
    );

    const versionString = `${context.nextRelease.version}+${versionCode}`;

    logger.log('Calculated version code: %s', versionCode);
    logger.log('Version is: %s', versionString);

    const newFileContents = stringifyYaml({
        ...pubspec,
        version: versionString,
    });

    logger.debug('New file contents:\n%s', newFileContents);
    logger.log('Writing to file %s', resolvedFile);

    fs.writeFileSync(resolvedFile, newFileContents, 'utf8');
};

module.exports = prepare;
