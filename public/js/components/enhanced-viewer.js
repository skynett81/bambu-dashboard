/**
 * Enhanced 3D Viewer — Three.js-based 3MF model viewer
 * Supports multi-mesh, per-mesh colors, materials, smooth shading
 * Lazy-loads Three.js on first use to avoid page load overhead
 */
(function () {
  let THREE = null;
  let OrbitControls = null;
  let _loadPromise = null;

  async function loadThreeJS() {
    if (THREE) return;
    if (_loadPromise) return _loadPromise;
    _loadPromise = (async () => {
      THREE = await import('/js/lib/three.module.min.js');
      const controls = await import('/js/lib/OrbitControls.js');
      OrbitControls = controls.OrbitControls;
    })();
    return _loadPromise;
  }

  // Default colors for meshes without material color
  const PALETTE = [
    [0.95, 0.65, 0.25], // orange
    [0.30, 0.70, 0.90], // sky blue
    [0.60, 0.85, 0.40], // green
    [0.90, 0.35, 0.45], // red
    [0.70, 0.50, 0.85], // purple
    [0.95, 0.85, 0.35], // yellow
    [0.50, 0.80, 0.75], // teal
    [0.85, 0.55, 0.70], // pink
  ];

  class EnhancedViewer {
    /**
     * @param {HTMLElement|string} container
     * @param {Object} [opts]
     * @param {boolean} [opts.transparent] - transparent background (for print preview overlay)
     * @param {boolean} [opts.autoRotate] - enable auto-rotation (default false)
     * @param {boolean} [opts.printMode] - optimized for live print view (clipping, layer colors)
     */
    constructor(container, opts = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this._opts = opts;
      this._scene = null;
      this._camera = null;
      this._renderer = null;
      this._controls = null;
      this._animId = null;
      this._meshGroup = null;
      this._gridHelper = null;
      this._disposed = false;
      this._ready = false;
      // Print progress state
      this._clipPlane = null;
      this._modelMinY = 0;
      this._modelMaxY = 1;
      this._cutY = 100;
      this._autoRotate = opts.autoRotate || false;
      this._dragging = false;
      // Layer color texture
      this._layerTex = null;
      this._useLayerTex = false;
      this._baseColor = null;
    }

    async init() {
      await loadThreeJS();
      if (this._disposed) return;

      const w = this.container.clientWidth || 400;
      const h = this.container.clientHeight || 300;

      // Scene
      this._scene = new THREE.Scene();
      if (this._opts.transparent) {
        this._scene.background = null;
      } else {
        this._scene.background = new THREE.Color(0x1a1a2e);
      }

      // Camera
      this._camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
      this._camera.position.set(150, 120, 200);

      // Renderer
      this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!this._opts.transparent });
      this._renderer.setSize(w, h);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this._renderer.shadowMap.enabled = false;
      this.container.appendChild(this._renderer.domElement);

      // Controls
      this._controls = new OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = true;
      this._controls.dampingFactor = 0.08;
      this._controls.minDistance = 5;
      this._controls.maxDistance = 1500;

      // Track user interaction to pause auto-rotate
      this._renderer.domElement.addEventListener('pointerdown', () => { this._dragging = true; this._autoRotate = false; });
      this._renderer.domElement.addEventListener('pointerup', () => { this._dragging = false; });

      // Lighting — 3-point setup
      const ambient = new THREE.AmbientLight(0x404060, 0.6);
      this._scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 1.0);
      key.position.set(200, 300, 200);
      this._scene.add(key);

      const fill = new THREE.DirectionalLight(0x8888cc, 0.4);
      fill.position.set(-150, 100, -100);
      this._scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffffff, 0.3);
      rim.position.set(0, -100, -200);
      this._scene.add(rim);

      // Build plate grid
      this._addBuildPlate();

      // Mesh group
      this._meshGroup = new THREE.Group();
      this._scene.add(this._meshGroup);

      // Clipping plane for print progress (clips above cutY)
      this._clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10000);
      this._renderer.localClippingEnabled = true;

      // Resize observer
      this._resizeObserver = new ResizeObserver(() => this._onResize());
      this._resizeObserver.observe(this.container);

      this._ready = true;
      this._startLoop();
    }

    _addBuildPlate() {
      // Fine grid
      const fineGrid = new THREE.GridHelper(300, 60, 0x2a2a3e, 0x2a2a3e);
      fineGrid.material.opacity = 0.3;
      fineGrid.material.transparent = true;
      this._scene.add(fineGrid);

      // Coarse grid
      const coarseGrid = new THREE.GridHelper(300, 12, 0x3a3a5e, 0x3a3a5e);
      coarseGrid.material.opacity = 0.5;
      coarseGrid.material.transparent = true;
      this._scene.add(coarseGrid);

      // Build plate surface
      const plateGeo = new THREE.PlaneGeometry(300, 300);
      const plateMat = new THREE.MeshPhongMaterial({
        color: 0x222240,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = -0.1;
      this._scene.add(plate);
    }

    /**
     * Load model data from API response
     * @param {Object} data - { meshes: [...], buildItems, materials, colorGroups, metadata }
     */
    loadModel(data) {
      if (!this._ready || !data) return;
      this._clearMeshes();

      const { meshes, buildItems, materials } = data;
      if (!meshes || meshes.length === 0) return;

      // Build material color lookup
      const matColorMap = new Map();
      if (materials) {
        for (const mat of materials) {
          matColorMap.set(`${mat.groupId}_${mat.index}`, mat.color);
        }
      }

      // Determine mesh colors from materials or palette
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        const verts = mesh.vertices instanceof Float32Array ? mesh.vertices : new Float32Array(mesh.vertices);
        const tris = mesh.triangles instanceof Uint32Array ? mesh.triangles : new Uint32Array(mesh.triangles);

        if (verts.length === 0 || tris.length === 0) continue;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geometry.setIndex(new THREE.BufferAttribute(tris, 1));
        geometry.computeVertexNormals();

        // Pick color: material color > mesh color > palette
        let color;
        if (mesh.materialColor) {
          const c = mesh.materialColor;
          color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
        } else {
          const p = PALETTE[i % PALETTE.length];
          color = new THREE.Color(p[0], p[1], p[2]);
        }

        const material = new THREE.MeshPhongMaterial({
          color,
          flatShading: false,
          side: THREE.DoubleSide,
          shininess: 40,
          specular: new THREE.Color(0x222222),
          clippingPlanes: this._clipPlane ? [this._clipPlane] : [],
        });

        const threeMesh = new THREE.Mesh(geometry, material);
        threeMesh.name = mesh.name || `Mesh_${i}`;

        // Apply build item transform if available
        const buildItem = buildItems?.find(bi => bi.meshIndex === i);
        if (buildItem?.transform) {
          const t = buildItem.transform;
          const mat4 = new THREE.Matrix4();
          // lib3mf transform is column-major 4x3 (12 elements):
          // [m00, m01, m02, m10, m11, m12, m20, m21, m22, tx, ty, tz]
          mat4.set(
            t[0], t[3], t[6], t[9],
            t[1], t[4], t[7], t[10],
            t[2], t[5], t[8], t[11],
            0, 0, 0, 1
          );
          threeMesh.applyMatrix4(mat4);
        }

        this._meshGroup.add(threeMesh);
      }

      this._fitCameraToModel();
    }

    /**
     * Load combined model data (backward compat with existing getModel response)
     * @param {Object} data - { vertices, triangles, color, meta }
     */
    loadCombinedModel(data) {
      if (!this._ready || !data) return;
      this._clearMeshes();

      const verts = data.vertices instanceof Float32Array ? data.vertices : new Float32Array(data.vertices);
      const tris = data.triangles instanceof Uint32Array ? data.triangles : new Uint32Array(data.triangles);

      if (verts.length === 0 || tris.length === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geometry.setIndex(new THREE.BufferAttribute(tris, 1));
      geometry.computeVertexNormals();

      const color = data.color
        ? new THREE.Color(data.color[0], data.color[1], data.color[2])
        : new THREE.Color(PALETTE[0][0], PALETTE[0][1], PALETTE[0][2]);

      const material = new THREE.MeshPhongMaterial({
        color,
        flatShading: false,
        side: THREE.DoubleSide,
        shininess: 40,
        specular: new THREE.Color(0x222222),
        clippingPlanes: this._clipPlane ? [this._clipPlane] : [],
      });

      const mesh = new THREE.Mesh(geometry, material);
      this._meshGroup.add(mesh);
      this._fitCameraToModel();
    }

    _clearMeshes() {
      if (!this._meshGroup) return;
      while (this._meshGroup.children.length > 0) {
        const child = this._meshGroup.children[0];
        child.geometry?.dispose();
        child.material?.dispose();
        this._meshGroup.remove(child);
      }
    }

    /**
     * Load gcode toolpath data (line segments with per-layer colors)
     * @param {Object} data - { layers: [{ z, segments: [x1,y1,z1,x2,y2,z2,...] }], bounds }
     */
    loadToolpath(data) {
      if (!this._ready || !data || !data.layers) return;
      this._clearMeshes();

      // Count total vertices (each segment = 2 vertices × 3 coords)
      let totalVerts = 0;
      for (const layer of data.layers) totalVerts += layer.segments.length; // already x,y,z pairs

      if (totalVerts === 0) return;

      const positions = new Float32Array(totalVerts);
      const colors = new Float32Array(totalVerts);

      // Color palette: gradient blue (bottom) → cyan → green → yellow → red (top)
      let offset = 0;
      for (let li = 0; li < data.layers.length; li++) {
        const t = data.layers.length > 1 ? li / (data.layers.length - 1) : 0.5;

        // Rainbow-ish gradient
        let r, g, b;
        if (t < 0.25) {
          r = 0.1; g = 0.3 + t * 2.8; b = 1.0 - t * 2;
        } else if (t < 0.5) {
          r = (t - 0.25) * 4; g = 1.0; b = 0.3 - (t - 0.25) * 1.2;
        } else if (t < 0.75) {
          r = 1.0; g = 1.0 - (t - 0.5) * 3; b = 0;
        } else {
          r = 1.0; g = 0.25 - (t - 0.75) * 0.8; b = 0;
        }

        const segs = data.layers[li].segments;
        for (let j = 0; j < segs.length; j += 3) {
          // Gcode: X=horizontal, Y=horizontal, Z=up
          // Three.js: X=right, Y=up, Z=forward
          positions[offset] = segs[j];       // X → X
          positions[offset + 1] = segs[j + 2]; // Z → Y (up)
          positions[offset + 2] = -segs[j + 1]; // Y → -Z (forward)
          colors[offset] = r;
          colors[offset + 1] = g;
          colors[offset + 2] = b;
          offset += 3;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 1,
        clippingPlanes: this._clipPlane ? [this._clipPlane] : [],
      });

      const lineSegs = new THREE.LineSegments(geometry, material);
      lineSegs.name = 'toolpath';
      this._meshGroup.add(lineSegs);
      this._fitCameraToModel();
    }

    _fitCameraToModel() {
      if (!this._meshGroup || this._meshGroup.children.length === 0) return;

      const box = new THREE.Box3().setFromObject(this._meshGroup);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 1.8;

      // Center model on build plate (Y=0)
      this._meshGroup.position.set(-center.x, -box.min.y, -center.z);

      // Recompute bounds after repositioning for accurate clipping
      const newBox = new THREE.Box3().setFromObject(this._meshGroup);
      this._modelMinY = newBox.min.y;
      this._modelMaxY = newBox.max.y;
      this._cutY = this._modelMaxY + 1; // show full model by default

      if (this._clipPlane) {
        this._clipPlane.constant = this._cutY;
      }

      this._camera.position.set(dist * 0.7, dist * 0.5, dist * 0.8);
      this._controls.target.set(0, size.y * 0.4, 0);
      this._controls.update();
    }

    _onResize() {
      if (!this._renderer || this._disposed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w === 0 || h === 0) return;
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(w, h);
    }

    _startLoop() {
      if (this._animId || this._disposed) return;
      const render = () => {
        if (this._disposed) return;
        this._animId = requestAnimationFrame(render);
        // Auto-rotation
        if (this._autoRotate && this._controls && !this._dragging) {
          this._controls.autoRotate = true;
          this._controls.autoRotateSpeed = 1.0;
        } else if (this._controls) {
          this._controls.autoRotate = false;
        }
        this._controls.update();
        this._renderer.render(this._scene, this._camera);
      };
      render();
    }

    /**
     * Get model info for metadata display
     */
    getModelInfo() {
      if (!this._meshGroup || this._meshGroup.children.length === 0) return null;
      const box = new THREE.Box3().setFromObject(this._meshGroup);
      const size = box.getSize(new THREE.Vector3());
      let totalTris = 0;
      let totalVerts = 0;
      const meshNames = [];
      this._meshGroup.traverse(child => {
        if (child.isMesh) {
          const geo = child.geometry;
          totalTris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
          totalVerts += geo.attributes.position.count / 3;
          meshNames.push(child.name);
        }
      });
      return {
        dimensions: { x: +size.x.toFixed(1), y: +size.y.toFixed(1), z: +size.z.toFixed(1) },
        triangleCount: Math.round(totalTris),
        vertexCount: Math.round(totalVerts),
        meshCount: meshNames.length,
        meshNames,
      };
    }

    // ---- Print progress API (compatible with ModelViewer) ----

    /**
     * Set print progress (0-1) — clips model above this Y percentage
     */
    setProgress(p) {
      if (!this._ready) return;
      if (p <= 0 || p > 1 || !isFinite(this._modelMinY)) {
        this._cutY = this._modelMaxY + 1;
      } else {
        this._cutY = this._modelMinY + p * (this._modelMaxY - this._modelMinY);
      }
      // Update clipping plane
      if (this._clipPlane) {
        this._clipPlane.constant = this._cutY;
      }
      // Green edge glow at cut height
      this._updateCutEdge();
    }

    _updateCutEdge() {
      // Remove old edge
      const old = this._scene?.getObjectByName('_cutEdge');
      if (old) { old.geometry?.dispose(); old.material?.dispose(); this._scene.remove(old); }

      if (!this._ready || this._cutY >= this._modelMaxY) return;

      const edgeGeo = new THREE.PlaneGeometry(500, 500);
      const edgeMat = new THREE.MeshBasicMaterial({
        color: 0x00e676,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.name = '_cutEdge';
      edgeMesh.rotation.x = -Math.PI / 2;
      edgeMesh.position.y = this._cutY;
      this._scene.add(edgeMesh);
    }

    /**
     * Set per-layer color map for multi-color rendering
     * @param {Array} layerColors - [layerIndex] = [r, g, b] (0-1)
     * @param {number} totalLayers
     */
    setLayerColors(layerColors, totalLayers) {
      if (!this._ready || !layerColors || layerColors.length === 0) return;
      this._useLayerTex = true;

      const texWidth = Math.max(totalLayers, layerColors.length, 1);

      // Build color-per-Y lookup and apply to mesh vertex colors
      this._meshGroup.traverse(child => {
        if (!child.isMesh) return;
        const geo = child.geometry;
        const positions = geo.attributes.position;
        if (!positions) return;

        const count = positions.count;
        const colors = new Float32Array(count * 3);
        let lastR = 0.6, lastG = 0.6, lastB = 0.6;

        for (let i = 0; i < count; i++) {
          const y = positions.getY(i);
          // Map Y position to layer index
          const t = (this._modelMaxY > this._modelMinY)
            ? (y - this._modelMinY) / (this._modelMaxY - this._modelMinY)
            : 0;
          const layerIdx = Math.min(Math.floor(t * texWidth), texWidth - 1);
          const c = layerColors[layerIdx];
          if (c) { lastR = c[0]; lastG = c[1]; lastB = c[2]; }
          colors[i * 3] = lastR;
          colors[i * 3 + 1] = lastG;
          colors[i * 3 + 2] = lastB;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        child.material.vertexColors = true;
        child.material.needsUpdate = true;
      });
    }

    /**
     * Set uniform base color for untracked layers
     * @param {Array} rgb - [r, g, b] (0-1)
     */
    setColor(rgb) {
      if (!rgb || rgb.length !== 3) return;
      this._baseColor = rgb;
      if (!this._useLayerTex) {
        const color = new THREE.Color(rgb[0], rgb[1], rgb[2]);
        this._meshGroup?.traverse(child => {
          if (child.isMesh) {
            child.material.color = color;
            child.material.needsUpdate = true;
          }
        });
      }
    }

    /**
     * Enable/disable auto-rotation
     */
    setAutoRotate(enabled) {
      this._autoRotate = enabled;
    }

    /**
     * Toggle wireframe mode
     */
    setWireframe(enabled) {
      if (!this._meshGroup) return;
      this._meshGroup.traverse(child => {
        if (child.isMesh) {
          child.material.wireframe = enabled;
        }
      });
    }

    /**
     * Toggle flat/smooth shading
     */
    setFlatShading(enabled) {
      if (!this._meshGroup) return;
      this._meshGroup.traverse(child => {
        if (child.isMesh) {
          child.material.flatShading = enabled;
          child.material.needsUpdate = true;
        }
      });
    }

    /**
     * Reset camera to default view
     */
    resetView() {
      this._fitCameraToModel();
    }

    destroy() {
      this._disposed = true;
      if (this._animId) {
        cancelAnimationFrame(this._animId);
        this._animId = null;
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      // Dispose all scene objects (grids, lights, plates, cut edge)
      if (this._scene) {
        this._scene.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      }
      this._clearMeshes();
      if (this._renderer) {
        this._renderer.dispose();
        if (this._renderer.domElement?.parentNode) {
          this._renderer.domElement.parentNode.removeChild(this._renderer.domElement);
        }
        this._renderer = null;
      }
      if (this._controls) {
        this._controls.dispose();
        this._controls = null;
      }
      this._scene = null;
      this._camera = null;
    }
  }

  window.EnhancedViewer = EnhancedViewer;

  // ---- Inject global 3D preview CSS (needed by open3DPreview from any panel) ----
  if (!document.getElementById('_enhanced-viewer-css')) {
    const style = document.createElement('style');
    style.id = '_enhanced-viewer-css';
    style.textContent = `
      .lib-3d-viewer-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center}
      .lib-3d-viewer-wrap{background:var(--bg-primary);border-radius:var(--radius-lg,12px);width:min(1100px,95vw);height:min(700px,85vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--shadow-lg)}
      .lib-3d-toolbar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border-color)}
      .lib-3d-toolbar h4{margin:0;font-size:0.9rem;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .lib-3d-content{flex:1;display:flex;min-height:0}
      .lib-3d-canvas-wrap{flex:1;min-width:0}
      .lib-3d-info{width:240px;padding:14px;overflow-y:auto;border-left:1px solid var(--border-color);font-size:0.78rem}
      .lib-3d-info h5{margin:0 0 8px;font-size:0.82rem;color:var(--text-muted)}
      .lib-3d-info-row{display:flex;justify-content:space-between;margin-bottom:5px}
      .lib-3d-info-label{color:var(--text-muted)}
      .lib-3d-info-value{color:var(--text-primary);font-weight:600}
      .lib-3d-btn{background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius);padding:5px 10px;cursor:pointer;color:var(--text-secondary);font-size:0.72rem;font-weight:600;transition:all 0.15s;display:inline-flex;align-items:center;gap:4px}
      .lib-3d-btn:hover{background:var(--accent-blue);color:#fff;border-color:var(--accent-blue)}
      @media(max-width:768px){.lib-3d-info{display:none}}
    `;
    document.head.appendChild(style);
  }

  // ---- Global 3D Preview helper (reusable from any panel) ----

  let _globalViewer = null;

  /**
   * Open a 3D preview modal for any 3MF file
   * @param {string} apiUrl - URL to fetch mesh data from (e.g. /api/library/1/model or /api/preview-3d?source=slicer&filename=x.3mf)
   * @param {string} title - Display title
   */
  window.open3DPreview = async function(apiUrl, title) {
    // Close any existing (both global and library viewers)
    close3DPreview();
    if (typeof _close3DPreview === 'function') _close3DPreview(document.querySelector('.lib-3d-viewer-overlay'));

    // Pre-check: if response has a downloadUrl for 3MF, use 3mfViewer instead
    try {
      const check = await fetch(apiUrl);
      if (!check.ok) throw new Error((await check.json().catch(() => ({}))).error || 'Failed');
      const data = await check.json();
      if (data.type === 'mesh' && data.downloadUrl && typeof open3mfViewer === 'function') {
        const _hid = (apiUrl.match(/source=history&id=(\d+)/) || [])[1] || '';
        open3mfViewer(data.downloadUrl, title, _hid);
        return;
      }
      // If toolpath or mesh without downloadUrl, continue to EnhancedViewer below
      // Store prefetched data to avoid double-fetch
      window._prefetchedPreviewData = data;
    } catch (e) {
      // Show error with option to upload a 3MF file manually
      close3DPreview();
      const overlay = document.createElement('div');
      overlay.className = 'lib-3d-viewer-overlay';
      overlay.id = '_global-3d-overlay';
      overlay.onclick = (ev) => { if (ev.target === overlay) close3DPreview(); };
      overlay.innerHTML = `<div class="lib-3d-viewer-wrap">
        <div class="lib-3d-toolbar"><h4>${_escText(title || '3D')}</h4><div style="flex:1"></div><button class="lib-3d-btn" onclick="close3DPreview()" style="font-size:1.1rem;padding:4px 10px">&times;</button></div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px" id="_g3d-upload-area" data-history-id="${(apiUrl.match(/source=history&id=(\d+)/) || [])[1] || ''}"
          <div style="color:var(--accent-red);font-size:0.9rem">${_escText(e.message)}</div>
          <div style="color:var(--text-muted);font-size:0.8rem;text-align:center;max-width:400px">${typeof t === 'function' ? t('viewer.drag_3mf_hint') : 'Drag a .3mf file here to save it to this print'}</div>
          <div id="_g3d-dropzone" style="border:2px dashed var(--border-color);border-radius:12px;padding:30px 50px;cursor:pointer;transition:border-color 0.2s;text-align:center;color:var(--text-muted)" onclick="document.getElementById('_g3d-file-input').click()">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <div style="margin-top:8px;font-size:0.85rem">${typeof t === 'function' ? t('viewer.drop_3mf_here') : 'Slipp .3mf-fil her'}</div>
            <input type="file" id="_g3d-file-input" accept=".3mf" style="display:none" onchange="_g3dHandleFile(this.files[0])">
          </div>
          <button class="lib-3d-btn" onclick="close3DPreview()" style="padding:8px 20px">${typeof t === 'function' ? t('viewer.close') : 'Close'}</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);

      // Drag & drop
      const dropzone = document.getElementById('_g3d-dropzone');
      if (dropzone) {
        dropzone.addEventListener('dragover', (ev) => { ev.preventDefault(); dropzone.style.borderColor = 'var(--accent-blue)'; });
        dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--border-color)'; });
        dropzone.addEventListener('drop', (ev) => { ev.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; const f = ev.dataTransfer.files[0]; if (f) _g3dHandleFile(f); });
      }

      const onKey = (ev) => { if (ev.key === 'Escape') close3DPreview(); };
      document.addEventListener('keydown', onKey);
      overlay._keyHandler = onKey;
      return;
    }

    const _histId = (apiUrl.match(/source=history&id=(\d+)/) || [])[1] || '';
    const _hasLinked = window._prefetchedPreviewData?.downloadUrl;

    const overlay = document.createElement('div');
    overlay.className = 'lib-3d-viewer-overlay';
    overlay.id = '_global-3d-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) close3DPreview(); };

    overlay.innerHTML = `<div class="lib-3d-viewer-wrap">
      <div class="lib-3d-toolbar">
        <h4>${_escText(title || '3D Preview')}</h4>
        <button class="lib-3d-btn" id="_g3d-wireframe" onclick="_g3dToggleWireframe()">Wireframe</button>
        <button class="lib-3d-btn" id="_g3d-shading" onclick="_g3dToggleShading()">Flat</button>
        <button class="lib-3d-btn" id="_g3d-parts-btn" onclick="_g3dToggleParts()" style="display:none">Parts</button>
        <button class="lib-3d-btn" onclick="_g3dResetView()">Reset</button>
        ${_histId ? `<div style="flex:1"></div><button class="lib-3d-btn" onclick="_g3dUpload3mf(${_histId})" title="${typeof t === 'function' ? t('viewer.upload_replace_3mf') : 'Upload / replace 3MF'}">&#x21E7; 3MF</button><button class="lib-3d-btn" id="_g3d-del-btn" style="color:var(--accent-red);display:${_hasLinked ? '' : 'none'}" onclick="_g3dDelete3mf(${_histId})" title="${typeof t === 'function' ? t('viewer.delete_saved_3mf') : 'Delete saved 3MF'}">&#x2715;</button>` : ''}
        <button class="lib-3d-btn" onclick="close3DPreview()" style="font-size:1.1rem;padding:4px 10px">&times;</button>
      </div>
      <div class="lib-3d-content">
        <div class="lib-3d-canvas-wrap" id="_g3d-canvas">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.9rem" id="_g3d-loading">
            ${typeof t === 'function' ? t('library.loading_model', 'Loading 3D model...') : 'Loading 3D model...'}
          </div>
          <div id="_g3d-layer-scrubber" style="display:none;padding:4px 12px;background:var(--bg-tertiary,#1a1f3c);border-top:1px solid var(--border-color)">
            <div style="display:flex;align-items:center;gap:8px;font-size:0.7rem;color:var(--text-muted)">
              <span>Layer</span>
              <input type="range" id="_g3d-layer-slider" min="0" max="100" value="100" style="flex:1;accent-color:var(--accent-cyan)" oninput="window._g3dLayerSlide(this.value)">
              <span id="_g3d-layer-val" style="min-width:40px;text-align:right">100%</span>
            </div>
          </div>
        </div>
        <div class="lib-3d-info" id="_g3d-info">
          <h5>${typeof t === 'function' ? t('library.model_info', 'Model information') : 'Model Info'}</h5>
          <div id="_g3d-info-body"></div>
          <div id="_g3d-parts-panel" style="display:none;margin-top:12px">
            <h5 style="margin:0 0 6px;font-size:0.8rem">Parts</h5>
            <div id="_g3d-parts-list"></div>
          </div>
          <div id="_g3d-materials-panel" style="display:none;margin-top:12px">
            <h5 style="margin:0 0 6px;font-size:0.8rem">Materials</h5>
            <div id="_g3d-materials-list"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const onKey = (e) => { if (e.key === 'Escape') close3DPreview(); };
    document.addEventListener('keydown', onKey);
    overlay._keyHandler = onKey;

    try {
      const data = window._prefetchedPreviewData;
      delete window._prefetchedPreviewData;
      if (!data) throw new Error('No data');

      const loading = document.getElementById('_g3d-loading');
      if (loading) loading.remove();

      const canvasWrap = document.getElementById('_g3d-canvas');
      const viewer = new EnhancedViewer(canvasWrap);
      await viewer.init();

      const isToolpath = data.type === 'toolpath';
      if (isToolpath) {
        viewer.loadToolpath(data);
      } else {
        viewer.loadModel(data);
      }
      _globalViewer = viewer;
      setTimeout(_buildViewerPanels, 100);

      // Metadata
      const infoBody = document.getElementById('_g3d-info-body');
      if (isToolpath && infoBody) {
        let html = '';
        const b = data.bounds || {};
        const dx = ((b.maxX || 0) - (b.minX || 0)).toFixed(1);
        const dy = ((b.maxY || 0) - (b.minY || 0)).toFixed(1);
        const dz = ((b.maxZ || 0) - (b.minZ || 0)).toFixed(1);
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Type</span><span class="lib-3d-info-value">G-code toolpath</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Dimensjoner</span><span class="lib-3d-info-value">${dx} × ${dy} × ${dz} mm</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Lag</span><span class="lib-3d-info-value">${(data.layerCount || 0).toLocaleString()}</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Segmenter</span><span class="lib-3d-info-value">${(data.extrusionSegments || 0).toLocaleString()}</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Total bevegelser</span><span class="lib-3d-info-value">${(data.totalMoves || 0).toLocaleString()}</span></div>`;
        infoBody.innerHTML = html;
      } else if (infoBody) {
        const info = viewer.getModelInfo();
        if (info) {
          let html = '';
          html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Type</span><span class="lib-3d-info-value">3MF modell</span></div>`;
          html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Dimensjoner</span><span class="lib-3d-info-value">${info.dimensions.x} × ${info.dimensions.y} × ${info.dimensions.z} mm</span></div>`;
          html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Trekanter</span><span class="lib-3d-info-value">${info.triangleCount.toLocaleString()}</span></div>`;
          html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Vertekser</span><span class="lib-3d-info-value">${info.vertexCount.toLocaleString()}</span></div>`;
          html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">Mesh</span><span class="lib-3d-info-value">${info.meshCount}</span></div>`;
          if (info.meshNames.length > 1) {
            html += `<h5 style="margin-top:12px">Mesh-liste</h5>`;
            for (const n of info.meshNames) html += `<div style="color:var(--text-secondary);margin-bottom:3px;font-size:0.72rem">${_escText(n)}</div>`;
          }
          if (data.metadata) {
            const show = ['Title', 'Designer', 'Application', 'CreationDate'];
            html += `<h5 style="margin-top:12px">Metadata</h5>`;
            for (const k of show) {
              if (data.metadata[k]) html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${k}</span><span class="lib-3d-info-value">${_escText(data.metadata[k])}</span></div>`;
            }
          }
          infoBody.innerHTML = html;
        }
      }
    } catch (e) {
      const loading = document.getElementById('_g3d-loading');
      if (loading) {
        loading.style.color = 'var(--accent-red)';
        loading.innerHTML = `<div style="text-align:center"><div style="margin-bottom:12px">${_escText(e.message)}</div><button class="lib-3d-btn" onclick="close3DPreview()" style="padding:8px 20px">${typeof t === 'function' ? t('viewer.close') : 'Close'}</button></div>`;
      }
    }
  };

  window.close3DPreview = function() {
    if (_globalViewer) { _globalViewer.destroy(); _globalViewer = null; }
    const overlay = document.getElementById('_global-3d-overlay');
    if (overlay) {
      if (overlay._embedViewer) { try { overlay._embedViewer.destroy(); } catch {} }
      if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
      overlay.remove();
    }
  };

  window._g3dToggleWireframe = function() {
    if (!_globalViewer) return;
    const btn = document.getElementById('_g3d-wireframe');
    const on = btn?.dataset.active === '1';
    _globalViewer.setWireframe(!on);
    if (btn) { btn.dataset.active = on ? '0' : '1'; btn.style.background = on ? '' : 'var(--accent-blue)'; btn.style.color = on ? '' : '#fff'; }
  };
  window._g3dToggleShading = function() {
    if (!_globalViewer) return;
    const btn = document.getElementById('_g3d-shading');
    const on = btn?.dataset.active === '1';
    _globalViewer.setFlatShading(!on);
    if (btn) { btn.dataset.active = on ? '0' : '1'; btn.textContent = on ? 'Flat' : 'Smooth'; }
  };
  window._g3dResetView = function() { if (_globalViewer) _globalViewer.resetView(); };

  // Layer scrubber — clip model at a given height percentage
  window._g3dLayerSlide = function(val) {
    if (!_globalViewer) return;
    const pct = parseInt(val);
    const label = document.getElementById('_g3d-layer-val');
    if (label) label.textContent = pct + '%';
    if (_globalViewer._clipPlane && _globalViewer._meshGroup) {
      const box = new THREE.Box3().setFromObject(_globalViewer._meshGroup);
      const minY = box.min.y, maxY = box.max.y;
      _globalViewer._clipPlane.constant = minY + (maxY - minY) * (pct / 100);
      _globalViewer._cutY = _globalViewer._clipPlane.constant;
    }
  };

  // Parts panel — list mesh objects with visibility toggle
  window._g3dToggleParts = function() {
    const panel = document.getElementById('_g3d-parts-panel');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : '';
    const btn = document.getElementById('_g3d-parts-btn');
    if (btn) { btn.style.background = visible ? '' : 'var(--accent-blue)'; btn.style.color = visible ? '' : '#fff'; }
  };

  window._g3dTogglePart = function(idx) {
    if (!_globalViewer?._meshGroup) return;
    const child = _globalViewer._meshGroup.children[idx];
    if (!child) return;
    child.visible = !child.visible;
    const el = document.getElementById('_g3d-part-eye-' + idx);
    if (el) el.style.opacity = child.visible ? '1' : '0.3';
  };

  window._g3dIsolatePart = function(idx) {
    if (!_globalViewer?._meshGroup) return;
    const children = _globalViewer._meshGroup.children;
    const allVisible = children.every((c, i) => i === idx ? c.visible : !c.visible);
    // If already isolated, show all
    for (let i = 0; i < children.length; i++) {
      children[i].visible = allVisible ? true : (i === idx);
      const el = document.getElementById('_g3d-part-eye-' + i);
      if (el) el.style.opacity = children[i].visible ? '1' : '0.3';
    }
  };

  // Build parts and materials panels after model loads
  function _buildViewerPanels() {
    if (!_globalViewer?._meshGroup) return;
    const children = _globalViewer._meshGroup.children;
    if (children.length < 2) return;

    // Show parts button and panel
    const btn = document.getElementById('_g3d-parts-btn');
    if (btn) btn.style.display = '';
    const panel = document.getElementById('_g3d-parts-panel');
    const list = document.getElementById('_g3d-parts-list');
    if (panel && list) {
      panel.style.display = '';
      let h = '';
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        const name = c.name || `Part ${i + 1}`;
        const color = c.material?.color;
        const hex = color ? '#' + color.getHexString() : '#888';
        h += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.75rem;cursor:pointer" ondblclick="_g3dIsolatePart(${i})">
          <span id="_g3d-part-eye-${i}" onclick="_g3dTogglePart(${i})" style="cursor:pointer;font-size:0.9rem" title="Toggle visibility">👁</span>
          <span style="width:12px;height:12px;border-radius:2px;background:${hex};flex-shrink:0"></span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
        </div>`;
      }
      list.innerHTML = h;
    }

    // Show layer scrubber
    const scrubber = document.getElementById('_g3d-layer-scrubber');
    if (scrubber) scrubber.style.display = '';

    // Materials panel
    const matPanel = document.getElementById('_g3d-materials-panel');
    const matList = document.getElementById('_g3d-materials-list');
    if (matPanel && matList) {
      const colors = new Map();
      for (const c of children) {
        const color = c.material?.color;
        if (color) {
          const hex = '#' + color.getHexString();
          const name = c.name || 'Unknown';
          if (!colors.has(hex)) colors.set(hex, []);
          colors.get(hex).push(name);
        }
      }
      if (colors.size > 1) {
        matPanel.style.display = '';
        let h = '';
        for (const [hex, names] of colors) {
          h += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:0.72rem">
            <span style="width:14px;height:14px;border-radius:3px;background:${hex};border:1px solid rgba(255,255,255,0.15)"></span>
            <span>${hex.toUpperCase()}</span>
            <span style="color:var(--text-muted)">(${names.length} part${names.length > 1 ? 's' : ''})</span>
          </div>`;
        }
        matList.innerHTML = h;
      }
    }
  }

  // Upload 3MF from inside the viewer modal
  window._g3dUpload3mf = function(historyId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.3mf';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const r = await fetch(`/api/history/${historyId}/model-3mf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buf
        });
        if (r.ok) {
          if (typeof showToast === 'function') showToast('3MF saved — opening viewer', 'success');
          const delBtn = document.getElementById('_g3d-del-btn');
          if (delBtn) delBtn.style.display = '';
          // Reopen with the new file
          close3DPreview();
          open3mfViewer(`/api/history/${historyId}/model-3mf`, file.name);
        }
      } catch (e) {
        if (typeof showToast === 'function') showToast(e.message, 'error');
      }
    };
    input.click();
  };

  // Delete 3MF from inside the viewer modal
  window._g3dDelete3mf = async function(historyId) {
    if (!confirm(typeof t === 'function' ? t('viewer.confirm_delete_3mf') : 'Delete saved 3MF?')) return;
    await fetch(`/api/history/${historyId}/model-3mf`, { method: 'DELETE' });
    if (typeof showToast === 'function') showToast(typeof t === 'function' ? t('viewer.3mf_deleted') : '3MF deleted', 'success');
    const delBtn = document.getElementById('_g3d-del-btn');
    if (delBtn) delBtn.style.display = 'none';
    close3DPreview();
  };

  // Handle user-uploaded 3MF file for preview — saves it to history entry
  window._g3dHandleFile = async function(file) {
    if (!file || !file.name.endsWith('.3mf')) {
      if (typeof showToast === 'function') showToast(typeof t === 'function' ? t('viewer.only_3mf_supported') : 'Only .3mf files supported', 'error');
      return;
    }

    // Get history ID from the current upload area's data attribute
    const uploadArea = document.getElementById('_g3d-upload-area');
    const historyId = uploadArea?.dataset?.historyId;

    // Save file to server if we have a history ID
    if (historyId) {
      try {
        const buf = await file.arrayBuffer();
        const r = await fetch(`/api/history/${historyId}/model-3mf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buf
        });
        if (r.ok) {
          if (typeof showToast === 'function') showToast('3MF-fil lagret', 'success');
        }
      } catch {}
    }

    close3DPreview();

    // Open 3mfViewer with the file
    _openEmbedWithFile(file);
  };

  function _openEmbedWithFile(file) {
    const overlay = document.createElement('div');
    overlay.className = 'lib-3d-viewer-overlay';
    overlay.id = '_global-3d-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) close3DPreview(); };

    overlay.innerHTML = `<div class="lib-3d-viewer-wrap" style="width:min(1200px,95vw);height:min(800px,90vh)">
      <div class="lib-3d-toolbar">
        <h4>${_escText(file.name)}</h4>
        <span style="font-size:0.65rem;color:var(--text-muted);margin-left:8px">Powered by 3MF Consortium</span>
        <div style="flex:1"></div>
        <button class="lib-3d-btn" onclick="close3DPreview()" style="font-size:1.1rem;padding:4px 10px">&times;</button>
      </div>
      <div id="_3mf-embed-container" style="flex:1;min-height:0"></div>
    </div>`;
    document.body.appendChild(overlay);

    const onKey = (e) => { if (e.key === 'Escape') close3DPreview(); };
    document.addEventListener('keydown', onKey);
    overlay._keyHandler = onKey;

    const loadEmbed = () => {
      if (!window.ThreeMFViewerEmbed) return;
      const container = document.getElementById('_3mf-embed-container');
      if (!container) return;
      const viewer = window.ThreeMFViewerEmbed.create({
        container,
        height: '100%',
        transparent: true,
        baseOrigin: window.location.origin + '/3mf-viewer',
        onReady: (api) => { api.sendFile(file); },
        onRequestFile: (api) => { api.sendFile(file); }
      });
      overlay._embedViewer = viewer;
    };

    if (window.ThreeMFViewerEmbed) loadEmbed();
    else {
      const script = document.createElement('script');
      script.src = '/3mf-viewer/embed.js';
      script.onload = loadEmbed;
      document.head.appendChild(script);
    }
  }

  /**
   * Open 3mfViewer (3MFConsortium) embed for a 3MF file URL
   * Full-featured viewer with scene tree, wireframe, materials, beam lattice support
   * @param {string} fileUrl - URL to the 3MF file (e.g. /api/library/1/download)
   * @param {string} title - Display title
   */
  window.open3mfViewer = function(fileUrl, title, historyId) {
    close3DPreview();
    if (typeof _close3DPreview === 'function') _close3DPreview(document.querySelector('.lib-3d-viewer-overlay'));

    const overlay = document.createElement('div');
    overlay.className = 'lib-3d-viewer-overlay';
    overlay.id = '_global-3d-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) close3DPreview(); };

    const hid = historyId || '';
    overlay.innerHTML = `<div class="lib-3d-viewer-wrap" style="width:min(1200px,95vw);height:min(800px,90vh)">
      <div class="lib-3d-toolbar">
        <h4>${_escText(title || '3MF Viewer')}</h4>
        <span style="font-size:0.65rem;color:var(--text-muted);margin-left:8px">Powered by 3MF Consortium</span>
        <div style="flex:1"></div>
        ${hid ? `<button class="lib-3d-btn" onclick="_g3dUpload3mf(${hid})" title="${typeof t === 'function' ? t('viewer.replace_3mf') : 'Replace 3MF'}">&#x21E7; ${typeof t === 'function' ? t('viewer.replace') : 'Replace'}</button><button class="lib-3d-btn" id="_g3d-del-btn" style="color:var(--accent-red)" onclick="_g3dDelete3mf(${hid})" title="${typeof t === 'function' ? t('viewer.delete_3mf') : 'Delete 3MF'}">&#x2715;</button>` : ''}
        <button class="lib-3d-btn" onclick="close3DPreview()" style="font-size:1.1rem;padding:4px 10px">&times;</button>
      </div>
      <div id="_3mf-embed-container" style="flex:1;min-height:0"></div>
    </div>`;
    document.body.appendChild(overlay);

    const onKey = (e) => { if (e.key === 'Escape') close3DPreview(); };
    document.addEventListener('keydown', onKey);
    overlay._keyHandler = onKey;

    // Load embed.js and use the official ThreeMFViewerEmbed API
    const script = document.createElement('script');
    script.src = '/3mf-viewer/embed.js';
    script.onload = () => {
      if (!window.ThreeMFViewerEmbed) return;
      const container = document.getElementById('_3mf-embed-container');
      if (!container) return;
      const viewer = window.ThreeMFViewerEmbed.create({
        container,
        height: '100%',
        transparent: true,
        baseOrigin: window.location.origin + '/3mf-viewer',
        onReady: (api) => {
          const absUrl = new URL(fileUrl, window.location.href).href;
          api.loadFromUrl(absUrl, (title || 'model') + '.3mf');
        },
        onRequestFile: (api) => {
          const absUrl = new URL(fileUrl, window.location.href).href;
          api.loadFromUrl(absUrl, (title || 'model') + '.3mf');
        }
      });
      overlay._embedViewer = viewer;
    };
    document.head.appendChild(script);
  };

  function _escText(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
