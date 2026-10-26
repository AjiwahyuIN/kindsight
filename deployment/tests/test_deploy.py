import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).parents[1] / 'kindsight-deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)

class DeploymentSafety(unittest.TestCase):
    def test_archive_boundary(self):
        for name in ['/etc/passwd', 'kindsight/../../outside', 'other/server/a', 'kindsight/.env', 'kindsight/server/storage/logo.png', 'kindsight/test.local', 'kindsight/source.sql', 'kindsight/node_modules/a', 'kindsight/unknown-file']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                deploy.check_member(name)
        with self.assertRaises(ValueError):
            deploy.check_member('kindsight/server/link', stat.S_IFLNK | 0o777)
        self.assertEqual(deploy.check_member('kindsight/dist/assets/a.js'), Path('dist/assets/a.js'))

    def test_process_scope(self):
        self.assertTrue(deploy.scoped_process(1000, str(deploy.APP), deploy.PROJECT, 1000))
        self.assertFalse(deploy.scoped_process(0, str(deploy.APP), deploy.PROJECT, 1000))
        self.assertFalse(deploy.scoped_process(1000, '/www/wwwroot/other', deploy.PROJECT, 1000))
        self.assertFalse(deploy.scoped_process(1000, str(deploy.APP), 'other_app', 1000))

    def bundle(self, root, corrupt=False, undeclared=False):
        files = {name: b'test' for name in ['server/index.ts','shared/react-content.json','src/scripts/data/partners.js','package.json','package-lock.json','dist/index.html']}
        manifest = {'baseCommit': 'a'*40, 'files': [{'path': name, 'sha256': hashlib.sha256(value).hexdigest()} for name,value in files.items()]}
        archive = root / 'package.zip'
        with zipfile.ZipFile(archive, 'w') as bundle:
            for name,value in files.items():
                bundle.writestr('kindsight/'+name, b'changed' if corrupt and name=='server/index.ts' else value)
            bundle.writestr('kindsight/PACKAGE-MANIFEST.json', json.dumps(manifest))
            if undeclared: bundle.writestr('kindsight/server/undeclared.ts', 'extra')
        return archive

    def test_verified_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); target=root/'release';target.mkdir()
            result=deploy.extract_verified(self.bundle(root), target)
            self.assertEqual(result['baseCommit'], 'a'*40)

    def test_corrupt_and_undeclared_files_rejected(self):
        for options in [{'corrupt':True},{'undeclared':True}]:
            with tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp);target=root/'release';target.mkdir()
                with self.assertRaises(ValueError): deploy.extract_verified(self.bundle(root,**options),target)


    def test_rollback_preserves_env_storage_and_other_app(self):
        for fail_midway in [False, True]:
            with self.subTest(fail_midway=fail_midway), tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp); app=root/'app'; release=root/'release'; backup=root/'backup'; preserved=root/'storage'
                app.mkdir();release.mkdir();backup.mkdir()
                (app/'.env').write_text('private-fixture')
                (root/'other-app').write_text('untouched')
                for unit in deploy.UNITS:
                    for directory,version in [(app,'old'),(release,'new')]:
                        path=directory/unit
                        if unit.endswith('.json'): path.write_text(version)
                        else:
                            path.mkdir();(path/'marker').write_text(version)
                (app/'server/storage').mkdir();(app/'server/storage/logo.png').write_bytes(b'user-upload')
                if fail_midway:
                    for file in (release/'dist').iterdir(): file.unlink()
                    (release/'dist').rmdir()
                moved=[]
                if fail_midway:
                    with self.assertRaises(FileNotFoundError): deploy.activate_units(app,release,backup,preserved,moved)
                else:
                    deploy.activate_units(app,release,backup,preserved,moved)
                deploy.restore_units(app,release,backup,preserved,moved)
                self.assertEqual((app/'server/marker').read_text(),'old')
                self.assertEqual((app/'dist/marker').read_text(),'old')
                self.assertEqual((app/'.env').read_text(),'private-fixture')
                self.assertEqual((app/'server/storage/logo.png').read_bytes(),b'user-upload')
                self.assertEqual((root/'other-app').read_text(),'untouched')

if __name__ == '__main__': unittest.main()
