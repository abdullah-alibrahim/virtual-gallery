import type {
  Gallery,
  GalleryArchitectureOverrides,
  GalleryEnvironmentOverrides,
  GalleryLightingOverrides,
  Template,
  TemplateArchitecture,
  TemplateEnvironment,
  TemplateLighting,
} from "@/core/entities";

import { applyMaterialOverrides } from "./resolve-gallery-materials";

type SceneLikeTemplate = Pick<
  Template,
  "materials" | "lighting" | "environment" | "architecture"
>;

/**
 * Bakes every gallery-level room override onto a template clone.
 * Catalogue documents are never mutated.
 */
export function applyGalleryOverrides<T extends SceneLikeTemplate>(
  template: T,
  gallery: Pick<
    Gallery,
    | "materialOverrides"
    | "lightingOverrides"
    | "environmentOverrides"
    | "architectureOverrides"
  >,
): T {
  let next = applyMaterialOverrides(template, gallery.materialOverrides);
  next = applyLightingOverrides(next, gallery.lightingOverrides);
  next = applyEnvironmentOverrides(next, gallery.environmentOverrides);
  next = applyArchitectureOverrides(
    next,
    gallery.architectureOverrides,
    gallery.environmentOverrides,
    gallery.lightingOverrides,
  );
  return next;
}

export function resolveGalleryLighting(
  base: TemplateLighting,
  overrides: GalleryLightingOverrides | null | undefined,
): TemplateLighting {
  if (!overrides) return base;

  const warmCool = clamp(overrides.warmCool ?? 0, -1, 1);
  const tint = warmCool !== 0 ? warmCoolTint(warmCool) : null;
  const needsKey =
    overrides.keyIntensity !== undefined || (tint !== null && !base.key);
  const needsFill =
    overrides.fillIntensity !== undefined || (tint !== null && !base.fill);

  const keyBase = base.key ?? (needsKey ? DEFAULT_KEY : undefined);
  const fillBase = base.fill ?? (needsFill ? DEFAULT_FILL : undefined);

  return {
    ...base,
    ambient: {
      color: tint
        ? mixHex(base.ambient.color, tint, Math.abs(warmCool) * 0.45)
        : base.ambient.color,
      intensity:
        overrides.ambientIntensity !== undefined
          ? clamp(overrides.ambientIntensity, 0, 4)
          : base.ambient.intensity,
    },
    ...(base.hemisphere
      ? {
          hemisphere: {
            ...base.hemisphere,
            skyColor: tint
              ? mixHex(base.hemisphere.skyColor, tint, Math.abs(warmCool) * 0.35)
              : base.hemisphere.skyColor,
          },
        }
      : {}),
    ...(keyBase
      ? {
          key: {
            ...keyBase,
            color: tint
              ? mixHex(keyBase.color, tint, Math.abs(warmCool) * 0.55)
              : keyBase.color,
            intensity:
              overrides.keyIntensity !== undefined
                ? clamp(overrides.keyIntensity, 0, 6)
                : keyBase.intensity,
          },
        }
      : {}),
    ...(fillBase
      ? {
          fill: {
            ...fillBase,
            color: tint
              ? mixHex(fillBase.color, tint, Math.abs(warmCool) * 0.25)
              : fillBase.color,
            intensity:
              overrides.fillIntensity !== undefined
                ? clamp(overrides.fillIntensity, 0, 4)
                : fillBase.intensity,
          },
        }
      : {}),
    ...(base.rim
      ? {
          rim: {
            ...base.rim,
            intensity:
              overrides.rimIntensity !== undefined
                ? clamp(overrides.rimIntensity, 0, 4)
                : base.rim.intensity,
          },
        }
      : {}),
    presets: base.presets,
  };
}

const DEFAULT_KEY = {
  color: "#fff8f0",
  intensity: 1.05,
  position: [-2.2, 5.8, 2.8] as const,
};

const DEFAULT_FILL = {
  color: "#e2e8f0",
  intensity: 0.34,
  position: [3.5, 3.2, -2.2] as const,
};

export function resolveGalleryEnvironment(
  base: TemplateEnvironment,
  overrides: GalleryEnvironmentOverrides | null | undefined,
): TemplateEnvironment {
  if (!overrides) return base;
  return {
    ...base,
    ...(overrides.exposure !== undefined
      ? { exposure: clamp(overrides.exposure, 0.2, 3) }
      : {}),
    ...(overrides.background !== undefined
      ? { background: overrides.background }
      : {}),
  };
}

/**
 * Applies architecture visibility toggles and track intensity. Skylight/window
 * visibility can also come from environmentOverrides.
 */
