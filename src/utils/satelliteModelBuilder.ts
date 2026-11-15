/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Multi-part Procedural Satellite Model Builder
 * Constructs 6-10 part realistic scientific satellite meshes using THREE.Group
 * according to space engineering blueprints (Gold MLI foil, solar panels, radar dishes).
 */

import * as THREE from 'three';
import { Satellite } from '../types';

export function buildProceduralSatellite(satellite: Satellite): THREE.Group {
  const group = new THREE.Group();
  group.name = `sat_${satellite.id}`;

  // 1. Central Avionics Bus / Hull (Primary Silhouette)
  const busGeo = new THREE.BoxGeometry(0.08, 0.08, 0.14);
  // Gold multi-layer insulation (MLI) material
  const busMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Metallic gold
    metalness: 0.85,
    roughness: 0.25,
  });
  const busMesh = new THREE.Mesh(busGeo, busMat);
  busMesh.castShadow = true;
  group.add(busMesh);

  // 2. Instrument Bay / Radiator Panel (Silver aluminum)
  const bayGeo = new THREE.BoxGeometry(0.07, 0.03, 0.12);
  const bayMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.15,
  });
  const bayMesh = new THREE.Mesh(bayGeo, bayMat);
  bayMesh.position.set(0, 0.045, 0);
  group.add(bayMesh);

  // 3. Solar Array Wings (Secondary Read)
  const wingWidth = 0.22;
  const wingHeight = 0.07;
  const wingThick = 0.006;
  const wingGeo = new THREE.BoxGeometry(wingWidth, wingHeight, wingThick);
  
  // Photovoltaic cell dark blue silicon material
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Deep blue
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x0f172a,
    emissiveIntensity: 0.2,
  });

  // Solar Wing Boom / Truss (Left)
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
  const boomGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6);
  
  const boomLeft = new THREE.Mesh(boomGeo, trussMat);
  boomLeft.rotation.z = Math.PI / 2;
  boomLeft.position.set(-0.07, 0, 0);
  group.add(boomLeft);

  const solarLeft = new THREE.Mesh(wingGeo, solarMat);
  solarLeft.position.set(-0.19, 0, 0);
  group.add(solarLeft);

  // Solar Wing Boom / Truss (Right)
  const boomRight = new THREE.Mesh(boomGeo, trussMat);
  boomRight.rotation.z = Math.PI / 2;
  boomRight.position.set(0.07, 0, 0);
  group.add(boomRight);

  const solarRight = new THREE.Mesh(wingGeo, solarMat);
  solarRight.position.set(0.19, 0, 0);
  group.add(solarRight);

  // 4. Earth-Facing Sensor / Optical Payload / Radar Altimeter (Nadir deck)
  if (satellite.id === 'sentinel-6') {
    // Poseidon-4 Radar Altimeter parabolic reflector dish
    const dishGeo = new THREE.ConeGeometry(0.04, 0.02, 16, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI;
    dish.position.set(0, -0.05, 0.04);
    group.add(dish);
  } else {
    // Optical lens barrel (Landsat OLI-2 / MODIS)
    const lensBarrelGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.04, 16);
    const lensBarrelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    });
    const lensBarrel = new THREE.Mesh(lensBarrelGeo, lensBarrelMat);
    lensBarrel.position.set(0, -0.055, 0.03);
    group.add(lensBarrel);

    // Front optical glass element
    const lensGlassGeo = new THREE.CircleGeometry(0.02, 16);
    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan reflection
      metalness: 0.9,
      roughness: 0.1,
    });
    const lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.set(0, -0.076, 0.03);
    group.add(lensGlass);
  }

  // 5. Communications High-Gain Antenna Dish & Star Tracker Mast
  const mastGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6);
  const mast = new THREE.Mesh(mastGeo, trussMat);
  mast.position.set(0, 0.08, -0.03);
  group.add(mast);

  const commDishGeo = new THREE.SphereGeometry(0.03, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.4);
  const commDishMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.2,
    side: THREE.DoubleSide
  });
  const commDish = new THREE.Mesh(commDishGeo, commDishMat);
  commDish.position.set(0, 0.12, -0.03);
  commDish.rotation.x = -Math.PI * 0.4;
  group.add(commDish);

  // 6. Scale and initial alignment
  group.scale.setScalar(0.7);

  return group;
}
