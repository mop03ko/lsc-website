"""Convert Rhino COLLADA models; originals are never modified.
Requires: pip install trimesh==5.2.0 pycollada==0.9.3 pillow numpy
Usage: python scripts/convert-models.py SOURCE_DIRECTORY
"""
import sys, io, json, hashlib
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
import trimesh
from PIL import Image

source = Path(sys.argv[1]).resolve()
out = Path(__file__).resolve().parents[1] / 'models'
out.mkdir(exist_ok=True)
manifest = []
for path in sorted(source.glob('*.dae')):
    raw = path.read_bytes()
    root = ET.fromstring(raw)
    ns = {'c': root.tag.split('}')[0][1:]}
    # Rhino emits auxiliary COMMON profiles without a technique. Keep the
    # renderable profile; pycollada cannot parse the incomplete auxiliary ones.
    repairs = 0
    tag = lambda name: '{'+ns['c']+'}'+name
    for effect in root.findall('.//c:effect', ns):
        if not effect.findall('c:profile_COMMON/c:technique', ns):
            profile = effect.find('c:profile_COMMON', ns)
            if profile is None: profile = ET.SubElement(effect, tag('profile_COMMON'))
            technique = ET.SubElement(profile, tag('technique'), sid='common')
            diffuse = ET.SubElement(ET.SubElement(technique, tag('lambert')), tag('diffuse'))
            sampler = profile.find('c:newparam[c:sampler2D]', ns)
            if sampler is not None:
                ET.SubElement(diffuse, tag('texture'), texture=sampler.get('sid'), texcoord='UVSET0')
            else:
                ET.SubElement(diffuse, tag('color')).text = '0.7 0.7 0.7 1'
            repairs += 1
        for profile in effect.findall('c:profile_COMMON', ns):
            if profile.find('c:technique', ns) is None:
                effect.remove(profile)
    for ref in root.findall('.//c:library_images/c:image/c:init_from', ns):
        if not (source / ref.text).is_file():
            raise FileNotFoundError(ref.text)
    # Web viewer supplies lighting; Rhino light definitions are incomplete.
    for parent in root.iter():
        for child in list(parent):
            if child.tag in (tag('library_lights'), tag('instance_light')): parent.remove(child)
    missing_uv = 0
    for mesh in root.findall('.//c:mesh', ns):
        ids = {e.get('id') for e in mesh}
        for primitive in mesh.findall('c:triangles', ns):
            inputs = primitive.findall('c:input', ns)
            bad = [i for i in inputs if i.get('source', '')[1:] not in ids]
            if not bad: continue
            assert all(i.get('semantic') == 'TEXCOORD' for i in bad), 'Missing geometry data'
            stride = max(int(i.get('offset')) for i in inputs) + 1
            keep = [i for i in inputs if i not in bad]
            indices = np.fromstring(primitive.find('c:p', ns).text, dtype=int, sep=' ').reshape(-1,stride)
            primitive.find('c:p', ns).text = ' '.join(map(str, indices[:,[int(i.get('offset')) for i in keep]].flatten()))
            for i in bad: primitive.remove(i)
            for offset, i in enumerate(keep): i.set('offset',str(offset))
            missing_uv += 1
    scene = trimesh.load_scene(io.BytesIO(ET.tostring(root)), file_type='dae',
        resolver=trimesh.resolvers.FilePathResolver(str(source)), process=False, ignore_broken=False)
    expected = sum(int(t.get('count')) for t in root.findall('.//c:triangles', ns))
    assert sum(len(m.faces) for m in scene.geometry.values()) == expected, 'Geometry lost during conversion'
    unit = float(root.find('c:asset/c:unit', ns).get('meter', '1'))
    scene.apply_scale(unit)
    if root.findtext('c:asset/c:up_axis', namespaces=ns) == 'Z_UP':
        scene.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2, [1,0,0]))
    textured = 0
    for mesh in scene.geometry.values():
        mat = getattr(mesh.visual, 'material', None)
        texture = getattr(mat, 'baseColorTexture', None)
        if texture is not None:
            texture.thumbnail((1024,1024), Image.Resampling.LANCZOS)
            textured += 1
    bounds = scene.bounds
    # Rebase large CAD coordinates before writing float32 buffers.
    scene.apply_translation(-np.array([(bounds[0,0]+bounds[1,0])/2,bounds[0,1],(bounds[0,2]+bounds[1,2])/2]))
    slug = path.stem.lower()
    data = scene.export(file_type='glb')
    (out / (slug+'.glb')).write_bytes(data)
    record = dict(id=slug, source=path.name, sha256=hashlib.sha256(raw).hexdigest(),
        file='/models/'+slug+'.glb', bytes=len(data),
        boundsMeters=(bounds[1]-bounds[0]).round(3).tolist(),
        meshes=len(scene.geometry), triangles=sum(len(m.faces) for m in scene.geometry.values()),
        texturedMeshes=textured, repairedMaterialDefinitions=repairs, missingUVPrimitives=missing_uv)
    manifest.append(record)
    print(json.dumps(record), flush=True)
(out/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
