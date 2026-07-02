import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @signalwire/compatibility-api (one of the two telephony providers)
  // runtime-requires transitive deps (lodash, etc.) in a way Next's
  // serverless file-tracing misses when it bundles the package. Marking it
  // external makes Next load it from node_modules at runtime and trace its
  // full dependency tree instead.
  serverExternalPackages: ["@signalwire/compatibility-api"],
};

export default nextConfig;
