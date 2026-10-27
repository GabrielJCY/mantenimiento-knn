
import os
from math import isfinite

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from datos_motores import REGISTROS, CASOS_DEMOSTRACION
from knn import KNN, evaluar_loo


# ==========================================================
# CONFIGURACIÓN GENERAL DE FASTAPI
# ==========================================================

app = FastAPI(
    title="Sistema Inteligente de Mantenimiento K-NN",
    description=(
        "API de clasificación de motores eléctricos "
        "mediante el algoritmo K-Nearest Neighbors."
    ),
    version="1.0.0"
)


# ==========================================================
# CONFIGURACIÓN CORS - LOCALHOST Y VERCEL
# ==========================================================

# URL del frontend publicada en Vercel.
# Se configura mediante Environment Variables.

FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    ""
).rstrip("/")


# Direcciones permitidas durante el desarrollo local.

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# Añadir automáticamente el dominio de producción.

if FRONTEND_ORIGIN:
    origins.append(FRONTEND_ORIGIN)


# Configuración del middleware CORS.

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ==========================================================
# MODELO DE DATOS DEL MOTOR
# ==========================================================

class Motor(BaseModel):

    temperatura: float = Field(
        ge=0,
        description="Temperatura del motor en grados Celsius"
    )

    vibracion: float = Field(
        ge=0,
        description="Vibración del motor en mm/s"
    )

    horas: float = Field(
        ge=0,
        description="Horas desde la última revisión"
    )

    consumo: float = Field(
        description=(
            "Variación porcentual del consumo eléctrico "
            "respecto a su referencia habitual"
        )
    )

    @field_validator(
        "temperatura",
        "vibracion",
        "horas",
        "consumo"
    )
    @classmethod
    def finito(cls, valor):

        if not isfinite(valor):
            raise ValueError(
                "Los valores deben ser números finitos"
            )

        return valor


# ==========================================================
# MODELO DE SOLICITUD DE PREDICCIÓN
# ==========================================================

class SolicitudPrediccion(BaseModel):

    motor: Motor

    k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Número de vecinos utilizados por K-NN"
    )


# ==========================================================
# ENDPOINT PRINCIPAL
# ==========================================================

@app.get("/")
def inicio():

    return {
        "mensaje": "API K-NN de mantenimiento funcionando",
        "version": "1.0.0",
        "modelo": "K-Nearest Neighbors",
        "documentacion": "/docs"
    }


# ==========================================================
# OBTENER REGISTROS DE MOTORES
# ==========================================================

@app.get("/api/motores")
def obtener_motores():

    return {
        "registros": REGISTROS,
        "total": len(REGISTROS),
        "origen": "Datos académicos simulados"
    }


# ==========================================================
# OBTENER CASOS DE DEMOSTRACIÓN
# ==========================================================

@app.get("/api/casos")
def obtener_casos():

    return {
        "casos": CASOS_DEMOSTRACION
    }


# ==========================================================
# CLASIFICACIÓN MEDIANTE K-NN
# ==========================================================

@app.post("/api/predecir")
def predecir(solicitud: SolicitudPrediccion):

    # Verificar que k no supere los datos disponibles.

    if solicitud.k > len(REGISTROS):

        raise HTTPException(
            status_code=422,
            detail=(
                "El valor de k supera la cantidad "
                "de registros de entrenamiento"
            )
        )

    # Inicializar y entrenar el clasificador K-NN.

    modelo = KNN(
        k=solicitud.k
    )

    modelo.entrenar(
        REGISTROS
    )

    # Obtener las variables del motor.

    datos_motor = solicitud.motor.model_dump()

    # Clasificar el estado del equipo.

    resultado = modelo.predecir(
        datos_motor
    )

    return resultado


# ==========================================================
# EVALUACIÓN DEL MODELO K-NN
# ==========================================================

@app.get("/api/evaluacion")
def evaluacion(
    k: int = Query(
        default=3,
        ge=1,
        le=9,
        description="Número de vecinos para la evaluación"
    )
):

    resultado = evaluar_loo(
        REGISTROS,
        k
    )

    return resultado
