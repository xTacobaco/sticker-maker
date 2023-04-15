import './style.css';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import roundrect from './roundrect';
import touchmaster95 from './touchmaster95';
import createStickerImages from './sticker';

import vertexShader from './shader/vertexShader';
import fragmentShader from './shader/fragmentShader';

const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

let width = Math.min(window.innerWidth, 512);
let height = width;

window.addEventListener('resize', onWindowResize, false);

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
const stripedTexture = new THREE.TextureLoader().load('stripes.png');
stripedTexture.repeat.set(0.5, 0.5);
const backsideMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, map: stripedTexture, alphaMap: alphaMap, transparent: true, side: THREE.DoubleSide, opacity: 0.2});
const plane = new THREE.Group();
const stickermesh = new THREE.Mesh(roundrect, stickerMaterial);
const outlinemesh = new THREE.Mesh(roundrect, stickerOutlineMaterial);
const backsidemesh = new THREE.Mesh(roundrect, backsideMaterial);
backsidemesh.position.z = -0.002;
outlinemesh.position.z = -0.001;
outlinemesh.scale.x = outlinemesh.scale.y = 1.06;
backsidemesh.scale.x = backsidemesh.scale.y = 1.06;
plane.add(stickermesh);
plane.add(outlinemesh);
plane.add(backsidemesh);
const loader = new FontLoader();
await loader.load( 'fonts/helvetiker_bold.typeface.json', function ( font ) {
	const title = new TextGeometry( 'Sticker Name', {
		font: font,
		size: 0.06,
		height: 0.001,
	});
    title.center();
    const titleMesh = new THREE.Mesh(title, new THREE.MeshBasicMaterial({ color: 0x404040 }));
    titleMesh.position.z = -0.002;
    titleMesh.position.y = 0.2;
    titleMesh.rotation.y = Math.PI;
    plane.add(titleMesh);

    const date = new TextGeometry(new Date().toDateString(), {
		font: font,
		size: 0.05,
		height: 0.001,
	});
    date.center();
    const dateMesh = new THREE.Mesh(date, new THREE.MeshBasicMaterial({ color: 0x404040 }));
    dateMesh.position.z = -0.002;
    dateMesh.position.y = 0;
    dateMesh.rotation.y = Math.PI;
    plane.add(dateMesh);
});
scene.add(plane);

requestAnimationFrame(function animate() {
    requestAnimationFrame(animate);
    renderer.setClearColor(0x202020, 1);
    plane.rotation.y += Math.sin(Date.now()/1000 * 2)/5;
    stickerMaterial.uniforms.time.value = plane.rotation.y;
    stickerMaterial.uniforms.albedo.value = albedo;
    stickerMaterial.uniforms.outline.value = outline;
    backsideMaterial.alphaMap = alphaMap;
    outlinemesh.material.alphaMap = alphaMap;
    renderer.render(scene, camera);
});

touchmaster95(renderer.domElement, {
    useSpring: true,
    minZoom: 0.5,
    maxZoom: 2,
}, ({ x }) => {
    plane.rotation.y = x/100;
    camera.position.z = 3;
});

let button = document.createElement('button');
button.innerHTML = 'Change Sticker';
button.addEventListener('click', async () => {
    url = window.prompt('Image url', url);
    let {
        albedo: albedoImageData, 
        outline: outlineImageData, 
        alphaMap: alphaMapImageData,
    } = await createStickerImages(url, 512, 512);
    albedo = texturize(albedoImageData);
    alphaMap = texturize(alphaMapImageData);
    outline = texturize(outlineImageData);
});
document.body.append(button);