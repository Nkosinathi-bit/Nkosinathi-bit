"""Record stdout from a real application run for the portfolio previews."""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

project = sys.argv[1]
application = str(Path(sys.argv[2]).resolve())
if project == 'Docker-CSharp-Lab':
    command = ['dotnet', application]
    entries = 'Demo Developer\n'
elif project == 'SpaceStationProject':
    command = [application]
    entries = '1\n0\n'
else:
    command = ['dotnet', application]
    entries = '1\nDemo Student\n75\n80\n70\n85\n2\n3\n'

with tempfile.TemporaryDirectory() as working_directory:
    run = subprocess.run(command, input=entries, capture_output=True, text=True,
                         encoding='utf-8', errors='replace', cwd=working_directory, timeout=30)
if run.returncode:
    raise RuntimeError(f'Application returned {run.returncode}: {run.stderr}')
expected = {'Docker-CSharp-Lab': 'Hello Demo Developer!', 'SpaceStationProject': 'LIFE SUPPORT REPORT'}.get(project, 'QUALIFIES')
if expected not in run.stdout:
    raise RuntimeError('The application did not produce the expected demonstration output.')
print('PORTFOLIO_TEXT ' + project + ' ' + base64.b64encode(run.stdout.encode()).decode())
source = subprocess.check_output(['git','-C','project','rev-parse','HEAD'],text=True).strip()
print('PORTFOLIO_META ' + json.dumps({'project':project,'source':source,'kind':'recorded standard output','input':entries.splitlines()}))
