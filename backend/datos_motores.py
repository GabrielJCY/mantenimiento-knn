"""Datos académicos simulados entregados para la práctica 3 de SIS-325."""

REGISTROS = [
    {"id": "M1", "temperatura": 35, "vibracion": 1.2, "horas": 20, "consumo": 2, "estado": "Estable"},
    {"id": "M2", "temperatura": 40, "vibracion": 1.5, "horas": 35, "consumo": 4, "estado": "Estable"},
    {"id": "M3", "temperatura": 45, "vibracion": 1.8, "horas": 50, "consumo": 5, "estado": "Estable"},
    {"id": "M4", "temperatura": 60, "vibracion": 3.5, "horas": 120, "consumo": 12, "estado": "Atención"},
    {"id": "M5", "temperatura": 65, "vibracion": 4.2, "horas": 150, "consumo": 15, "estado": "Atención"},
    {"id": "M6", "temperatura": 85, "vibracion": 7.5, "horas": 260, "consumo": 30, "estado": "Crítico"},
    {"id": "M7", "temperatura": 90, "vibracion": 8.2, "horas": 300, "consumo": 35, "estado": "Crítico"},
    {"id": "M8", "temperatura": 80, "vibracion": 6.9, "horas": 240, "consumo": 27, "estado": "Crítico"},
    {"id": "M9", "temperatura": 55, "vibracion": 2.8, "horas": 100, "consumo": 10, "estado": "Atención"},
    {"id": "M10", "temperatura": 42, "vibracion": 1.6, "horas": 40, "consumo": 3, "estado": "Estable"},
]

CAMPOS = ("temperatura", "vibracion", "horas", "consumo")

CASOS_DEMOSTRACION = [
    {"nombre": "Similar a estable", "motor": {"temperatura": 41, "vibracion": 1.6, "horas": 38, "consumo": 4}},
    {"nombre": "Indicadores contradictorios", "motor": {"temperatura": 88, "vibracion": 1.5, "horas": 35, "consumo": 32}},
    {"nombre": "Entre dos estados", "motor": {"temperatura": 72, "vibracion": 5.4, "horas": 190, "consumo": 21}},
]
