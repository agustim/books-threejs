import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const Theme = {
    primary: 0xd7dddd,
    secondary: 0x0000FF,
    danger: 0xFF0000,
    darker: 0x101010
};

class CreateBook {
    constructor({ title, author, resume, options }) {
        this.mesh = new THREE.Object3D();
        const textureLoader = new THREE.TextureLoader();
        this.title = title;
        this.author = author;
        this.resume = resume;

        const randomColor = () => {
            const number = Math.floor(Math.random() * 16777215).toString(16);
            if (number.length < 6) {
                // Pad with leading zeros if necessary
                return '#' + number.padStart(6, '0');
            }
            return '#' + number;
        };
        const randomTapaType = Math.random() < 0.5 ? 'tapa-dura' : 'tapa-tova';

        const randomMides = { width: Math.random() * 1 + 1.5, height: Math.random() * 1 + 2.5, depth: Math.random() * 0.5 + 0.3 };

        const mides_llibre = { ...randomMides, type: randomTapaType, 
            cover: randomColor(), 
            spine: randomColor(), 
            back: randomColor(), 
            paper: '#FFFFFF',
         ...options };


        // Si comença amb # és un color, sinó és una textura
        const coverTexture = (mides_llibre.cover.startsWith('#')) ? { color: mides_llibre.cover } : { map: textureLoader.load(mides_llibre.cover) };
        const spineTexture = (mides_llibre.spine.startsWith('#')) ? { color: mides_llibre.spine } : { map: textureLoader.load(mides_llibre.spine) };
        const backTexture = (mides_llibre.back.startsWith('#')) ? { color: mides_llibre.back } : { map: textureLoader.load(mides_llibre.back) };
        const paperTexture = (mides_llibre.paper.startsWith('#')) ? { color: mides_llibre.paper } : { map: textureLoader.load(mides_llibre.paper) };

        // Arreglem la portada perquè es vegi bé.
        if (mides_llibre.cover && !mides_llibre.cover.startsWith('#')) {
            coverTexture.map.center.set(0.5, 0.5);
            coverTexture.map.rotation = Math.PI;
        }

        let geo_cover_data, geo_lomo_data, geo_paper_data;

        if (mides_llibre.type === 'tapa-dura') {
            geo_cover_data = {width: mides_llibre.width, height: mides_llibre.height, depth: 0.05};
            geo_lomo_data = {width: 0.05, height: mides_llibre.height, depth: mides_llibre.depth - 0.01};
            geo_paper_data = {width: mides_llibre.width - 0.1, height: mides_llibre.height - 0.2, depth: mides_llibre.depth - 0.1};
        }
        if (mides_llibre.type === 'tapa-tova') {
            geo_cover_data = {width: mides_llibre.width, height: mides_llibre.height, depth: 0.02};
            geo_lomo_data = {width: 0.02, height: mides_llibre.height, depth: mides_llibre.depth - 0.01};
            geo_paper_data = {width: mides_llibre.width, height: mides_llibre.height, depth: mides_llibre.depth - 0.04};
        }

        const geo_cover = new THREE.BoxGeometry(geo_cover_data.width, geo_cover_data.height, geo_cover_data.depth);
        const lmo_cover = new THREE.BoxGeometry(geo_lomo_data.width, geo_lomo_data.height, geo_lomo_data.depth);
        const ppr_cover = new THREE.BoxGeometry(geo_paper_data.width, geo_paper_data.height, geo_paper_data.depth);


        const mat_cover = new THREE.MeshPhongMaterial(coverTexture);
        const mat_lomo = new THREE.MeshPhongMaterial(spineTexture);
        const mat_back = new THREE.MeshPhongMaterial(backTexture);
        const mat_paper = new THREE.MeshPhongMaterial(paperTexture);

        const _cover1 = new THREE.Mesh(geo_cover, mat_cover);
        const _cover2 = new THREE.Mesh(geo_cover, mat_back);
        const _lomo = new THREE.Mesh(lmo_cover, mat_lomo);
        const _paper = new THREE.Mesh(ppr_cover, mat_paper);

        [_cover1, _cover2, _lomo, _paper].forEach(mesh => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });

        _cover1.position.z = mides_llibre.depth / 2;
        _cover2.position.z = -mides_llibre.depth / 2;
        _lomo.position.x = mides_llibre.width / 2;

        this.mesh.add(_cover1, _cover2, _lomo, _paper);
    }
}