export function resolveGalleryArchitecture(
  base: TemplateArchitecture | undefined,
  architecture: GalleryArchitectureOverrides | null | undefined,
  environment: GalleryEnvironmentOverrides | null | undefined,
  lighting: GalleryLightingOverrides | null | undefined,
): TemplateArchitecture | undefined {
  if (!base) return undefined;

  const hideSkylight = environment?.skylightEnabled === false;
  const hideWindow = environment?.windowEnabled === false;
  const hideBenches = architecture?.showBenches === false;
  const hideSigns = architecture?.showSigns === false;
  const hideTracks = architecture?.showTracks === false;
  const hidePlinths = architecture?.showPlinths === false;
  const hideBeams = architecture?.showBeams === false;
  const hidePlants = architecture?.showPlants === false;
  const trackIntensity =
    lighting?.trackIntensity !== undefined &&
    base.trackLights &&
    !hideTracks
      ? clamp(lighting.trackIntensity, 0, 8)
      : undefined;

  const touches =
    hideSkylight ||
    hideWindow ||
    hideBenches ||
    hideSigns ||
    hideTracks ||
    hidePlinths ||
    hideBeams ||
    hidePlants ||
    trackIntensity !== undefined;

  if (!touches) return base;

  let next: TemplateArchitecture = { ...base };

  if (hideSkylight) {
    const { skylight: _s, ...rest } = next;
    next = rest;
  }
  if (hideWindow) {
    const { window: _w, ...rest } = next;
    next = rest;
  }
  if (hideBenches) {
    const { benches: _b, ...rest } = next;
    next = rest;
  }
  if (hideSigns) {
    const { signs: _s, ...rest } = next;
    next = rest;
  }
  if (hideTracks) {
    const { trackLights: _t, ...rest } = next;
    next = rest;
  }
  if (hidePlinths) {
    const { plinths: _p, ...rest } = next;
    next = rest;
  }
  if (hideBeams) {
    const { beams: _b, ...rest } = next;
    next = rest;
  }
  if (hidePlants && next.glbProps) {
    const filtered = next.glbProps.filter((p) => p.model !== "plant");
    if (filtered.length === 0) {
      const { glbProps: _g, ...rest } = next;
      next = rest;
    } else {
      next = { ...next, glbProps: filtered };
    }
  }

  if (trackIntensity !== undefined && next.trackLights) {
    next = {
      ...next,
      trackLights: {
        ...next.trackLights,
        intensity: trackIntensity,
      },
    };
  }

  return next;
}

function applyLightingOverrides<T extends SceneLikeTemplate>(
  template: T,
  overrides: GalleryLightingOverrides | null | undefined,
): T {
  if (!overrides) return template;
  return {
    ...template,
    lighting: resolveGalleryLighting(template.lighting, overrides),
  };
}

function applyEnvironmentOverrides<T extends SceneLikeTemplate>(
  template: T,
  overrides: GalleryEnvironmentOverrides | null | undefined,
): T {
  if (!overrides) return template;
  return {
    ...template,
    environment: resolveGalleryEnvironment(template.environment, overrides),
  };
}

function applyArchitectureOverrides<T extends SceneLikeTemplate>(
  template: T,
  architecture: GalleryArchitectureOverrides | null | undefined,
  environment: GalleryEnvironmentOverrides | null | undefined,
  lighting: GalleryLightingOverrides | null | undefined,
): T {
  if (!architecture && !environment && !lighting) return template;
  const resolved = resolveGalleryArchitecture(
    template.architecture,
    architecture,
    environment,
    lighting,
  );
  if (resolved === template.architecture) return template;
  if (resolved === undefined) {
    const { architecture: _a, ...rest } = template;
    return rest as T;
  }
  return { ...template, architecture: resolved };
}

function warmCoolTint(bias: number): string {
  return bias >= 0 ? "#ffd4a0" : "#a8c4ff";
}

function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  const k = clamp(t, 0, 1);
  const r = Math.round(ca.r + (cb.r - ca.r) * k);
  const g = Math.round(ca.g + (cb.g - ca.g) * k);
  const bl = Math.round(ca.b + (cb.b - ca.b) * k);
  return `#${toByte(r)}${toByte(g)}${toByte(bl)}`;
}

function parseHex(value: string): { r: number; g: number; b: number } | null {
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: Number.parseInt(raw.slice(1, 3), 16),
      g: Number.parseInt(raw.slice(3, 5), 16),
      b: Number.parseInt(raw.slice(5, 7), 16),
    };
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: Number.parseInt(raw[1]! + raw[1]!, 16),
      g: Number.parseInt(raw[2]! + raw[2]!, 16),
      b: Number.parseInt(raw[3]! + raw[3]!, 16),
    };
  }
  return null;
}

function toByte(n: number): string {
  return Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
