const fs = require('fs');
const path = require('path');

function verifyConditions(
    pluginConfig,
    context
) {
    const { logger } = context;
    if (!pluginConfig) throw new AggregateError(['No options passed']);

    logger.log('Verifying options: %s', pluginConfig);

    const weightErrors = [];

    (Object.keys(pluginConfig)).forEach(
        key => {
            if (
                key.endsWith('Weight') &&
                !(
                    typeof pluginConfig[key] === 'undefined' ||
                    (typeof pluginConfig[key] === 'number' &&
                        key !== 'channelWeight' &&
                        // @ts-expect-error Shut up
                        pluginConfig[key] > 0) ||
                    (key === 'channelWeight' && pluginConfig[key] > -1)
                )
            )
                weightErrors.push(
                    new Error(
                        `Option ${key} (${pluginConfig[key]}) must be a number higher than 0`
                    )
                );
        }
    );

    if (pluginConfig.minorWeight >= pluginConfig.majorWeight)
        weightErrors.push(
            new Error(
                `Option minorWeight (${pluginConfig.minorWeight}) must be lower than majorWeight (${pluginConfig.majorWeight})`
            )
        );
    if (pluginConfig.patchWeight >= pluginConfig.minorWeight)
        weightErrors.push(
            new Error(
                `Option patchWeight (${pluginConfig.patchWeight}) must be lower than minorWeight (${pluginConfig.minorWeight})`
            )
        );
    if (pluginConfig.channelWeight >= pluginConfig.patchWeight)
        weightErrors.push(
            new Error(
                `Option channelWeight (${pluginConfig.channelWeight}) must be lower than patchWeight (${pluginConfig.patchWeight})`
            )
        );
    if (
        pluginConfig.preReleaseWeight >=
        (pluginConfig.channelWeight || pluginConfig.patchWeight)
    )
        weightErrors.push(
            new Error(
                `Option preReleaseWeight (${
                    pluginConfig.preReleaseWeight
                }) must be lower than ${
                    pluginConfig.channelWeight
                        ? `channelWeight (${pluginConfig.channelWeight})`
                        : `patchWeight (${pluginConfig.patchWeight})`
                }}`
            )
        );

    if (weightErrors.length > 0) throw new AggregateError(weightErrors);

    pluginConfig.pubspecPath = path.join(
        context.cwd ?? process.cwd(),
        pluginConfig.pubspecPath ?? 'pubspec.yaml'
    );

    logger.log('Checking if pubspec file exists: %s', pluginConfig.pubspecPath);

    if (!fs.existsSync(pluginConfig.pubspecPath))
        throw new AggregateError([
            `Cannot find pubspec file: ${pluginConfig.pubspecPath}`,
        ]);
}

module.exports = verifyConditions