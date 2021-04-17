import * as THREE from 'three'
import glsl from 'glslify'
import assets from '../lib/AssetManager'
import { wireValue, wireUniform } from '../lib/Controls'
import { addUniforms, customizeVertexShader } from '../lib/customizeShader'

// elaborated three.js component example
// containing example usage of
//   - asset manager
//   - control panel
//   - touch events
//   - postprocessing
//   - screenshot saving

// preload the main model
const modelKey = assets.queue({
  url: 'assets/EVDNT_GLTF_V52_R.glb',
  type: 'gltf',
})

// preload the materials
const blurMapKey = assets.queue({
  url: 'assets/foxing_map.png',
  type: 'texture'
})

// preload the environment map
const hdrKey = assets.queue({
  url: 'assets/environment-map-2.1.png',
  type: 'env-map',
})

export default class MainModel extends THREE.Group {
  constructor(webgl, options = {}) {
    super(options)
    this.webgl = webgl
    this.options = options

    const modelGltf = assets.get(modelKey)
    const modelClone = modelGltf.scene.clone()
    const envMap = assets.get(hdrKey)

    // customizeVertexShader(material, {
    //   head: glsl`
    //     uniform float time;
    //     uniform float frequency;
    //     uniform float amplitude;

    //     // you could import glsl packages like this
    //     // #pragma glslify: noise = require(glsl-noise/simplex/3d)
    //   `,
    //   main: glsl`
    //     float theta = sin(position.z * frequency + time) * amplitude;
    //     float c = cos(theta);
    //     float s = sin(theta);
    //     mat3 deformMatrix = mat3(c, 0, s, 0, 1, 0, -s, 0, c);
    //   `,
    //   // hook that lets you modify the normal
    //   objectNormal: glsl`
    //     objectNormal *= deformMatrix;
    //   `,
    //   // hook that lets you modify the position
    //   transformed: glsl`
    //     transformed *= deformMatrix;
    //   `,
    // })

    // CREATE THE TEST REFLECTIVE MATERIAL 
    this.reflectiveMaterial = new THREE.MeshPhysicalMaterial({
      transmissionMap: assets.get(blurMapKey),
      envMap,
      transparent: true,
      opacity: webgl.controls.opacity,
      roughness: webgl.controls.roughness,
      metalness: webgl.controls.metalness,
      envMapIntensity: webgl.controls.envMapIntensity,
      ior: webgl.controls.ior,
      transmission: webgl.controls.transmission,
      refractionRatio: webgl.controls.refractionRatio,
      reflectivity: webgl.controls.reflectivity,
      clearcoat: webgl.controls.clearcoat,
      clearcoatRoughness: webgl.controls.clearcoatRoughness,
      premultipliedAlpha: true,
      sheen: new THREE.Color("#2f99c0")
    });

    // Wire up controls to this material
    wireValue(this.reflectiveMaterial, () => webgl.controls.color);
    wireValue(this.reflectiveMaterial, () => webgl.controls.clearcoat);
    wireValue(this.reflectiveMaterial, () => webgl.controls.clearcoatRoughness);
    wireValue(this.reflectiveMaterial, () => webgl.controls.roughness);
    wireValue(this.reflectiveMaterial, () => webgl.controls.metalness)
    wireValue(this.reflectiveMaterial, () => webgl.controls.envMapIntensity)
    wireValue(this.reflectiveMaterial, () => webgl.controls.opacity)
    wireValue(this.reflectiveMaterial, () => webgl.controls.refractionRatio)
    wireValue(this.reflectiveMaterial, () => webgl.controls.reflectivity)
    wireValue(this.reflectiveMaterial, () => webgl.controls.ior)
    wireValue(this.reflectiveMaterial, () => webgl.controls.transmission)

    // add new unifroms and expose current uniforms
    addUniforms(this.reflectiveMaterial, {
      time: { value: 0 },
      frequency: wireUniform(this.reflectiveMaterial, () => webgl.controls.movement.frequency),
      amplitude: wireUniform(this.reflectiveMaterial, () => webgl.controls.movement.amplitude),
    })

    // apply the material to the model
    modelClone.traverse((child) => {
      if (child.isMesh) {
        const componentName = child.name;

        switch (componentName) {
          case "outsole":
            child.material = this.reflectiveMaterial;
            break;

          case "foxing_tip":
            child.material.roughnessMap = assets.get(blurMapKey);
            child.material.envMap = envMap;
            child.material.transparent = true;
            child.material.opacity = 0.8;
            child.material.roughness = 0.5;
            child.material.metalness = 0.5;
            child.material.envMapIntensity = 1
            child.material.ior = 6;
            child.material.refractionRatio = 0.5
            child.material.reflectivity = 1
            child.material.clearcoat = 0.65
            child.material.clearcoatRoughness = 0.65
            child.material.premultipliedAlpha = true;
            // child.material.needsUpdate = true;
            break;

          case "foxing_top":
            child.material.roughnessMap = assets.get(blurMapKey);
            child.material.envMap = envMap;
            child.material.transparent = true;
            child.material.opacity = 0.8;
            child.material.roughness = 0.5;
            child.material.metalness = 0.5;
            child.material.envMapIntensity = 1
            child.material.ior = 6;
            child.material.refractionRatio = 0.5
            child.material.reflectivity = 1
            child.material.clearcoat = 0.65
            child.material.clearcoatRoughness = 0.65
            child.material.premultipliedAlpha = true;
            break;

            case "midsole":
              child.material = new THREE.MeshPhysicalMaterial({
                transmissionMap: assets.get(blurMapKey),
                envMap,
                color: new THREE.Color("#2f99c0")
              });
              break;
        }
      }
    })

    // make it a little bigger
    modelClone.scale.multiplyScalar(1.2)

    this.add(modelClone)

    // set the background as the hdr
    this.webgl.scene.background = envMap
  }

  onPointerDown(event, { x, y }) {
    // for example, check of we clicked on an
    // object with raycasting
    const coords = new THREE.Vector2().set(
      (x / this.webgl.width) * 2 - 1,
      (-y / this.webgl.height) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(coords, this.webgl.camera)
    const hits = raycaster.intersectObject(this, true)
    console.log(hits.length > 0 ? `Hit ${hits[0].object.name}!` : 'No hit')
    // this, of course, doesn't take into consideration the
    // mesh deformation in the vertex shader
  }

  onPointerMove(event, { x, y }) { }

  onPointerUp(event, { x, y }) { }

  update(dt, time) {
    this.reflectiveMaterial.uniforms.time.value += dt * this.webgl.controls.movement.speed
  }
}
