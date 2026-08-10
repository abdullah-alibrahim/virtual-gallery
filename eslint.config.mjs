import { createRequire } from "node:module";
import boundaries from "eslint-plugin-boundaries";

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const nextTypescript = require("eslint-config-next/typescript");

/**
 * Layer architecture, enforced.
 *
 * Dependencies point inward only: app → features → infrastructure → core.
 * A violation is a failed CI run, not a code-review conversation.
 *
 * Patterns use the default folder match so everything under e.g. `src/core/`
 * is classified as `core`, including nested value-objects and services.
 */
const elementDescriptors = [
  { type: "app", pattern: "src/app" },
  // Next.js middleware sits beside `app/` but is part of the app layer.
  { type: "app", pattern: "src/middleware.*" },
  { type: "core", pattern: "src/core" },
  { type: "infrastructure", pattern: "src/infrastructure" },
  { type: "three", pattern: "src/three" },
  {
    type: "feature",
    pattern: "src/features/*",
    capture: ["featureName"],
  },
  { type: "components", pattern: "src/components" },
  { type: "lib", pattern: "src/lib" },
  { type: "hooks", pattern: "src/hooks" },
  { type: "stores", pattern: "src/stores" },
  { type: "types", pattern: "src/types" },
  { type: "config", pattern: "src/config" },
];

const sharedAllow = [
  { to: { element: { type: "lib" } } },
  { to: { element: { type: "types" } } },
  { to: { element: { type: "config" } } },
];

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "functions/lib/**",
      "functions/node_modules/**",
      "next-env.d.ts",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true, project: "./tsconfig.json" },
        node: true,
      },
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": elementDescriptors,
      "boundaries/legacy-warnings": false,
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          checkAllOrigins: true,
          message:
            "Architecture boundary: {{from.element.type}} must not depend on {{to.element.type}}{{to.module.source}}.",
          policies: [
            {
              from: { element: { type: "core" } },
              allow: [{ to: { element: { type: "core" } } }],
            },
            {
              from: { element: { type: "core" } },
              disallow: [{ to: { module: { origin: ["external", "core"] } } }],
            },

            {
              from: { element: { type: "infrastructure" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "infrastructure" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },

            {
              from: { element: { type: "three" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "three" } } },
                ...sharedAllow,
                {
                  to: {
                    module: {
                      origin: "external",
                      source: [
                        "react",
                        "react-dom",
                        "three",
                        "three-stdlib",
                        "@react-three/fiber",
                        "@react-three/drei",
                        "@react-three/postprocessing",
                        "postprocessing",
                        "maath",
                        "zustand",
                      ],
                    },
                  },
                },
              ],
            },

            {
              from: { element: { type: "feature" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "infrastructure" } } },
                { to: { element: { type: "three" } } },
                { to: { element: { type: "components" } } },
                { to: { element: { type: "hooks" } } },
                { to: { element: { type: "stores" } } },
                ...sharedAllow,
                {
                  to: {
                    element: {
                      type: "feature",
                      captured: {
                        featureName: "{{from.element.captured.featureName}}",
                      },
                    },
                  },
                },
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },

            {
              from: { element: { type: "components" } },
              allow: [
                { to: { element: { type: "components" } } },
                { to: { element: { type: "core" } } },
                { to: { element: { type: "hooks" } } },
                { to: { element: { type: "stores" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },
            {
              from: { element: { type: "hooks" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "hooks" } } },
                { to: { element: { type: "stores" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },
            {
              from: { element: { type: "stores" } },
              allow: [
                { to: { element: { type: "core" } } },
                { to: { element: { type: "stores" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },
            {
              from: { element: { type: ["lib", "types", "config"] } },
              allow: [
                { to: { element: { type: "core" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },

            {
              from: { element: { type: "app" } },
              allow: [
                { to: { element: { type: "app" } } },
                { to: { element: { type: "feature" } } },
                { to: { element: { type: "components" } } },
                { to: { element: { type: "core" } } },
                { to: { element: { type: "infrastructure" } } },
                { to: { element: { type: "hooks" } } },
                { to: { element: { type: "stores" } } },
                ...sharedAllow,
                { to: { module: { origin: ["external", "core"] } } },
              ],
            },

            {
              from: {
                element: {
                  type: [
                    "app",
                    "feature",
                    "components",
                    "hooks",
                    "stores",
                    "lib",
                    "three",
                    "core",
                  ],
                },
              },
              disallow: [
                {
                  to: {
                    module: {
                      origin: "external",
                      source: ["firebase", "firebase-admin"],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts", "scripts/**/*.{ts,mjs,js}"],
    rules: {
      "boundaries/dependencies": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // R3F / three.js mutate camera, textures, and lights every frame — that is
    // the rendering model, not a React state bug.
    files: ["src/three/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
