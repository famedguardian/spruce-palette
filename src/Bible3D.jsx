import React, { useRef, useMemo, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ---------- procedural textures (canvas-based, no images needed) ----------
function useGrainTexture(enabled) {
  return useMemo(() => {
    if (!enabled) return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 110;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 7);
    return tex;
  }, [enabled]);
}

function useTitleTexture(color) {
  return useMemo(() => {
    const w = 512, h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 60px Georgia, 'Times New Roman', serif";
    ctx.fillText("H O L Y", w / 2, h * 0.34);
    ctx.fillText("B I B L E", w / 2, h * 0.7);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [color]);
}

function useSpineTexture(leatherHex) {
  return useMemo(() => {
    const w = 64, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = leatherHex;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (let i = 0; i < 5; i++) ctx.fillRect(0, 60 + i * 90, w, 10);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let i = 0; i < 5; i++) ctx.fillRect(0, 56 + i * 90, w, 3);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [leatherHex]);
}

const DIMS = {
  pageW: 1.46,
  pageH: 2.06,
  pageD: 0.28,
  coverOverhang: 0.05,
  coverD: 0.05,
  spineW: 0.16,
};

// wraps one or more meshes as a single clickable/hoverable region
function Hotspot({ keyName, onClick, onHover, children }) {
  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(keyName, e.nativeEvent); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(keyName); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = "auto"; }}
    >
      {children}
    </group>
  );
}

