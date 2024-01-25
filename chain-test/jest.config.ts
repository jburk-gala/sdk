/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if (process.env.GALA_NETWORK_ROOT_PATH === undefined) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("path");
  const networkRoot = path.resolve(__dirname, "../chain-cli/network");
  process.env.GALA_NETWORK_ROOT_PATH = networkRoot;
}

/* eslint-disable */
export default {
  displayName: "chain-test",
  preset: "../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../coverage/chain-test"
};
