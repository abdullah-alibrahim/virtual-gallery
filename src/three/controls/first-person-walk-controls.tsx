"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

import { useTouchInputStore } from "./touch-input-store";
import { isInsidePolygon, type Vec2 } from "@/three/math/geometry";

const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3();
const RIGHT = new Vector3();
const NEXT = new Vector3();

/**
 * Desktop: pointer-lock look + WASD / arrows.
 * Mobile: twin-stick via `useViewerInputStore` (HTML overlays).
 * Collision is a point-in-polygon test against the template walkBounds.
 * Eye height stays fixed (no head bob) — steady museum walk.
 */
export function FirstPersonWalkControls({
  walkBounds,
  walkSpeed,
  eyeHeight = 1.6,
  initialYaw = 0,
  enabled = true,
}: {
  walkBounds: readonly Vec2[];
  walkSpeed: number;
  eyeHeight?: number;
  initialYaw?: number;
  enabled?: boolean;
}) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const euler = useRef({ pitch: 0, yaw: initialYaw });
  const locked = useRef(false);

  useEffect(() => {
    euler.current.yaw = initialYaw;
    camera.rotation.order = "YXZ";
    camera.rotation.y = initialYaw;
  }, [camera, initialYaw]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const onKeyDown = (event: KeyboardEvent) => {
      keys.current.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };
    const onClick = () => {
      if (isTouch) return;
      if (!locked.current) canvas.requestPointerLock();
    };
    const onLockChange = () => {
      locked.current = document.pointerLockElement === canvas;
    };
    const onMouseMove = (event: MouseEvent) => {
      if (!locked.current) return;
      const sensitivity = 0.0022;
      euler.current.yaw -= event.movementX * sensitivity;
      euler.current.pitch -= event.movementY * sensitivity;
      euler.current.pitch = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, euler.current.pitch),
      );
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("mousemove", onMouseMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      useTouchInputStore.getState().reset();
    };
  }, [enabled, gl]);

  useFrame((_, delta) => {
    if (!enabled) return;

    const touch = useTouchInputStore.getState();
    const look = touch.consumeLook();
    if (look.dx !== 0 || look.dy !== 0) {
      const sensitivity = 0.003;
      euler.current.yaw -= look.dx * sensitivity;
      euler.current.pitch -= look.dy * sensitivity;
      euler.current.pitch = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, euler.current.pitch),
      );
    }

    camera.rotation.order = "YXZ";
    camera.rotation.y = euler.current.yaw;
    camera.rotation.x = euler.current.pitch;

    FORWARD.set(0, 0, -1).applyQuaternion(camera.quaternion);
    FORWARD.y = 0;
    FORWARD.normalize();
    RIGHT.crossVectors(FORWARD, UP).normalize();

    const speed = walkSpeed * (keys.current.has("ShiftLeft") ? 1.7 : 1);
    let moveX = touch.moveX;
    let moveZ = touch.moveZ;
    if (keys.current.has("KeyW") || keys.current.has("ArrowUp")) moveZ += 1;
    if (keys.current.has("KeyS") || keys.current.has("ArrowDown")) moveZ -= 1;
    if (keys.current.has("KeyA") || keys.current.has("ArrowLeft")) moveX -= 1;
    if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 1) {
      moveX /= len;
      moveZ /= len;
    }

    if (moveX === 0 && moveZ === 0) {
      camera.position.y = eyeHeight;
      return;
    }

    NEXT.copy(camera.position)
      .addScaledVector(FORWARD, moveZ * speed * delta)
      .addScaledVector(RIGHT, moveX * speed * delta);

    // Accept full step, else slide on each axis so corners / wing necks don't stick.
    const point: Vec2 = [NEXT.x, NEXT.z];
    if (isInsidePolygon(point, walkBounds)) {
      camera.position.x = NEXT.x;
      camera.position.z = NEXT.z;
    } else {
      const xOnly: Vec2 = [NEXT.x, camera.position.z];
      const zOnly: Vec2 = [camera.position.x, NEXT.z];
      if (isInsidePolygon(xOnly, walkBounds)) camera.position.x = NEXT.x;
      if (isInsidePolygon(zOnly, walkBounds)) camera.position.z = NEXT.z;
    }
    camera.position.y = eyeHeight;
  });

  return null;
}
