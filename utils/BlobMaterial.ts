import THREE from 'three';

import noise from '@utils/noise';

export class BlobMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#FF2C55') },
                uColorContrast: { value: new THREE.Color('darkgray') },
                uSpeed: { value: 0.1 },
                uNoiseDensity: { value: 1.2 },
                uNoiseStrength: { value: 0.3 },
                uFrequency: { value: 4 },
                uAmplitude: { value: 0.15 },
                uIntensity: { value: 1.0 },
                uNetwork1: { value: 1 },
                uNetwork2: { value: 0.2 },
                uNetwork3: { value: 0.2 },
            },
            vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying float vDistort;
      
      uniform float uTime;
      uniform float uSpeed;
      uniform float uNoiseDensity;
      uniform float uNoiseStrength;
      uniform float uFrequency;
      uniform float uAmplitude;
      
      ${noise}
      
      mat3 rotation3dY(float angle) {
        float s = sin(angle);
        float c = cos(angle);
    
        return mat3(
          c, 0.0, -s,
          0.0, 1.0, 0.0,
          s, 0.0, c
        );
      }
    
      vec3 rotateY(vec3 v, float angle) {
        return rotation3dY(angle) * v;
      }

      void main() {
        vUv = uv;
        vNormal = normal;
        
        float t = uTime * uSpeed;
        float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * (uNoiseDensity * .15);

        vec3 pos = position + (normal * distortion);
        float angle = sin(uv.y * uFrequency + t) * uAmplitude;
        pos = rotateY(pos, angle);    
        
        vDistort = distortion;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }`,
            fragmentShader: `
      varying float vDistort;
      varying vec3 vNormal;

      uniform float uNetwork1;
      uniform float uNetwork2;
      uniform float uNetwork3;
      uniform vec3 uColor;
      uniform vec3 uColorContrast;
      uniform float uIntensity;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSpeed;


      vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
        return a + b * cos(6.28318 * (c * t + d));
      }

      vec3 rgb(float r, float g, float b) {
        return vec3(r / 255., g / 255., b / 255.);
      }

      vec3 rgb(float c) {
        return vec3(c / 255., c / 255., c / 255.);
      }

      ${noise}

      void main() {

        float distort = vDistort * uIntensity;

        vec3 brightness = uColor;
        vec3 oscilation = vec3(1.2, 1.2, 1.2);
        vec3 phase = vec3(0.2, 0.2, 0.2);
        vec3 contrast = uColorContrast;
        vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);

        float t = uTime * uSpeed;
        float noise1 = pnoise((vNormal + t * 0.08), vec3(10.0)) * uIntensity;
        float noise2 = pnoise((vNormal * 2. + t * 0.2), vec3(10.0)) * uIntensity;

        vec3 color1 = cosPalette(distort, rgb(92.0, 89.0, 235.0), contrast, oscilation, phase);
        vec3 color2 = cosPalette(distort, rgb(255.0, 154.0, 0.0), contrast, oscilation, phase);

        color = mix(color, rgb(92.0, 89.0, 235.0), noise1 * uNetwork1);
        color = mix(color, rgb(255.0, 44.0, 85.0), noise2 * uNetwork2);
        color = mix(color, rgb(5.0, 161.0, 252.0), noise1 * uNetwork3);
        gl_FragColor = vec4(color, 1.0);
      }`,
        });
    }

    get time() {
        return this.uniforms.uTime.value;
    }

    set time(v) {
        this.uniforms.uTime.value = v;
    }

    set color(v) {
        this.uniforms.uColor.value = v;
    }
    set colorContrast(v) {
        this.uniforms.uColorContrast.value = v;
    }
    set spikes(v) {
        this.uniforms.uNoiseDensity.value = v;
    }
    set intensity(v) {
        this.uniforms.uIntensity.value = v;
    }
    set noiseStrength(v) {
        this.uniforms.uNoiseStrength.value = v;
    }
    set speed(v) {
        this.uniforms.uSpeed.value = v;
    }
    set frequency(v) {
        this.uniforms.uFrequency.value = v;
    }
    set amplitude(v) {
        this.uniforms.uAmplitude.value = v;
    }
    set polygonActivity(v) {
        this.uniforms.uNetwork1.value = v;
    }
    set avalancheActivity(v) {
        this.uniforms.uNetwork2.value = v;
    }
    set fantomActivity(v) {
        this.uniforms.uNetwork3.value = v;
    }
}
