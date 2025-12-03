import React, { useEffect, useRef, useState } from 'react';
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
    constructor(textures) {
        this.mesh = new THREE.Object3D();

        const geo_cover = new THREE.BoxGeometry(2.4, 3, 0.05);
        const lmo_cover = new THREE.BoxGeometry(0.05, 3, 0.59);
        const ppr_cover = new THREE.BoxGeometry(2.3, 2.8, 0.5);

        const bookBackColor = 0xFF8000;

        const mat_cover = new THREE.MeshPhongMaterial({ map: textures.cover });
        const mat_lomo = new THREE.MeshPhongMaterial({ map: textures.spine });
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
    const booksRef = useRef([]);
    const animationIdRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const selectedBookRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const hoveredBookRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        console.log('BookScene useEffect running');

        // Variables
        let scene, camera, renderer, controls;
        const books = [];

        // Create World
        const _width = window.innerWidth;
        const _height = window.innerHeight;

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(Theme.primary, 15, 25);
        scene.background = null;
        sceneRef.current = scene;

        camera = new THREE.PerspectiveCamera(35, _width / _height, 1, 1000);
        camera.position.set(0, 0, 12);
        cameraRef.current = camera;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(_width, _height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        containerRef.current.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enableRotate = false;
        controls.update();
        controlsRef.current = controls;

        // Create Lights
        const hemiLight = new THREE.HemisphereLight(Theme.primary, Theme.darker, 1);
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
        dirLight.position.set(5, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        scene.add(hemiLight);
        scene.add(dirLight);

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const bookCoverTexture = textureLoader.load('/somivem-una-illa-cover.jpg');
        const bookLomoTexture = textureLoader.load('/somivem-una-illa-llom.jpg');

        // Create stacked books
        const numBooks = 12;
        const stackSpacing = 1;

        for (let i = 0; i < numBooks; i++) {
            const book = new CreateBook({
                cover: bookCoverTexture,
                spine: bookLomoTexture
            });

            // Position books in a horizontal stack (along z-axis)
            book.mesh.position.x = 0;
            book.mesh.position.y = (i - (numBooks - 1) / 2) * stackSpacing;
            book.mesh.position.z = 0;

            // Rotate to show spine (llom) facing camera
            book.mesh.rotation.x = -Math.PI / 2;
            book.mesh.rotation.y = 0;
            book.mesh.rotation.z = Math.PI * 1.5;

            // Store initial position and rotation
            book.initialPosition = book.mesh.position.clone();
            book.initialRotation = book.mesh.rotation.clone();
            book.index = i;

            scene.add(book.mesh);
            books.push(book);
        }

        booksRef.current = books;

        // Hover handler
        const onMouseMove = (event) => {
            if (isAnimatingRef.current || selectedBookRef.current) return;

            // Calculate mouse position in normalized device coordinates
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            // Calculate objects intersecting the picking ray
            const allMeshes = books.map(b => b.mesh);
            const intersects = raycasterRef.current.intersectObjects(allMeshes, true);

            if (intersects.length > 0) {
                // Find which book is being hovered
                let hoveredBook = null;
                for (let book of books) {
                    if (book.mesh === intersects[0].object.parent) {
                        hoveredBook = book;
                        break;
                    }
                }

                if (hoveredBook && hoveredBook !== hoveredBookRef.current) {
                    // Un-hover previous book
                    if (hoveredBookRef.current) {
                        gsap.to(hoveredBookRef.current.mesh.position, {
                            z: hoveredBookRef.current.initialPosition.z,
                            duration: 0.3,
                            ease: "power2.out"
                        });
                    }

                    // Hover new book
                    hoveredBookRef.current = hoveredBook;
                    gsap.to(hoveredBook.mesh.position, {
                        z: hoveredBook.initialPosition.z + 0.5,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            } else {
                // No book is being hovered, reset if there was a hovered book
                if (hoveredBookRef.current) {
                    gsap.to(hoveredBookRef.current.mesh.position, {
                        z: hoveredBookRef.current.initialPosition.z,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                    hoveredBookRef.current = null;
                }
            }
        };

        // Click handler
        const onMouseClick = (event) => {
            if (isAnimatingRef.current) return;

            // Calculate mouse position in normalized device coordinates
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            // Calculate objects intersecting the picking ray
            const allMeshes = books.map(b => b.mesh);
            const intersects = raycasterRef.current.intersectObjects(allMeshes, true);

            if (intersects.length > 0) {
                // Find which book was clicked
                let clickedBook = null;
                for (let book of books) {
                    if (book.mesh === intersects[0].object.parent) {
                        clickedBook = book;
                        break;
                    }
                }

                if (clickedBook) {
                    if (selectedBookRef.current === clickedBook) {
                        // Reset to stack view
                        resetToStack();
                    } else {
                        // Show this book
                        showBook(clickedBook);
                    }
                }
            }
        };

        const showBook = (selectedBook) => {
            isAnimatingRef.current = true;
            selectedBookRef.current = selectedBook;

            const timeline = gsap.timeline({
                onComplete: () => {
                    isAnimatingRef.current = false;
                }
            });

            // Move other books off-screen
            books.forEach((book) => {
                if (book !== selectedBook) {
                    timeline.to(book.mesh.position, {
                        z: book.index < selectedBook.index ? -10 : 10,
                        duration: 1,
                        ease: "power2.inOut"
                    }, 0);

                    timeline.to(book.mesh.material, {
                        opacity: 0,
                        duration: 0.8,
                        ease: "power2.inOut"
                    }, 0);
                }
            });

            // Animate selected book
            // Step 1: Move to center and rotate to side view
            timeline.to(selectedBook.mesh.position, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                ease: "power2.inOut"
            }, 0);

            timeline.to(selectedBook.mesh.rotation, {
                y: -Math.PI / 4,
                z: Math.PI / 2,
                duration: 0.8,
                ease: "power2.inOut"
            }, 0);

            // Step 2: Rotate to show cover (flat)
            timeline.to(selectedBook.mesh.rotation, {
                y: 0,
                z: 0,
                duration: 1,
                ease: "power2.inOut"
            }, 1);

            // Step 3: Scale up slightly
            timeline.to(selectedBook.mesh.scale, {
                x: 1.3,
                y: 1.3,
                z: 1.3,
                duration: 0.8,
                ease: "power2.out"
            }, 1.5);
        };

        const resetToStack = () => {
            isAnimatingRef.current = true;

            const timeline = gsap.timeline({
                onComplete: () => {
                    isAnimatingRef.current = false;
                    selectedBookRef.current = null;
                }
            });

            books.forEach((book) => {
                // Reset position
                timeline.to(book.mesh.position, {
                    x: book.initialPosition.x,
                    y: book.initialPosition.y,
                    z: book.initialPosition.z,
                    duration: 1,
                    ease: "power2.inOut"
                }, 0);

                // Reset rotation
                timeline.to(book.mesh.rotation, {
                    x: book.initialRotation.x,
                    y: book.initialRotation.y,
                    z: book.initialRotation.z,
                    duration: 1,
                    ease: "power2.inOut"
                }, 0);

                // Reset scale
                timeline.to(book.mesh.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 1,
                    ease: "power2.inOut"
                }, 0);

                // Reset opacity
                if (book.mesh.material.opacity !== undefined) {
                    timeline.to(book.mesh.material, {
                        opacity: 1,
                        duration: 0.8,
                        ease: "power2.inOut"
                    }, 0);
                }
            });
        };

        window.addEventListener('click', onMouseClick);
        window.addEventListener('mousemove', onMouseMove);

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
            window.removeEventListener('click', onMouseClick);
            window.removeEventListener('mousemove', onMouseMove);

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            gsap.killTweensOf('*');

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
