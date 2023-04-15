import * as THREE from 'three';

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
let roundrect = new THREE.ShapeGeometry(shape);
roundrect.translate(-w/2, -h/2, 0);
export default roundrect;