function Scene({ leather, display, onColorClick, pebbled }) {
  const [hovered, setHovered] = useState(null);

  const grain = useGrainTexture(pebbled);
  const titleTex = useTitleTexture(display.thread.h);
  const spineTex = useSpineTexture(leather.hex);

  const coverW = DIMS.pageW + DIMS.coverOverhang * 2;
  const coverH = DIMS.pageH + DIMS.coverOverhang * 2;
  const frontZ = DIMS.pageD / 2 + DIMS.coverD / 2;

  const emissive = (key) => (hovered === key ? "#B8935A" : "#000000");
  const emissiveIntensity = (key) => (hovered === key ? 0.35 : 0);

  return (
    <group>
      {/* page block */}
      <mesh position={[0.06, 0, 0]}>
        <boxGeometry args={[DIMS.pageW, DIMS.pageH, DIMS.pageD]} />
        <meshStandardMaterial color="#F2ECDD" roughness={0.9} />
      </mesh>

      {/* front cover */}
      <mesh position={[0, 0, frontZ]}>
        <boxGeometry args={[coverW, coverH, DIMS.coverD]} />
        <meshStandardMaterial
          color={leather.hex}
          roughness={0.6}
          metalness={0.04}
          bumpMap={grain || undefined}
          bumpScale={pebbled ? 0.012 : 0}
        />
      </mesh>

      {/* back cover */}
      <mesh position={[0, 0, -frontZ]}>
        <boxGeometry args={[coverW, coverH, DIMS.coverD]} />
        <meshStandardMaterial
          color={leather.hex}
          roughness={0.6}
          metalness={0.04}
          bumpMap={grain || undefined}
          bumpScale={pebbled ? 0.012 : 0}
        />
      </mesh>

      {/* spine */}
      <mesh position={[-(coverW / 2) - DIMS.spineW / 2 + 0.02, 0, 0]}>
        <boxGeometry args={[DIMS.spineW, coverH, DIMS.pageD + DIMS.coverD * 2]} />
        <meshStandardMaterial map={spineTex} roughness={0.6} />
      </mesh>

      {/* gilt page edges + foil title — tied to "thread" */}
      <Hotspot keyName="thread" onClick={onColorClick} onHover={setHovered}>
        <mesh position={[DIMS.pageW / 2 + 0.012, 0, 0]}>
          <boxGeometry args={[0.02, DIMS.pageH, DIMS.pageD]} />
          <meshStandardMaterial color={display.thread.h} metalness={0.5} roughness={0.35} emissive={emissive("thread")} emissiveIntensity={emissiveIntensity("thread")} />
        </mesh>
        <mesh position={[0.06, DIMS.pageH / 2 + 0.012, 0]}>
          <boxGeometry args={[DIMS.pageW, 0.02, DIMS.pageD]} />
          <meshStandardMaterial color={display.thread.h} metalness={0.5} roughness={0.35} emissive={emissive("thread")} emissiveIntensity={emissiveIntensity("thread")} />
        </mesh>
        <mesh position={[0.06, -DIMS.pageH / 2 - 0.012, 0]}>
          <boxGeometry args={[DIMS.pageW, 0.02, DIMS.pageD]} />
          <meshStandardMaterial color={display.thread.h} metalness={0.5} roughness={0.35} emissive={emissive("thread")} emissiveIntensity={emissiveIntensity("thread")} />
        </mesh>
        <mesh position={[0.05, 0, frontZ + DIMS.coverD / 2 + 0.002]}>
          <planeGeometry args={[1.05, 0.62]} />
          <meshBasicMaterial map={titleTex} transparent alphaTest={0.1} />
        </mesh>
      </Hotspot>

      {/* end sheet — hinge sliver on the front cover */}
      <Hotspot keyName="end" onClick={onColorClick} onHover={setHovered}>
        <mesh position={[-coverW / 2 + 0.05, 0, frontZ + DIMS.coverD / 2 + 0.002]}>
          <planeGeometry args={[0.05, coverH * 0.92]} />
          <meshStandardMaterial color={display.end.h} emissive={emissive("end")} emissiveIntensity={emissiveIntensity("end")} />
        </mesh>
      </Hotspot>

      {/* liner — turned-up corner */}
      <Hotspot keyName="liner" onClick={onColorClick} onHover={setHovered}>
        <mesh position={[-coverW / 2 + 0.11, -coverH / 2 + 0.11, frontZ + DIMS.coverD / 2 + 0.003]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshStandardMaterial color={display.liner.h} side={THREE.DoubleSide} emissive={emissive("liner")} emissiveIntensity={emissiveIntensity("liner")} />
        </mesh>
      </Hotspot>

      {/* ribbon */}
      <Hotspot keyName="ribbon" onClick={onColorClick} onHover={setHovered}>
        <mesh position={[0.35, -DIMS.pageH / 2 - 0.22, frontZ - 0.02]}>
          <boxGeometry args={[0.06, 0.42, 0.01]} />
          <meshStandardMaterial color={display.ribbon.h} roughness={0.5} emissive={emissive("ribbon")} emissiveIntensity={emissiveIntensity("ribbon")} />
        </mesh>
      </Hotspot>
    </group>
  );
}

export default function Bible3D({ leather, display, onChange, pebbled }) {
  const colorInputRef = useRef(null);
  const pendingKeyRef = useRef(null);

  // clicking a hotspot moves a hidden native color input to the click point and
  // opens it there, so the browser's own picker appears right where you clicked
  const handleColorClick = useCallback((key, nativeEvent) => {
    pendingKeyRef.current = key;
    const input = colorInputRef.current;
    if (!input) return;
    const x = nativeEvent?.clientX ?? window.innerWidth / 2;
    const y = nativeEvent?.clientY ?? window.innerHeight / 2;
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.value = display[key]?.h || "#000000";
    input.click();
  }, [display]);

  return (
    <div style={{ position: "relative", width: "100%", height: 420 }}>
      <Canvas camera={{ position: [1.6, 0.9, 3.4], fov: 32 }} style={{ width: "100%", height: "100%" }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 5]} intensity={1.05} />
        <directionalLight position={[-3, -1.5, -3]} intensity={0.3} />
        <Scene leather={leather} display={display} onColorClick={handleColorClick} pebbled={pebbled} />
        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={5.5}
          enableDamping
          dampingFactor={0.08}
          target={[0, 0, 0]}
        />
      </Canvas>

      <input
        ref={colorInputRef}
        type="color"
        onChange={(e) => onChange(pendingKeyRef.current, e.target.value)}
        style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
