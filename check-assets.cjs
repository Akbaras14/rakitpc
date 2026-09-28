const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const html = fs.readFileSync('src/index.html', 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script.replace(/^\s*import .*;$/gm, ''));
const resizeCode=script.slice(script.indexOf('    function resize(){'),script.indexOf('    new ResizeObserver'));
const resizeContext={canvas:{width:0,height:0,parentElement:{getBoundingClientRect:()=>({width:0,height:0})}},window:{devicePixelRatio:2},renderLimit:2048,renderReady:false,gl:{drawingBufferWidth:1,drawingBufferHeight:1},camera:{updateProjectionMatrix(){}},renderer:{setPixelRatio(){},setSize(w,h){assert(w>0&&h>0&&w<=2048&&h<=2048);resizeContext.canvas.width=w;resizeContext.canvas.height=h}}};
vm.createContext(resizeContext);vm.runInContext(resizeCode,resizeContext);
for(const [width,height] of [[0,0],[0,600],[800,600],[100000,100000],[390,450],[NaN,600]]){
  resizeContext.canvas.parentElement.getBoundingClientRect=()=>({width,height});
  vm.runInContext('resize()',resizeContext);
  assert.equal(resizeContext.renderReady,Number.isFinite(width)&&width>=1&&height>=1);
}
console.log('Canvas sizing: hidden, desktop, mobile, oversized and invalid dimensions OK.');
const presets=JSON.parse(script.match(/const presets=(\[.*\]);/)[1]);
assert.deepEqual(presets.map(p=>p.parts.length),[8,9,9]);
assert(!presets[0].parts.some(p=>p.key==='gpu'),'Budget has integrated graphics');
for(const preset of presets){
  for(const spec of [preset.case,...preset.parts]){
    assert(spec.scale>0&&Number.isFinite(spec.scale));
    assert.equal(spec.rotation.length,3);
    assert((spec.target||spec.position).every(Number.isFinite));
    assert(fs.existsSync('src/assets/models/'+spec.path+'/scene.gltf'),spec.path);
  }
  const ram=preset.parts.filter(p=>p.key.startsWith('memory'));
  assert.equal(ram.length,2);assert.notDeepEqual(ram[0].target,ram[1].target);
  const cpu=preset.parts.find(p=>p.key==='cpu');
  const board=preset.parts.find(p=>p.key==='motherboard');
  assert(cpu.scale<board.scale,'CPU uses its own export scale');
}
console.log('Assembly calibration: distinct DIMM slots, per-asset scale and depth, budget without GPU OK.');
let checked = 0;
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (entry.name.endsWith('.gltf')) {
      const gltf = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const view of gltf.bufferViews || []) {
        assert((view.byteOffset || 0) + view.byteLength <= gltf.buffers[view.buffer].byteLength, `Buffer overflow: ${file}`);
      }
      for (const resource of [...(gltf.buffers || []), ...(gltf.images || [])]) {
        if (!resource.uri || resource.uri.startsWith('data:')) continue;
        const target = path.resolve(dir, decodeURIComponent(resource.uri));
        const bytes = fs.readFileSync(target);
        assert(!bytes.subarray(0, 80).toString().startsWith('version https://git-lfs'), target);
        if (resource.byteLength) assert.equal(bytes.length, resource.byteLength, target);
        checked++;
      }
    }
  }
}
check('src/assets/models');
console.log(`Syntax OK; ${checked} model resource references verified.`);
if (process.argv.includes('--http')) (async () => {
  for (const resource of ['case/nzxt/scene.gltf', 'case/nzxt/scene.bin', 'mobo/asus_prime_h510m/scene.bin', 'mobo/asus-rog/scene.bin', 'mobo/asus_prime_h510m/textures/material_baseColor.png', 'mobo/asus_prime_h510m/textures/.006_baseColor.jpeg', 'mobo/asus_prime_h510m/textures/.008_baseColor.jpeg', 'mobo/asus_prime_h510m/textures/.001_baseColor.jpeg', 'mobo/asus-rog/LD0005686736_1.png', 'mobo/asus-rog/10064251420702.png', 'mobo/asus-rog/samsung_ssd_970_evo_500gb_k1812134632257A_105110314.png']) {
    const response = await fetch('http://localhost:8080/assets/models/' + resource + '?v=restored-lfs-2');
    assert.equal(response.status, 200, resource);
    const actual = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(actual, fs.readFileSync('src/assets/models/' + resource));
    console.log(`HTTP 200, bytes verified: ${resource}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
