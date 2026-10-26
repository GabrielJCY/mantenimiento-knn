import unittest

from datos_motores import REGISTROS, CASOS_DEMOSTRACION
from knn import KNN, evaluar_loo
try:
    from main import Motor, SolicitudPrediccion, predecir, obtener_motores, evaluacion
except ImportError:
    Motor = None  # Permite ejecutar pruebas del algoritmo sin instalar FastAPI.


class PruebasKNN(unittest.TestCase):
    def test_registros_originales(self):
        self.assertEqual(len(REGISTROS), 10)
        self.assertEqual({r["estado"] for r in REGISTROS}, {"Estable", "Atención", "Crítico"})

    def test_similar_estable(self):
        modelo = KNN(3).entrenar(REGISTROS)
        self.assertEqual(modelo.predecir(CASOS_DEMOSTRACION[0]["motor"])["estado"], "Estable")

    def test_vecinos_y_votos(self):
        salida = KNN(3).entrenar(REGISTROS).predecir(CASOS_DEMOSTRACION[1]["motor"])
        self.assertEqual(len(salida["vecinos"]), 3)
        self.assertEqual(sum(salida["votos"].values()), 3)
        self.assertEqual(salida["vecinos"], sorted(salida["vecinos"], key=lambda r: r["distancia"]))

    def test_excluye_caso_evaluado(self):
        resultado = evaluar_loo(REGISTROS, 3)
        self.assertEqual(resultado["total"], 10)
        self.assertEqual(sum(sum(fila.values()) for fila in resultado["matriz_confusion"].values()), 10)

    @unittest.skipIf(Motor is None, "FastAPI no está instalado en este entorno")
    def test_api(self):
        self.assertEqual(obtener_motores()["total"], 10)
        pred = predecir(SolicitudPrediccion(motor=Motor(**CASOS_DEMOSTRACION[0]["motor"]), k=3))
        self.assertEqual(pred["estado"], "Estable")
        self.assertEqual(evaluacion(3)["total"], 10)

    def test_k_invalido(self):
        with self.assertRaises(ValueError):
            KNN(0)

    def test_escalas_constantes(self):
        datos = [dict(REGISTROS[0], id=f"C{i}") for i in range(3)]
        self.assertEqual(KNN(3).entrenar(datos).predecir(datos[0])["estado"], "Estable")


if __name__ == "__main__":
    unittest.main()
