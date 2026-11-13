import test from 'node:test';
import assert from 'node:assert/strict';
import {Atmosphere} from '../src/atmosphere.js';
test('События окружения редкие, не накапливаются и сбрасываются при перезапуске',()=>{
 const a=new Atmosphere();assert.equal(a.update(13,'bedroom'),null);
 assert.deepEqual(a.update(14,'bedroom'),{kind:'knock',position:[-4,1.4,2.9]});
 assert.equal(a.update(14,'bedroom'),null);assert.equal(a.update(30,'corridor'),null);
 assert.equal(a.update(100,'corridor').kind,'pipe');assert.equal(a.update(100,'corridor'),null);
 a.reset();assert.equal(a.update(0,'bedroom'),null);assert.equal(a.update(14,'bedroom').kind,'knock');
});
