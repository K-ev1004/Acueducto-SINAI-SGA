#!/bin/bash
# SENA SGA - Script de Inicio Rápido
# Uso: ./start.sh o bash start.sh

set -e

cd "$(dirname "$0")"

echo "============================================"
echo "  SENA SGA - Inicio del Proyecto"
echo "============================================"

# Verificar Python
echo ""
echo "[1/6] Verificando Python..."
python --version

# Verificar entorno virtual
if [ ! -d "venv" ]; then
    echo ""
    echo "[2/6] Creando entorno virtual..."
    python -m venv venv
fi

echo ""
echo "[2/6] Activando entorno virtual..."
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate 2>/dev/null

# Instalar dependencias
echo ""
echo "[3/6] Instalando dependencias..."
pip install -q -r requirements.txt

# Verificar migraciones
echo ""
echo "[4/6] Aplicando migraciones..."
python manage.py migrate --noinput

# Verificar base de datos
echo ""
echo "[5/6] Verificando configuración..."
python manage.py check --deploy

# Verificar variables de entorno
if [ ! -f ".env" ]; then
    echo ""
    echo "[5/6] ⚠️  Archivo .env no encontrado!"
    echo "      Copie .env.example a .env y configure las variables"
    cp .env.example .env 2>/dev/null || true
fi

echo ""
echo "============================================"
echo "  ✅ Todo listo! Iniciando servidor..."
echo "============================================"
echo ""
echo "  🔗 API:       http://localhost:8000/api"
echo "  📊 Admin:     http://localhost:8000/admin"
echo "  📋 Documentación: http://localhost:8000/api/docs/"
echo ""
echo "  Credenciales de prueba:"
echo "    SuperAdmin: superadmin / SuperAdmin123!"
echo "    Admin:      admin / Admin123!"
echo "    Lecturista: lecturista / Lecturista123!"
echo ""
echo "  Presiona Ctrl+C para detener"
echo "============================================"
echo ""

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000