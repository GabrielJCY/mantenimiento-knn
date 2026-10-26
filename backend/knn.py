"""Clasificador K-NN escrito sin scikit-learn ni bibliotecas de ML.

El escalado se ajusta solo con datos de entrenamiento, evitando fuga de datos.
"""

from collections import Counter
from math import sqrt

from datos_motores import CAMPOS


RECOMENDACIONES = {
    "Estable": "Mantener el seguimiento y la revisión programada.",
    "Atención": "Programar una inspección técnica preventiva.",
    "Crítico": "Priorizar una inspección técnica y verificar el equipo antes de continuar su operación.",
}


class KNN:
    def __init__(self, k=3):
        if not isinstance(k, int) or isinstance(k, bool) or k < 1:
            raise ValueError("k debe ser un entero positivo")
        self.k = k
        self.entrenamiento = None
        self.limites = None

    def entrenar(self, registros):
        if not registros or len(registros) < self.k:
            raise ValueError("Se requieren al menos k registros de entrenamiento")
        for registro in registros:
            for campo in CAMPOS:
                if campo not in registro or not isinstance(registro[campo], (int, float)):
                    raise ValueError(f"Dato de entrenamiento inválido: {campo}")
            if registro.get("estado") not in RECOMENDACIONES:
                raise ValueError("Estado de entrenamiento inválido")
        self.entrenamiento = list(registros)
        self.limites = {
            campo: (min(r[campo] for r in registros), max(r[campo] for r in registros))
            for campo in CAMPOS
        }
        return self

    def _normalizar(self, motor):
        valores = []
        for campo in CAMPOS:
            minimo, maximo = self.limites[campo]
            valor = motor[campo]
            valores.append((valor - minimo) / (maximo - minimo) if maximo != minimo else 0.0)
        return valores

    def predecir(self, motor):
        if self.entrenamiento is None:
            raise ValueError("Primero debe entrenar el modelo")
        if not all(campo in motor for campo in CAMPOS):
            raise ValueError("Faltan características del motor")
        punto = self._normalizar(motor)
        distancias = []
        for registro in self.entrenamiento:
            vecino = self._normalizar(registro)
            distancia = sqrt(sum((a - b) ** 2 for a, b in zip(punto, vecino)))
            distancias.append((distancia, str(registro.get("id", "")), registro))
        distancias.sort(key=lambda item: (item[0], item[1]))
        cercanos = distancias[:self.k]
        votos = Counter(registro["estado"] for _, _, registro in cercanos)
        # Desempate determinista: más votos, menor suma de distancias, vecino más próximo, nombre.
        clases = sorted(votos, key=lambda clase: (
            -votos[clase],
            sum(distancia for distancia, _, r in cercanos if r["estado"] == clase),
            min(distancia for distancia, _, r in cercanos if r["estado"] == clase),
            clase,
        ))
        estado = clases[0]
        vecinos = [
            {"id": registro.get("id", ""), "estado": registro["estado"], "distancia": round(distancia, 6)}
            for distancia, _, registro in cercanos
        ]
        return {
            "estado": estado,
            "recomendacion": RECOMENDACIONES[estado],
            "k": self.k,
            "votos": dict(votos),
            "vecinos": vecinos,
            "advertencia": "Clasificación académica simulada; no confirma una falla real ni sustituye una inspección técnica.",
        }


def evaluar_loo(registros, k=3):
    """Validación dejando uno fuera: cada predicción excluye el registro probado."""
    if len(registros) <= k:
        raise ValueError("Se necesitan más de k registros")
    clases = ("Estable", "Atención", "Crítico")
    matriz = {real: {predicha: 0 for predicha in clases} for real in clases}
    detalles = []
    for indice, real in enumerate(registros):
        entrenamiento = registros[:indice] + registros[indice + 1:]
        prediccion = KNN(k).entrenar(entrenamiento).predecir(real)
        estimado = prediccion["estado"]
        matriz[real["estado"]][estimado] += 1
        detalles.append({"id": real["id"], "real": real["estado"], "predicho": estimado, "correcto": real["estado"] == estimado})
    correctos = sum(r["correcto"] for r in detalles)
    return {"metodo": "leave-one-out", "k": k, "total": len(registros), "aciertos": correctos,
            "exactitud": round(correctos / len(registros), 4), "matriz_confusion": matriz, "detalles": detalles,
            "limitacion": "Solo 10 registros simulados: la exactitud no demuestra rendimiento con motores reales."}
