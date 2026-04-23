/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((currentConfiguration) => {
  const configuration = enableTailwind(currentConfiguration);
  return {
    ...configuration,
    cache: false,
    output: {
      ...configuration.output,
      hashFunction: "sha256",
    },
  };
});
