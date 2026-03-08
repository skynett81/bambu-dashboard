// Minimal WebGL 3D model viewer — no dependencies
// Renders flat-shaded triangular meshes with orbit controls + layer-by-layer animation
// Supports per-layer coloring via 1D texture lookup
(function() {

  // ---- Matrix math (compact) ----

  function mat4() { return new Float32Array(16); }

  function mat4Identity(o) {
    o.fill(0); o[0]=o[5]=o[10]=o[15]=1; return o;
  }

  function mat4Perspective(o, fov, asp, near, far) {
    const f = 1 / Math.tan(fov/2), nf = 1/(near-far);
    o.fill(0);
    o[0] = f/asp; o[5] = f; o[10] = (far+near)*nf; o[11] = -1; o[14] = 2*far*near*nf;
    return o;
  }

  function mat4Mul(o, a, b) {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[i+k*4] * b[k+j*4];
        o[i+j*4] = s;
      }
    return o;
  }

  function mat3NormalFromMat4(o, m) {
    const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10];
    const det = a*(e*i-f*h) - b*(d*i-f*g) + c*(d*h-e*g);
    if (Math.abs(det) < 1e-10) { o.fill(0); o[0]=o[4]=o[8]=1; return o; }
    const id = 1/det;
    o[0]=(e*i-f*h)*id; o[1]=(c*h-b*i)*id; o[2]=(b*f-c*e)*id;
    o[3]=(f*g-d*i)*id; o[4]=(a*i-c*g)*id; o[5]=(c*d-a*f)*id;
    o[6]=(d*h-e*g)*id; o[7]=(b*g-a*h)*id; o[8]=(a*e-b*d)*id;
    return o;
  }

  // ---- Shaders ----

  const VS_MODEL = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    uniform mat4 uMVP;
    uniform mat3 uNM;
    varying vec3 vN;
    varying float vWorldY;
    void main() {
      vN = normalize(uNM * aNorm);
      vWorldY = aPos.y;
      gl_Position = uMVP * vec4(aPos, 1.0);
    }`;

  // Fragment shader: samples a 1D layer-color texture based on Y position
  const FS_MODEL = `
    precision mediump float;
    varying vec3 vN;
    varying float vWorldY;
    uniform vec3 uColor;
    uniform vec3 uLight;
    uniform float uCutY;
    uniform float uMinY;
    uniform float uMaxY;
    uniform sampler2D uLayerTex;
    uniform float uUseLayerTex;
    void main() {
      if (vWorldY > uCutY) discard;
      // Pick color: per-layer texture or uniform fallback
      vec3 baseColor;
      if (uUseLayerTex > 0.5) {
        float t = clamp((vWorldY - uMinY) / (uMaxY - uMinY), 0.0, 1.0);
        baseColor = texture2D(uLayerTex, vec2(t, 0.5)).rgb;
      } else {
        baseColor = uColor;
      }
      vec3 n = normalize(vN);
      if (!gl_FrontFacing) n = -n;
      float diff = max(dot(n, uLight), 0.0);
      float spec = pow(max(dot(reflect(-uLight, n), vec3(0,0,1)), 0.0), 24.0) * 0.35;
      // Fill light from opposite side for softer shadows
      float fill = max(dot(n, normalize(vec3(-0.3, 0.4, -0.6))), 0.0) * 0.2;
      vec3 c = baseColor * (0.22 + diff * 0.68 + fill) + vec3(spec);
      float d = uCutY - vWorldY;
      if (d >= 0.0 && d < 0.04) {
        c += vec3(0.0, 0.85, 0.45) * (1.0 - d / 0.04) * 0.55;
      }
      gl_FragColor = vec4(c, 1.0);
    }`;

  const VS_GRID = `
    attribute vec3 aPos;
    uniform mat4 uMVP;
    void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;

  const FS_GRID = `
    precision mediump float;
    uniform vec4 uColor;
    void main() { gl_FragColor = uColor; }`;

  function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[model-viewer] Shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s); return null;
    }
    return s;
  }

  function createProgram(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, vs, gl.VERTEX_SHADER));
    gl.attachShader(p, compileShader(gl, fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[model-viewer] Program:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  // ---- Build flat-shaded geometry ----

  function buildGeometry(vertices, triangles) {
    const posArr = [];
    const normArr = [];

    for (let i = 0; i < triangles.length; i += 3) {
      const i0 = triangles[i]*3, i1 = triangles[i+1]*3, i2 = triangles[i+2]*3;
      const v0 = [vertices[i0], vertices[i0+1], vertices[i0+2]];
      const v1 = [vertices[i1], vertices[i1+1], vertices[i1+2]];
      const v2 = [vertices[i2], vertices[i2+1], vertices[i2+2]];

      const e1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
      const e2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];
      let nx = e1[1]*e2[2]-e1[2]*e2[1];
      let ny = e1[2]*e2[0]-e1[0]*e2[2];
      let nz = e1[0]*e2[1]-e1[1]*e2[0];
      const len = Math.sqrt(nx*nx+ny*ny+nz*nz);
      if (len > 0) { nx/=len; ny/=len; nz/=len; }

      posArr.push(...v0, ...v1, ...v2);
      normArr.push(nx,ny,nz, nx,ny,nz, nx,ny,nz);
    }

    return {
      positions: new Float32Array(posArr),
      normals: new Float32Array(normArr),
      count: triangles.length
    };
  }

  function computeBounds(vertices) {
    let minX=Infinity,minY=Infinity,minZ=Infinity;
    let maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    for (let i = 0; i < vertices.length; i += 3) {
      const x=vertices[i], y=vertices[i+1], z=vertices[i+2];
      if (x<minX) minX=x; if (x>maxX) maxX=x;
      if (y<minY) minY=y; if (y>maxY) maxY=y;
      if (z<minZ) minZ=z; if (z>maxZ) maxZ=z;
    }
    return {
      center: [(minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2],
      size: Math.max(maxX-minX, maxY-minY, maxZ-minZ) || 1,
      minY, maxY
    };
  }

  // ---- Build plate grid ----

  function buildGrid(size, divisions) {
    const half = size / 2;
    const step = size / divisions;
    const verts = [];
    for (let i = 0; i <= divisions; i++) {
      const p = -half + i * step;
      verts.push(p, 0, -half, p, 0, half);
      verts.push(-half, 0, p, half, 0, p);
    }
    return new Float32Array(verts);
  }

  // Fine grid for build plate look (Bambu Studio style)
  function buildFineGrid(size, divisions) {
    const half = size / 2;
    const step = size / divisions;
    const verts = [];
    for (let i = 0; i <= divisions; i++) {
      const p = -half + i * step;
      verts.push(p, 0, -half, p, 0, half);
      verts.push(-half, 0, p, half, 0, p);
    }
    return new Float32Array(verts);
  }

  // ---- ModelViewer class ----

  class ModelViewer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
      if (!gl) { console.warn('[model-viewer] No WebGL'); return; }
      this.gl = gl;

      this.progModel = createProgram(gl, VS_MODEL, FS_MODEL);
      this.progGrid = createProgram(gl, VS_GRID, FS_GRID);

      // Orbit state
      this.yaw = 0.6;
      this.pitch = 0.4;
      this.dist = 2.2;
      this.modelColor = [0.95, 0.65, 0.25];
      this.vertCount = 0;
      this.gridCount = 0;
      this.animId = null;

      // Layer cutoff
      this.modelMinY = 0;
      this.modelMaxY = 1;
      this.cutY = 100; // default: show everything
      this.lookAtY = 0; // vertical center of model

      // Layer color texture
      this._layerTex = null;
      this._useLayerTex = false;

      // Auto-rotation
      this._autoRotate = true;
      this._dragging = false;

      // Auto-fit state (refit on canvas resize)
      this._fitModelH = 0;
      this._fitModelW = 0;
      this._fitCanvasW = 0;
      this._fitCanvasH = 0;
      this._userZoomed = false;

      // Buffers
      this.posBuf = gl.createBuffer();
      this.normBuf = gl.createBuffer();
      this.gridBuf = gl.createBuffer();
      this.fineGridBuf = gl.createBuffer();

      // Matrices
      this._proj = mat4();
      this._view = mat4();
      this._model = mat4();
      this._mvp = mat4();
      this._tmp1 = mat4();
      this._nm = new Float32Array(9);

      // Coarse grid (major lines - Bambu Studio style)
      const gridVerts = buildGrid(2.4, 6);
      this.gridCount = gridVerts.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuf);
      gl.bufferData(gl.ARRAY_BUFFER, gridVerts, gl.STATIC_DRAW);

      // Fine grid (minor lines)
      const fineVerts = buildFineGrid(2.4, 30);
      this.fineGridCount = fineVerts.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fineGridBuf);
      gl.bufferData(gl.ARRAY_BUFFER, fineVerts, gl.STATIC_DRAW);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // Transparent background — CSS grid pattern shows through
      gl.clearColor(0, 0, 0, 0);

      this._setupControls();
      this._render = this._render.bind(this);
    }

    loadModel(data) {
      if (!this.gl) return;
      const gl = this.gl;

      const { vertices, triangles, color } = data;
      if (color) this.modelColor = color;

      const bounds = computeBounds(vertices);
      const scale = 2.0 / bounds.size;

      // Center model horizontally, place bottom on Y=0
      const centered = new Float32Array(vertices.length);
      for (let i = 0; i < vertices.length; i += 3) {
        centered[i]   = (vertices[i]   - bounds.center[0]) * scale;
        centered[i+1] = (vertices[i+1] - bounds.minY) * scale;
        centered[i+2] = (vertices[i+2] - bounds.center[2]) * scale;
      }

      // Recompute bounds on centered data for accurate Y range
      const cb = computeBounds(centered);
      this.modelMinY = cb.minY;
      this.modelMaxY = cb.maxY;
      this.cutY = this.modelMaxY; // start showing full model
      this.lookAtY = (cb.minY + cb.maxY) / 2; // look at vertical center

      const geom = buildGeometry(centered, triangles);
      this.vertCount = geom.count;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geom.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geom.normals, gl.STATIC_DRAW);

      // Reset layer texture
      this._useLayerTex = false;

      // Store model dimensions for auto-fit (also on resize)
      this._fitModelH = cb.maxY - cb.minY;
      this._fitModelW = cb.size;
      this._userZoomed = false;

      this.yaw = 0.6;
      this.pitch = 0.3;
      this._fitToView();
      this._autoRotate = true;

      this._startLoop();
    }

    setColor(rgb) {
      if (rgb && rgb.length === 3) {
        this.modelColor = rgb;
      }
    }

    // Upload per-layer color map as a 1D texture
    // layerColors: array where index=layer number, value=[r,g,b] (0-1)
    // totalLayers: total number of layers in the print
    setLayerColors(layerColors, totalLayers) {
      const gl = this.gl;
      if (!gl || !layerColors || layerColors.length === 0) return;

      const texWidth = Math.max(totalLayers, layerColors.length, 1);
      const pixels = new Uint8Array(texWidth * 4); // RGBA

      // Fill texture: each pixel = one layer's color
      let lastR = 128, lastG = 128, lastB = 128;
      for (let i = 0; i < texWidth; i++) {
        const c = layerColors[i];
        if (c) {
          lastR = Math.round(c[0] * 255);
          lastG = Math.round(c[1] * 255);
          lastB = Math.round(c[2] * 255);
        }
        const off = i * 4;
        pixels[off]   = lastR;
        pixels[off+1] = lastG;
        pixels[off+2] = lastB;
        pixels[off+3] = 255;
      }

      if (!this._layerTex) {
        this._layerTex = gl.createTexture();
      }
      gl.bindTexture(gl.TEXTURE_2D, this._layerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this._useLayerTex = true;
    }

    setProgress(p) {
      if (p <= 0 || p > 1 || !isFinite(this.modelMinY)) {
        this.cutY = this.modelMaxY || 100;
      } else {
        this.cutY = this.modelMinY + p * (this.modelMaxY - this.modelMinY);
      }
    }

    _fitToView() {
      if (this._fitModelH <= 0) return;
      const w = this.canvas.clientWidth || 1;
      const h = this.canvas.clientHeight || 1;
      const fov = 0.55;
      const aspect = w / h;
      const halfTanV = Math.tan(fov / 2);
      const projH = this._fitModelH * Math.cos(this.pitch);
      const fitV = (projH / 2) / halfTanV;
      const fitH = (this._fitModelW / 2) / (halfTanV * aspect);
      this.dist = Math.max(fitV, fitH) * 0.85;
      this.dist = Math.max(0.5, Math.min(10, this.dist));
      this._fitCanvasW = w;
      this._fitCanvasH = h;
    }

    _startLoop() {
      if (this.animId) return;
      const loop = () => {
        this.animId = requestAnimationFrame(loop);
        this._render();
      };
      loop();
    }

    _render() {
      const gl = this.gl;
      if (!gl) return;

      // Auto-rotate
      if (this._autoRotate && !this._dragging) {
        this.yaw += 0.001;
      }

      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (w === 0 || h === 0) return;
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        // Refit camera when canvas resizes significantly (and user hasn't manually zoomed)
        if (!this._userZoomed && this._fitModelH > 0) {
          const dw = Math.abs(w - this._fitCanvasW);
          const dh = Math.abs(h - this._fitCanvasH);
          if (dw > 30 || dh > 30) {
            this._fitToView();
          }
        }
      }
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = w / h || 1;
      mat4Perspective(this._proj, 0.55, aspect, 0.1, 100);

      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      const tY = this.lookAtY;
      const eyeX = this.dist * sy * cp;
      const eyeY = tY + this.dist * sp;
      const eyeZ = this.dist * cy * cp;

      this._lookAt(this._view, eyeX, eyeY, eyeZ, 0, tY, 0);
      mat4Identity(this._model);
      mat4Mul(this._tmp1, this._view, this._model);
      mat4Mul(this._mvp, this._proj, this._tmp1);
      mat3NormalFromMat4(this._nm, this._tmp1);

      // Draw grids (Bambu Studio build plate style)
      if (this.progGrid) {
        gl.useProgram(this.progGrid);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.progGrid, 'uMVP'), false, this._mvp);
        const gPosLoc = gl.getAttribLocation(this.progGrid, 'aPos');
        gl.enableVertexAttribArray(gPosLoc);

        // Fine grid (subtle minor lines)
        if (this.fineGridCount > 0) {
          gl.uniform4f(gl.getUniformLocation(this.progGrid, 'uColor'), 0.22, 0.23, 0.25, 0.25);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.fineGridBuf);
          gl.vertexAttribPointer(gPosLoc, 3, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, this.fineGridCount);
        }

        // Coarse grid (visible major lines)
        if (this.gridCount > 0) {
          gl.uniform4f(gl.getUniformLocation(this.progGrid, 'uColor'), 0.3, 0.31, 0.33, 0.4);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuf);
          gl.vertexAttribPointer(gPosLoc, 3, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, this.gridCount);
        }

        gl.disableVertexAttribArray(gPosLoc);
      }

      // Draw model with Y-cutoff + per-layer color
      if (this.progModel && this.vertCount > 0) {
        gl.useProgram(this.progModel);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.progModel, 'uMVP'), false, this._mvp);
        gl.uniformMatrix3fv(gl.getUniformLocation(this.progModel, 'uNM'), false, this._nm);
        gl.uniform3fv(gl.getUniformLocation(this.progModel, 'uColor'), this.modelColor);
        gl.uniform3f(gl.getUniformLocation(this.progModel, 'uLight'), 0.4, 0.7, 0.5);
        gl.uniform1f(gl.getUniformLocation(this.progModel, 'uCutY'), this.cutY);
        gl.uniform1f(gl.getUniformLocation(this.progModel, 'uMinY'), this.modelMinY);
        gl.uniform1f(gl.getUniformLocation(this.progModel, 'uMaxY'), this.modelMaxY);
        gl.uniform1f(gl.getUniformLocation(this.progModel, 'uUseLayerTex'), this._useLayerTex ? 1.0 : 0.0);

        // Bind layer color texture
        if (this._useLayerTex && this._layerTex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this._layerTex);
          gl.uniform1i(gl.getUniformLocation(this.progModel, 'uLayerTex'), 0);
        }

        const posLoc = gl.getAttribLocation(this.progModel, 'aPos');
        const normLoc = gl.getAttribLocation(this.progModel, 'aNorm');

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
        gl.enableVertexAttribArray(normLoc);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);

        gl.disableVertexAttribArray(posLoc);
        gl.disableVertexAttribArray(normLoc);
      }
    }

    _lookAt(o, ex, ey, ez, tx, ty, tz) {
      tx = tx||0; ty = ty||0; tz = tz||0;
      let fx=tx-ex, fy=ty-ey, fz=tz-ez;
      let fl = Math.sqrt(fx*fx+fy*fy+fz*fz);
      if (fl>0) { fx/=fl; fy/=fl; fz/=fl; }
      // up = (0,1,0)
      let rx = fy*0 - fz*1, ry = fz*0 - fx*0, rz = fx*1 - fy*0;
      let rl = Math.sqrt(rx*rx+ry*ry+rz*rz);
      if (rl>0) { rx/=rl; ry/=rl; rz/=rl; }
      let ux = ry*fz-rz*fy, uy = rz*fx-rx*fz, uz = rx*fy-ry*fx;
      o[0]=rx;  o[1]=ux;  o[2]=-fx;  o[3]=0;
      o[4]=ry;  o[5]=uy;  o[6]=-fy;  o[7]=0;
      o[8]=rz;  o[9]=uz;  o[10]=-fz; o[11]=0;
      o[12]=-(rx*ex+ry*ey+rz*ez);
      o[13]=-(ux*ex+uy*ey+uz*ez);
      o[14]=-(-fx*ex+-fy*ey+-fz*ez);
      o[15]=1;
      return o;
    }

    _setupControls() {
      const cv = this.canvas;
      let lastX = 0, lastY = 0;

      cv.addEventListener('pointerdown', (e) => {
        this._dragging = true;
        this._autoRotate = false;
        lastX = e.clientX;
        lastY = e.clientY;
        cv.setPointerCapture(e.pointerId);
      });

      cv.addEventListener('pointermove', (e) => {
        if (!this._dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        this.yaw += dx * 0.008;
        this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + dy * 0.008));
      });

      cv.addEventListener('pointerup', () => { this._dragging = false; });
      cv.addEventListener('pointercancel', () => { this._dragging = false; });

      cv.addEventListener('wheel', (e) => {
        e.preventDefault();
        this._userZoomed = true;
        this.dist = Math.max(0.8, Math.min(12, this.dist + e.deltaY * 0.005));
      }, { passive: false });
    }

    destroy() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      const gl = this.gl;
      if (!gl) return;
      gl.deleteBuffer(this.posBuf);
      gl.deleteBuffer(this.normBuf);
      gl.deleteBuffer(this.gridBuf);
      if (this._layerTex) gl.deleteTexture(this._layerTex);
      if (this.progModel) gl.deleteProgram(this.progModel);
      if (this.progGrid) gl.deleteProgram(this.progGrid);
      this.gl = null;
    }
  }

  window.ModelViewer = ModelViewer;
})();
