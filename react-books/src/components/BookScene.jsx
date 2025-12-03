import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const Theme = {
    primary: 0xd7dddd,
    secundary: 0x0000FF,
    danger: 0xFF0000,
    darker: 0x101010
};

class CreateBook {
    constructor() {
        this.mesh = new THREE.Object3D();

        const geo_cover = new THREE.BoxGeometry(2.4, 3, 0.05);
        const lmo_cover = new THREE.BoxGeometry(0.05, 3, 0.59);
        const ppr_cover = new THREE.BoxGeometry(2.3, 2.8, 0.5);

        const textureLoader = new THREE.TextureLoader();
        const bookCoverTexture = textureLoader.load('/somivem-una-illa-cover.jpg');
        const bookLomoTexture = textureLoader.load('/somivem-una-illa-llom.jpg');

        //const bookColor = 0xffffff;
        const bookBackColor = 0xFF8000;


        const mat_cover = new THREE.MeshPhongMaterial({ map: bookCoverTexture });
        const mat_lomo = new THREE.MeshPhongMaterial({ map: bookLomoTexture });
        const mat_back = new THREE.MeshPhongMaterial({ color: bookBackColor });
        const mat_paper = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

        const _cover1 = new THREE.Mesh(geo_cover, mat_cover);
        const _cover2 = new THREE.Mesh(geo_cover, mat_back);
        const _lomo = new THREE.Mesh(lmo_cover, mat_lomo);
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

const BookScene = () => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const groupRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        console.log('BookScene useEffect running');

        // Variables
        let scene, camera, renderer, controls;
        const _group = new THREE.Group();
        groupRef.current = _group;

        // Create World
        const _width = window.innerWidth;
        const _height = window.innerHeight;

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(Theme.primary, 9, 13);
        scene.background = null;
        sceneRef.current = scene;

        camera = new THREE.PerspectiveCamera(35, _width / _height, 1, 1000);
        camera.position.set(0, 0, 10);
        cameraRef.current = camera;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(_width, _height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        containerRef.current.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.update();
        controlsRef.current = controls;

        // Create Lights
        const hemiLight = new THREE.HemisphereLight(Theme.primary, Theme.darker, 1);
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        dirLight.position.set(10, 20, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 5000;
        dirLight.shadow.mapSize.height = 5000;
        dirLight.penumbra = 0.8;

        scene.add(hemiLight);
        scene.add(dirLight);

        // Helper function
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

        // Create Primitives
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

            // GSAP Animation - TweenMax style
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

        // Window Resize
        const onWindowResize = () => {
            if (!camera || !renderer) return;
            const _width = window.innerWidth;
            const _height = window.innerHeight;
            renderer.setSize(_width, _height);
            camera.aspect = _width / _height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', onWindowResize, false);

        // Animation Loop
        const animation = () => {
            _group.rotation.x -= 0.003;
            _group.rotation.y -= 0.003;
            _group.rotation.z -= 0.003;

            controls.update();
            renderer.render(scene, camera);
            animationIdRef.current = requestAnimationFrame(animation);
        };

        console.log('Starting animation loop');
        animation();

        // Cleanup
        return () => {
            console.log('BookScene cleanup');
            window.removeEventListener('resize', onWindowResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            gsap.killTweensOf(_group);

            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }

            if (scene) {
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
            }
            if (renderer) renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />;
};

export default BookScene;
