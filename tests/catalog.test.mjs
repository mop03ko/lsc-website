import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { MODELS, totalArea } from '../modules/model-data.js';

test('all six catalog exports preserve triangle counts and embed their resources', async () => {
  const entries = JSON.parse(await fs.readFile('models/catalog.json', 'utf8'));
  assert.equal(entries.length, 6);
  for (const model of entries) {
    assert.equal(MODELS[model.id].file, model.file);
    assert.equal(totalArea(MODELS[model.id]), null, 'Envelope is not usable floor area');
    const data = await fs.readFile('dist' + model.file);
    assert.equal(data.toString('ascii', 0, 4), 'glTF');
    assert.equal(data.readUInt32LE(4), 2);
    assert.equal(data.readUInt32LE(8), data.length);
    assert.equal(data.length, model.bytes);
    const gltf = JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)));
    assert.equal(gltf.meshes.length, model.meshes);
    assert.equal(
      gltf.meshes
        .flatMap((m) => m.primitives)
        .reduce((sum, p) => sum + gltf.accessors[p.indices].count / 3, 0),
      model.triangles,
    );
    assert.ok(gltf.buffers.every((b) => !b.uri));
    assert.ok((gltf.images || []).every((i) => !i.uri && Number.isInteger(i.bufferView)));
    await fs.access('images/models/' + model.id + '.png');
  }
});
