"use client";

import { useEffect, useRef } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide } from "three";

import type { ArtworkPlacement } from "@/core/entities";
import {
  placementFromWorldPoint,
  pickWallFromRay,
} from "@/core/services/wall-placement";
import { toMetres } from "@/core/value-objects/dimensions";

import { useEditorStore } from "../store/editor-store";

/**
 * Edit-mode wall drag + grab handle for the selected painting.
 * Preview via `applyPlacement`; commit as one undoable move on pointer up.
 */
export function EditorPlacementTools() {
  const { camera, gl, raycaster, pointer } = useThree();
  const template = useEditorStore((s) => s.template);
  const editorMode = useEditorStore((s) => s.editorMode);
  const selectedArtworkId = useEditorStore((s) => s.selectedArtworkId);
  const artworks = useEditorStore((s) => s.artworks);
  const snapToAnchors = useEditorStore((s) => s.snapToAnchors);
  const applyPlacement = useEditorStore((s) => s.applyPlacement);
  const commitPlacementMove = useEditorStore((s) => s.commitPlacementMove);
  const setPlacementDragActive = useEditorStore((s) => s.setPlacementDragActive);
  const selectArtwork = useEditorStore((s) => s.selectArtwork);

  const dragRef = useRef<{
    artworkId: string;
    before: ArtworkPlacement;
    scale: number;
  } | null>(null);

  const selected = artworks.find((a) => a.id === selectedArtworkId) ?? null;
  const edit = editorMode === "edit" && Boolean(template);

  useEffect(() => {
    if (!edit || !template) return;

    const canvas = gl.domElement;

    const endDrag = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setPlacementDragActive(false);
      const current = useEditorStore
        .getState()
        .artworks.find((a) => a.id === drag.artworkId);
      if (current) {
        commitPlacementMove(drag.artworkId, drag.before, current.placement);
      }
      canvas.style.cursor = "";
      document.body.style.cursor = "";
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const origin: [number, number, number] = [
        raycaster.ray.origin.x,
        raycaster.ray.origin.y,
        raycaster.ray.origin.z,
      ];
      const direction: [number, number, number] = [
        raycaster.ray.direction.x,
        raycaster.ray.direction.y,
        raycaster.ray.direction.z,
      ];

      const hit = pickWallFromRay(template.walls, origin, direction);
      if (!hit) return;

      applyPlacement(
        drag.artworkId,
        placementFromWorldPoint({
          wall: hit.wall,
          worldPoint: hit.point,
          scale: drag.scale,
          snapToAnchors,
          locked: false,
        }),
      );
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (dragRef.current) {
        dragRef.current = null;
        setPlacementDragActive(false);
      }
    };
  }, [
    applyPlacement,
    camera,
    commitPlacementMove,
    edit,
    gl,
    pointer,
    raycaster,
    setPlacementDragActive,
    snapToAnchors,
    template,
  ]);

  if (!edit || !selected || selected.placement.locked) return null;

  const metres = toMetres(selected.dimensions);
  const width = metres.width * selected.placement.scale;
  const height = metres.height * selected.placement.scale;
  const [px, py, pz] = selected.placement.position;
  const [rx, ry, rz] = selected.placement.rotation;

  const startDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    selectArtwork(selected.id);
    dragRef.current = {
      artworkId: selected.id,
      before: selected.placement,
      scale: selected.placement.scale,
    };
    setPlacementDragActive(true);
    gl.domElement.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
  };

  return (
    <mesh
      position={[px, py, pz]}
      rotation={[rx, ry, rz]}
      onPointerDown={startDrag}
      onPointerOver={() => {
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!dragRef.current) document.body.style.cursor = "";
      }}
    >
      <planeGeometry args={[width + 0.14, height + 0.14]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
