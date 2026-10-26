"""API del sistema académico de clasificación de motores con K-NN."""

from math import isfinite

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from datos_motores import REGISTROS, CASOS_DEMOSTRACION
from knn import KNN, evaluar_loo


app = FastAPI(title="Sistema Inteligente de Mantenimiento K-NN", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Motor(BaseModel):
    temperatura: float = Field(ge=0, description="Temperatura °C")
    vibracion: float = Field(ge=0, description="Vibración mm/s")
    horas: float = Field(ge=0, description="Horas desde la última revisión")
    consumo: float = Field(description="Variación porcentual con signo respecto del consumo habitual")

    @field_validator("temperatura", "vibracion", "horas", "consumo")
    @classmethod
    def finito(cls, valor):
        if not isfinite(valor):
            raise ValueError("Los valores deben ser finitos")
        return valor


class SolicitudPrediccion(BaseModel):
    motor: Motor
    k: int = Field(default=3, ge=1, le=10)


@app.get("/")
def inicio():
    return {"mensaje": "API K-NN de mantenimiento funcionando", "documentacion": "/docs"}


@app.get("/api/motores")
def obtener_motores():
    return {"registros": REGISTROS, "total": len(REGISTROS), "origen": "Datos académicos simulados"}


@app.get("/api/casos")
def obtener_casos():
    return {"casos": CASOS_DEMOSTRACION}


@app.post("/api/predecir")
def predecir(solicitud: SolicitudPrediccion):
    if solicitud.k > len(REGISTROS):
        raise HTTPException(status_code=422, detail="k supera los registros de entrenamiento")
    return KNN(solicitud.k).entrenar(REGISTROS).predecir(solicitud.motor.model_dump())


@app.get("/api/evaluacion")
def evaluacion(k: int = Query(default=3, ge=1, le=9)):
    return evaluar_loo(REGISTROS, k)
