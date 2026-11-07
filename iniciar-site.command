#!/bin/bash
# Clique duas vezes neste arquivo para abrir o site localmente.
cd "$(dirname "$0")"
PORT=8000
echo "Site rodando em http://localhost:$PORT  (feche esta janela para parar)"
(sleep 1 && open "http://localhost:$PORT") &
python3 -m http.server $PORT