const BookScene = ({ onBookSelect }) => {
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
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        console.log('BookScene useEffect running');

        // Variables
        let scene, camera, renderer, controls;
        const books = [];

        // Book stack configuration
        const numBooks = 12;
        const stackSpacing = 1;

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

        // Calculate camera bounds based on book stack
        // First book at y=0, rest going down (negative Y)
        const minY = -(numBooks - 1) * stackSpacing - 2;
        const maxY = 0;

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
        const hemiLight = new THREE.HemisphereLight(Theme.primary, Theme.darker, 1.5);
        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 2);
        dirLight.position.set(5, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        // Add ambient light for overall brightness
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);

        scene.add(hemiLight);
        scene.add(dirLight);
        scene.add(ambientLight);

        const booksDefine = [
        {
            title: "Somaivem una illa",
            author: "Roc Casagran",
            resume: "Somiàvem una illa, la novel·la guanyadora del Premi Sant Jordi 2024, no és altra cosa que una carta que la Carla, una noia que voreja els quaranta i està en plena crisi existencial, escriu a l’Òscar, la seva parella. És una carta llarga, complexa, honesta i que constantment utilitza la història de vuit illes remotes per lligar tot allò que hi exposa.",
            options: {
                type: 'tapa-dura',
                cover: '/somaivem-una-illa-cover.jpg',
                spine: '/somaivem-una-illa-llom.jpg',
                back: '#ff8000',
                paper: '#FFFFFF',
                width: 3.5,
                height: 4.8,
                depth: 0.5
            }
        },
        {
            title: "El dia que vaig deixar de pensar en tu",
            author: "Albert Forns",
            resume: "El dia que vaig deixar de pensar en tu, la novel·la guanyadora del Premi Llibreter 2024, és un relat que es mou entre el present i el passat, entre la Barcelona actual i la ciutat dels anys vuitanta. El protagonista, en Martí, és un jove que viu a Barcelona i que es veu immers en una crisi personal després de la mort del seu pare. A través de les seves reflexions i records, el llibre explora temes com la memòria, la identitat i les relacions familiars.",
            options: {
                type: 'tapa-tova',
                cover: '#ff8000',
                spine: '#0080ff',
                back: '#0080ff',
                paper: '#FFFFFF'
            }
        }];  

        // mentre numBooks < books.length, omplim amb llibres ficticis
        while (booksDefine.length < numBooks) {
            booksDefine.push({
                title: `Book ${booksDefine.length + 1}`,
            });
        }

        console.log('Books created:', books);
        // Create stacked books
        for (let i = 0; i < numBooks; i++) {
            const book = new CreateBook(booksDefine[i]);
            // Position books starting from y=0 (first book at center) going down
            book.mesh.position.x = 0;
            book.mesh.position.y = -i * stackSpacing;
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
            const allMeshes = books.map(b => b.mesh).filter(mesh => mesh !== undefined && mesh !== null);
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
            const allMeshes = books.map(b => b.mesh).filter(mesh => mesh !== undefined && mesh !== null);
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

            // Show book info via callback
            if (onBookSelect) {
                onBookSelect({
                    title: selectedBook.title,
                    author: selectedBook.author,
                    resume: selectedBook.resume
                });
            }

            // Move camera to the book's Y position
            const bookY = selectedBook.initialPosition.y;
            console.log('Animating camera to Y:', bookY);

            // Animate camera to book position
            gsap.to(camera.position, {
                y: bookY,
                duration: 1,
                ease: "power2.inOut"
            });

            gsap.to(controls.target, {
                y: bookY,
                duration: 1,
                ease: "power2.inOut",
                onUpdate: () => {
                    controls.update();
                }
            });

            const timeline = gsap.timeline({
                onComplete: () => {
                    isAnimatingRef.current = false;
                }
            });

            // Move other books off-screen
            books.forEach((book) => {
                if (book !== selectedBook) {
                    // Books above (higher index, more negative Y) move up (more negative)
                    // Books below (lower index, less negative Y) move down (more positive)
                    const direction = book.index > selectedBook.index ? -10 : 10;

                    timeline.to(book.mesh.position, {
                        y: book.initialPosition.y + direction,
                        duration: 1,
                        ease: "power2.inOut"
                    }, 0);

                    // Animate opacity for all child meshes
                    book.mesh.traverse((child) => {
                        if (child.isMesh && child.material) {
                            timeline.to(child.material, {
                                opacity: 0,
                                duration: 0.8,
                                ease: "power2.inOut"
                            }, 0);
                        }
                    });
                }
            });

            // Animate selected book
            // Step 1: Move to center and rotate to side view
            timeline.to(selectedBook.mesh.position, {
                x: 0,
                y: bookY,
                z: 0,
                duration: 1,
                ease: "power2.inOut"
            }, 0);

            // Rotate from spine view to angled view
            timeline.to(selectedBook.mesh.rotation, {
                x: -Math.PI / 4,
                y: 0,
                z: -Math.PI / 4,
                duration: 0.8,
                ease: "power2.inOut"
            }, 0);

            // Step 2: Rotate to show cover (flat)
            timeline.to(selectedBook.mesh.rotation, {
                x: -0.3,
                y: 0,
                z: Math.PI,
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

            // Hide book info via callback
            if (onBookSelect) {
                onBookSelect(null);
            }

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

                // Reset opacity for all materials
                book.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        timeline.to(child.material, {
                            opacity: 1,
                            duration: 0.8,
                            ease: "power2.inOut"
                        }, 0);
                    }
                });
            });
        };

        // Window scroll handler
        const onScroll = () => {
            // Don't update camera if a book is selected
            if (selectedBookRef.current) return;

            const scrollY = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = scrollY / maxScroll;

            // Map scroll percent to camera Y position
            const newY = minY + (1 - scrollPercent) * (maxY - minY);

            setScrollPosition(scrollPercent);

            // Move both camera and target
            camera.position.y = newY;
            controls.target.y = newY;
            controls.update();
        };

        window.addEventListener('click', onMouseClick);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('scroll', onScroll);

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
            window.removeEventListener('scroll', onScroll);

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

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'fixed', pointerEvents: 'auto' }} />
    );
};

export default BookScene;
