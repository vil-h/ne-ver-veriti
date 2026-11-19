import test from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {createMonster} from '../src/verity-monster.js';
test('Гуманоид: суставы, пальцы, рост, противоположные шаги, атака и возврат',()=>{
 const engine=new NullEngine(),scene=new Scene(engine),parent=new TransformNode('verity',scene),m=createMonster(scene,parent);
 assert.ok(m.joints.leftTip4);assert.equal(m.joints.leftKnee.parent,m.joints.leftHip);assert.equal(m.root.isEnabled(),false);
 m.pose(.2,.5,.8);assert.ok(m.root.scaling.y>.3&&m.root.scaling.y<.8);assert.ok(m.joints.leftHip.rotation.x*m.joints.rightHip.rotation.x<0);
 m.pose(1,1,1,1);assert.ok(m.joints.leftShoulder.rotation.x>.5);assert.equal(m.root.scaling.y,1);
 m.pose(2,0);assert.equal(m.root.isEnabled(),false);scene.dispose();engine.dispose();
});
