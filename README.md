# Sistema Inteligente de Mantenimiento de Equipos

Proyecto de Inteligencia Artificial SIS-325, Práctica 3. Se reemplazó la calculadora de viviendas por un clasificador K-NN para motores, conservando React/Vite y FastAPI como base tecnológica.

## Iniciar backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

API: `http://127.0.0.1:8000/docs`.

## Iniciar frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Interfaz: `http://localhost:5173`.

## Pruebas

Con el entorno del backend activado:

```bash
cd backend
python -m unittest -v test_knn.py
```

## Endpoints

- `GET /api/motores`: los diez registros de la docente.
- `GET /api/casos`: tres casos nuevos para probar.
- `POST /api/predecir`: `{"motor":{"temperatura":65,"vibracion":4.2,"horas":150,"consumo":15},"k":3}`.
- `GET /api/evaluacion?k=3`: validación leave-one-out.

## Límites académicos

El clasificador, el cálculo de distancias, la normalización y la votación están implementados manualmente. No se emplea una biblioteca de ML. Los diez ejemplos son simulados, no valores límite de motores reales. Una clasificación no demuestra una avería y la decisión de mantenimiento corresponde al responsable técnico.
