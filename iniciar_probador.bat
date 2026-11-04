@echo off
cd /d "%~dp0"
python -m pip install -q decart
start "" http://localhost:8000/virtual.html
python servidor_probador.py
