"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Edges } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

// The Cryptographic Core (Visualized SHA-256 Hash)
function CryptoCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current && shellRef.current) {
      coreRef.current.rotation.y += delta * 0.3;
      coreRef.current.rotation.x += delta * 0.2;
      shellRef.current.rotation.y -= delta * 0.1;
      shellRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <group position={[0, 1.5, -2]}>
        {/* Solid Inner Gold Crystal */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.2, 0]} />
          <meshPhysicalMaterial 
            color="#fbbf24" 
            emissive="#b45309" 
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
          <Edges color="#fef3c7" scale={1.05} />
        </mesh>
        
        {/* Outer Violet Data Shell */}
        <mesh ref={shellRef}>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshBasicMaterial color="#4c1d95" wireframe transparent opacity={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

export default function Background3D() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#09090b]">
      {/* Subtle CSS Circuit Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} className="z-10">
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#fbbf24" />
        <directionalLight position={[-5, -5, -5]} intensity={3} color="#4c1d95" />
        <CryptoCore />
      </Canvas>
    </div>
  );
}