import './style.css';
import * as THREE from 'three';

import createStickerImages from './sticker.js'

import vertexShader from './shader/vertexShader';
import fragmentShader from './shader/fragmentShader';

const width = 512, height = 512;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

let url = 'https://media.discordapp.net/attachments/530169777843339265/1096520123562590259/IMG_3550.jpg';
let texturize = (imageData) => {
    const texture = new THREE.Texture(imageData)
    texture.needsUpdate = true;
    return texture;
}
let {
    albedo: albedoImageData, 
    outline: outlineImageData, 
} = await createStickerImages(url, 512, 512);
let albedo = texturize(albedoImageData);
let outline = texturize(outlineImageData);

const planeGeometry = new THREE.PlaneGeometry(1, 1);
const rawShader = new THREE.RawShaderMaterial({
    uniforms: {
        albedo: { value: albedo },
        outline: { value: outline },
        time: { value: Date.now() },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
});
const plane = new THREE.Mesh(planeGeometry, rawShader);
scene.add(plane);

camera.position.z = 1;
requestAnimationFrame(function animate() {
    requestAnimationFrame(animate);
    renderer.setClearColor(0x202020, 1);
    plane.rotation.y = Math.sin(Date.now() / 1000) * 0.5;
    rawShader.uniforms.time.value = plane.rotation.y;
    renderer.render(scene, camera);
});


