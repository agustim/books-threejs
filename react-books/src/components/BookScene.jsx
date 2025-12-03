import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const BookScene = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const Theme = {
            primary: 0xd7dddd,
            secundary: 0x0000FF,
            danger: 0xFF0000,
            darker: 0x101010
        };

        let scene, camera, renderer, controls;
        const _group = new THREE.Group();
        let animationId;

        const init = () => {
            createWorld();
            createLights();
            createPrimitive();
            animation();
        };

        const createWorld = () => {
            const _width = window.innerWidth;
            const _height = window.innerHeight; // Use window height for full screen

            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(Theme.primary, 9, 13);
            scene.background = null;

            camera = new THREE.PerspectiveCamera(35, _width / _height, 1, 1000);
            camera.position.set(0, 0, 10);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(_width, _height);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Append to ref instead of ID
            containerRef.current.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableZoom = false;
            controls.update();

            window.addEventListener('resize', onWindowResize, false);
        };

        const onWindowResize = () => {
            const _width = window.innerWidth;
            const _height = window.innerHeight;
            renderer.setSize(_width, _height);
            camera.aspect = _width / _height;
            camera.updateProjectionMatrix();
        };

        const createLights = () => {
            const hemiLight = new THREE.HemisphereLight(Theme.primary, Theme.darker, 1);
            const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
            dirLight.position.set(10, 20, 20);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 5000;
            dirLight.shadow.mapSize.height = 5000;
            dirLight.penumbra = 0.8;

            scene.add(hemiLight);
            scene.add(dirLight);
        };

        class CreateBook {
            constructor() {
                this.mesh = new THREE.Object3D();

                const geo_cover = new THREE.BoxGeometry(2.4, 3, 0.05);
                const lmo_cover = new THREE.BoxGeometry(0.05, 3, 0.59);
                const ppr_cover = new THREE.BoxGeometry(2.3, 2.8, 0.5);

                // const dartmouthGreens = [0x475b47]; // Unused in original but present
                const yellow = 0xFFFFFF; // Original code used 'yellow' variable but it wasn't defined in the snippet provided, assuming white or defined elsewhere. 
                // Wait, looking at original code: `const mat = new THREE.MeshPhongMaterial({ color: yellow });`
                // `yellow` is not defined in the provided snippet. I'll use a default color or check if I missed it.
                // In the original snippet, `yellow` is NOT defined. It might be a global or just missing.
                // However, `Theme.primary` is 0xd7dddd.
                // Let's use a placeholder color, maybe a nice yellow/orange or just white.
                // Actually, looking at the screenshot/description, it's "books".
                // I'll define a yellow color.
                const bookColor = 0xFFD700;

                const mat = new THREE.MeshPhongMaterial({ color: bookColor });
                const mat_paper = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

                const _cover1 = new THREE.Mesh(geo_cover, mat);
                const _cover2 = new THREE.Mesh(geo_cover, mat);
                const _lomo = new THREE.Mesh(lmo_cover, mat);
                const _paper = new THREE.Mesh(ppr_cover, mat_paper);

                [_cover1, _cover2, _lomo, _paper].forEach(mesh => {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                });

                _cover1.position.z = 0.3;
                _cover2.position.z = -0.3;
                _lomo.position.x = 2.4 / 2;

                this.mesh.add(_cover1, _cover2, _lomo, _paper);
            }
        }

        const isTooClose = (newObj, others, minDistance = 1.5) => {
            const newPos = newObj.position;
            for (let existing of others) {
                const dx = newPos.x - existing.position.x;
                const dy = newPos.y - existing.position.y;
                const dz = newPos.z - existing.position.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < minDistance) return true;
            }
            return false;
        };

        const createPrimitive = () => {
            const placedBooks = [];
            const a = 2;

            for (let i = 0; i < 12; i++) {
                const _object = new CreateBook();
                const s = 0.1 + Math.random() * 0.4;
                _object.mesh.scale.set(s, s, s);

                let tries = 0;
                do {
                    _object.mesh.position.x = (Math.random() - 0.5) * a * 2;
                    _object.mesh.position.y = (Math.random() - 0.5) * a * 2;
                    _object.mesh.position.z = (Math.random() - 0.5) * a * 2;
                    tries++;
                } while (isTooClose(_object.mesh, placedBooks) && tries < 20);

                _object.mesh.rotation.x = Math.random() * 2 * Math.PI;
                _object.mesh.rotation.y = Math.random() * 2 * Math.PI;
                _object.mesh.rotation.z = Math.random() * 2 * Math.PI;

                gsap.to(_object.mesh.rotation, {
                    duration: 8 + Math.random() * 8,
                    x: (Math.random() - 0.5) * 0.5,
                    y: (Math.random() - 0.5) * 0.5,
                    z: (Math.random() - 0.5) * 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut",
                    delay: 0.05 * i
                });

                _group.add(_object.mesh);
                placedBooks.push(_object.mesh);
            }

            scene.add(_group);
            _group.position.x = 2;
        };

        const animation = () => {
            _group.rotation.x -= 0.003;
            _group.rotation.y -= 0.003;
            _group.rotation.z -= 0.003;
            controls.update();
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animation);
        };

        init();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            cancelAnimationFrame(animationId);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            // Clean up Three.js resources if needed
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />;
};

export default BookScene;
