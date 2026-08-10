/**
 * Typed domain errors.
 *
 * The domain never throws bare `Error` and never throws framework errors. Each
 * error carries a stable `code` so adapters can map it to an HTTP status and the
 * UI can map it to copy without string matching.
 */

export type DomainErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "PLAN_LIMIT_REACHED"
  | "ASSET_NOT_READY"
  | "SCENE_INVALID"
  | "TEMPLATE_CAPACITY_EXCEEDED";

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  protected constructor(
    message: string,
    readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_FAILED" as const;

  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(message, details);
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;

  constructor(resource: string, id: string) {
    super(`${resource} not found`, { resource, id });
  }
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN" as const;

  constructor(action: string) {
    super(`Not permitted: ${action}`, { action });
  }
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT" as const;

  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super(message, details);
  }
}

export class PlanLimitError extends DomainError {
  readonly code = "PLAN_LIMIT_REACHED" as const;

  constructor(
    readonly limit: string,
    readonly current: number,
    readonly max: number,
  ) {
    super(`Plan limit reached: ${limit} (${current}/${max})`, {
      limit,
      current,
      max,
    });
  }
}

export class AssetNotReadyError extends DomainError {
  readonly code = "ASSET_NOT_READY" as const;

  constructor(assetId: string, status: string) {
    super("This image is still being processed", { assetId, status });
  }
}

export class SceneInvalidError extends DomainError {
  readonly code = "SCENE_INVALID" as const;

  constructor(readonly issues: readonly SceneIssue[]) {
    super(`Gallery cannot be published: ${issues.length} issue(s)`, { issues });
  }
}

/**
 * A single publish blocker. `artworkId` lets the editor highlight the offending
 * item inline rather than showing a generic failure toast.
 */
export interface SceneIssue {
  readonly kind:
    | "asset-not-ready"
    | "missing-placement"
    | "overlapping-artwork"
    | "capacity-exceeded"
    | "missing-title"
    | "off-wall";
  readonly message: string;
  readonly artworkId?: string;
  readonly wallId?: string;
}
