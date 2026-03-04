import { useEffect, useRef } from "react";
import * as THREE from "three";
import { engine, createTimeline, utils } from "animejs";

engine.useDefaultMainLoop = false;

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 20);
    const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // transparent
    container.appendChild(renderer.domElement);
    camera.position.z = 5;

    const cubes: THREE.Mesh[] = [];

    function createAnimatedCube() {
      // Blue/indigo palette for wireframe cubes
      const colors = [0x0284c7, 0x6366f1, 0x38bdf8, 0x818cf8, 0x0ea5e9, 0xa5b4fc];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: true });
      const cube = new THREE.Mesh(geometry, mat);

      const x = utils.random(-7, 7, 2);
      const y = utils.random(-4, 4, 2);
      const duration = utils.random(3000, 6000);

      const r = () => utils.random(-Math.PI * 2, Math.PI * 2, 3);

      createTimeline({
        delay: utils.random(0, duration),
        defaults: { loop: true, duration, ease: "inSine" },
      })
        .add(cube.position, { x, y, z: [-10, 7] }, 0)
        .add(cube.rotation, { x: r, y: r, z: r }, 0)
        .init();

      scene.add(cube);
      cubes.push(cube);
    }

    for (let i = 0; i < 40; i++) {
      createAnimatedCube();
    }

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    function render() {
      // Subtle camera parallax on mouse move
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      engine.update();
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(render);

    // Handle resize
    const handleResize = () => {
      const { width: w, height: h } = container.getBoundingClientRect();
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      cubes.forEach((c) => (c.material as THREE.Material).dispose());
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
