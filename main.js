import './style.css';
import * as THREE from 'three';

import createStickerImages from './sticker.js'

import vertexShader from './shader/vertexShader';
import fragmentShader from './shader/fragmentShader';
import touchmaster95 from './touchmaster95';

const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

let width = Math.min(window.innerWidth, 512);
let height = width;

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    width = Math.min(window.innerWidth, 512);
    height = width;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
renderer.setSize(width, height);
  
let url = 'https://media.discordapp.net/attachments/530169777843339265/1096691745917509642/image.png';
let texturize = (imageData) => {
    const texture = new THREE.Texture(imageData)
    texture.needsUpdate = true;
    return texture;
}
let {
    albedo: albedoImageData, 
    outline: outlineImageData, 
    alphaMap: alphaMapImageData,
} = await createStickerImages(url, 512, 512);
let albedo = texturize(albedoImageData);
let alphaMap = texturize(alphaMapImageData);
let outline = texturize(outlineImageData);

let x = 0, y = 0, w = 1, h = 1, radius = 0.04
const shape = new THREE.Shape();
shape.moveTo(x, y + radius);
shape.lineTo(x, y + h - radius);
shape.quadraticCurveTo(x, y + h, x + radius, y + h);
shape.lineTo(x + w - radius, y + h);
shape.quadraticCurveTo(x + w, y + h, x + w, y + h - radius);
shape.lineTo(x + w, y + radius);
shape.quadraticCurveTo(x + w, y, x + w - radius, y);
shape.lineTo(x + radius, y);
shape.quadraticCurveTo(x, y, x, y + radius);
const roundrect = new THREE.ShapeGeometry(shape);
roundrect.translate(-w/2, -h/2, 0);

const stickerMaterial = new THREE.RawShaderMaterial({
    uniforms: {
        albedo: { value: albedo },
        outline: { value: outline },
        time: { value: Date.now() },
    },
    transparent: true,
    fragmentShader,
    vertexShader,
});
const stickerOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0xF9FEFF, alphaMap: alphaMap, transparent: true, side: THREE.DoubleSide});
const plane = new THREE.Group();
const stickermesh = new THREE.Mesh(roundrect, stickerMaterial);
const outlinemesh = new THREE.Mesh(roundrect, stickerOutlineMaterial);
outlinemesh.position.z = -0.001;
outlinemesh.scale.x = outlinemesh.scale.y = 1.06;
plane.add(stickermesh);
plane.add(outlinemesh);
scene.add(plane);

requestAnimationFrame(function animate() {
    requestAnimationFrame(animate);
    renderer.setClearColor(0x202020, 1);
    stickerMaterial.uniforms.time.value = plane.rotation.y;
    renderer.render(scene, camera);
});

touchmaster95(renderer.domElement, {
    useSpring: true,
    minZoom: 0.5,
    maxZoom: 2,
}, ({ x, zoom }) => {
    plane.rotation.y = x/100;
    camera.position.z = 3;
});