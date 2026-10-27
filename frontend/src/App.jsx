
import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Gauge,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  Layers3,
  Cpu,
  Menu,
  X,
  Sparkles,
  Database,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ==========================================================
// CONFIGURACIÓN DE LA API
// ==========================================================

const API = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

console.log("[MOTORIA] API configurada:", API);

// ==========================================================
// VARIABLES DEL MOTOR
// ==========================================================

const campos = [
  ["temperatura", "Temperatura", "°C"],
  ["vibracion", "Vibración", "mm/s"],
  ["horas", "Horas desde revisión", "h"],
  ["consumo", "Variación de consumo", "%"],
];

const inicial = {
  temperatura: "65",
  vibracion: "4.2",
  horas: "150",
  consumo: "15",
};

// ==========================================================
// NAVEGACIÓN
// ==========================================================

const opciones = [
  ["analisis", "Analizar motor", Gauge],
  ["registros", "Datos históricos", ClipboardList],
  ["evaluacion", "Rendimiento del modelo", BarChart3],
  ["metodo", "Cómo funciona", BrainCircuit],
];

// ==========================================================
// BURBUJAS LIQUID GLASS
// ==========================================================

const burbujas = [
  { x: "7%", y: "68%", s: 44, delay: 0, duration: 3.4 },
  { x: "18%", y: "27%", s: 18, delay: 0.2, duration: 3.0 },
  { x: "31%", y: "82%", s: 68, delay: 0.07, duration: 4.0 },
  { x: "46%", y: "39%", s: 32, delay: 0.36, duration: 3.7 },
  { x: "59%", y: "72%", s: 22, delay: 0.18, duration: 3.2 },
  { x: "73%", y: "17%", s: 81, delay: 0.11, duration: 4.5 },
  { x: "85%", y: "62%", s: 34, delay: 0.42, duration: 3.5 },
  { x: "94%", y: "30%", s: 16, delay: 0.3, duration: 3.1 },
];

function Burbujas({ pagina }) {
  return (
    <div
      className="bubble-layer"
      key={pagina}
      aria-hidden="true"
    >
      {burbujas.map((burbuja, indice) => (
        <span
          key={indice}
          className="glass-bubble"
          style={{
            "--x": burbuja.x,
            "--y": burbuja.y,
            "--size": `${burbuja.s}px`,
            "--delay": `${burbuja.delay}s`,
            "--duration": `${burbuja.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ==========================================================
// COMUNICACIÓN CON FASTAPI
// ==========================================================

async function obtener(ruta, opciones = {}) {
  const url = `${API}${ruta}`;

  console.log("[MOTORIA] Solicitando:", url);

  let respuesta;

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: {
        Accept: "application/json",
        ...opciones.headers,
      },
    });
  } catch (error) {
    console.error("[MOTORIA] Error de red:", {
      url,
      mensaje: error.message,
      error,
    });

    throw new Error(
      `No se pudo acceder a ${url}. ` +
      `Comprueba la URL del backend, CORS y el estado del servidor. ` +
      `Detalle: ${error.message}`
    );
  }

  if (!respuesta.ok) {
    let detalle = "";

    try {
      const cuerpo = await respuesta.json();

      detalle =
        typeof cuerpo.detail === "string"
          ? cuerpo.detail
          : JSON.stringify(cuerpo);
    } catch {
      detalle = respuesta.statusText;
    }

    console.error("[MOTORIA] Error HTTP:", {
      url,
      estado: respuesta.status,
      detalle,
    });

    throw new Error(
      `HTTP ${respuesta.status} en ${ruta}. ${detalle}`
    );
  }

  const datos = await respuesta.json();

  console.log("[MOTORIA] Respuesta recibida:", ruta, datos);

  return datos;
}

// ==========================================================
// ETIQUETA DE ESTADO
// ==========================================================

function Etiqueta({ estado }) {
  const color =
    estado === "Estable"
      ? "verde"
      : estado === "Crítico"
        ? "roja"
        : "amarilla";

  return (
    <span className={`etiqueta ${color}`}>
      {estado}
    </span>
  );
}

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================

export default function App() {
  const [pagina, setPagina] = useState("analisis");

  const [motor, setMotor] = useState(inicial);
  const [k, setK] = useState(3);

  const [resultado, setResultado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [casos, setCasos] = useState([]);
  const [evaluacion, setEvaluacion] = useState(null);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [menuAbierto, setMenuAbierto] = useState(false);

  // ========================================================
  // CARGAR DATOS HISTÓRICOS
  // ========================================================

  useEffect(() => {
    async function cargarDatos() {
      try {
        const datos = await obtener("/api/motores");

        if (!Array.isArray(datos.registros)) {
          throw new Error(
            "El backend no devolvió una lista de motores válida."
          );
        }

        setRegistros(datos.registros);
      } catch (err) {
        console.error(
          "[MOTORIA] No se pudieron cargar los motores:",
          err
        );

        setError(
          `Error al cargar motores: ${err.message}`
        );
      }

      try {
        const datosCasos = await obtener("/api/casos");

        setCasos(
          Array.isArray(datosCasos.casos)
            ? datosCasos.casos
            : []
        );
      } catch (err) {
        console.error(
          "[MOTORIA] No se pudieron cargar los casos:",
          err
        );
      }
    }

    cargarDatos();
  }, []);

  // ========================================================
  // EVALUAR MODELO
  // ========================================================

  useEffect(() => {
    if (pagina !== "evaluacion") return;

    async function cargarEvaluacion() {
      try {
        setError("");
        setEvaluacion(null);

        const datos = await obtener(
          `/api/evaluacion?k=${k}`
        );

        setEvaluacion(datos);
      } catch (err) {
        setError(
          `Error al evaluar el modelo: ${err.message}`
        );
      }
    }

    cargarEvaluacion();
  }, [pagina, k]);

  // ========================================================
  // NAVEGACIÓN
  // ========================================================

  const navegar = (id) => {
    setPagina(id);
    setError("");
    setMenuAbierto(false);
  };

  // ========================================================
  // ACTUALIZAR MOTOR
  // ========================================================

  const actualizarMotor = (clave, valor) => {
    setMotor((anterior) => ({
      ...anterior,
      [clave]: valor,
    }));

    setResultado(null);
  };

  // ========================================================
  // CARGAR CASO DE DEMOSTRACIÓN
  // ========================================================

  const cargarCaso = (caso) => {
    const valores = Object.fromEntries(
      Object.entries(caso.motor).map(
        ([clave, valor]) => [
          clave,
          String(valor),
        ]
      )
    );

    setMotor(valores);
    setResultado(null);
    setPagina("analisis");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================================
  // CLASIFICAR MOTOR
  // ========================================================

  async function analizar(evento) {
    evento.preventDefault();

    setError("");
    setResultado(null);

    const datos = Object.fromEntries(
      campos.map(([clave]) => [
        clave,
        Number(motor[clave]),
      ])
    );

    const datosInvalidos = campos.some(
      ([clave]) =>
        motor[clave].trim() === "" ||
        !Number.isFinite(datos[clave])
    );

    const negativos = [
      "temperatura",
      "vibracion",
      "horas",
    ].some((clave) => datos[clave] < 0);

    if (datosInvalidos || negativos) {
      setError(
        "Completa las cuatro variables con números válidos."
      );
      return;
    }

    setCargando(true);

    try {
      const prediccion = await obtener(
        "/api/predecir",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            motor: datos,
            k,
          }),
        }
      );

      if (!prediccion.estado) {
        throw new Error(
          "La API no devolvió un estado de clasificación."
        );
      }

      setResultado(prediccion);

      console.log(
        "[MOTORIA] Clasificación completada:",
        prediccion
      );
    } catch (err) {
      setError(
        `No se pudo obtener la clasificación: ${err.message}`
      );
    } finally {
      setCargando(false);
    }
  }

  // ========================================================
  // INTERFAZ
  // ========================================================

  const tituloActual =
    opciones.find(([id]) => id === pagina)?.[1] ||
    "Dashboard";

  return (
    <div className="app">
      {/* FONDO ANIMADO */}

      <div
        className="ambient ambient-uno"
        aria-hidden="true"
      />

      <div
        className="ambient ambient-dos"
        aria-hidden="true"
      />

      <Burbujas pagina={pagina} />

      {/* OVERLAY MÓVIL */}

      {menuAbierto && (
        <button
          className="menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar liquid ${
          menuAbierto ? "menu-abierto" : ""
        }`}
      >
        <div className="marca">
          <div className="logo">
            <Layers3 size={24} />
          </div>

          <div>
            <strong>
              MOTOR<span>IA</span>
            </strong>

            <small>
              Intelligent Maintenance
            </small>
          </div>

          <button
            className="cerrar-menu"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-caption">
          NAVEGACIÓN
        </p>

        <nav aria-label="Módulos del sistema">
          {opciones.map(([id, titulo, Icono]) => (
            <button
              type="button"
              key={id}
              title={titulo}
              aria-current={
                pagina === id
                  ? "page"
                  : undefined
              }
              className={
                pagina === id
                  ? "activo"
                  : ""
              }
              onClick={() => navegar(id)}
            >
              <Icono size={19} />
              <span>{titulo}</span>

              {pagina === id && (
                <ArrowUpRight
                  className="nav-flecha"
                  size={15}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-pie">
          <span className="punto" />
          MOTOR OPERATIVO

          <small>
            Motor de clasificación · K-NN
          </small>
        </div>
      </aside>

      {/* CONTENIDO */}

      <main>
        <header className="cabecera">
          <div className="cabecera-texto">
            <div className="mobile-brand">
              <button
                className="abrir-menu"
                onClick={() => setMenuAbierto(true)}
                aria-label="Abrir menú"
              >
                <Menu size={22} />
              </button>

              <strong>
                MOTOR<span>IA</span>
              </strong>
            </div>

            <span className="eyebrow">
              PLATAFORMA / INTELIGENCIA ARTIFICIAL
            </span>

            <h1>{tituloActual}</h1>

            <p>
              Diagnóstico orientativo de motores
              mediante aprendizaje supervisado.
            </p>
          </div>

          <div className="estado-api">
            <span className="punto" />
            SISTEMA DISPONIBLE
            <Cpu size={17} />
          </div>
        </header>

        {/* MENSAJE DE ERROR */}

        {error && (
          <div className="error" role="alert">
            <AlertTriangle size={18} />

            <span>{error}</span>

            <button
              onClick={() => setError("")}
            >
              Cerrar
            </button>
          </div>
        )}

        <div
          key={pagina}
          className="modulo-contenido"
        >
          {/* =====================================
              MÓDULO: ANÁLISIS
          ===================================== */}

          {pagina === "analisis" && (
            <>
              <section className="hero liquid">
                <div className="hero-contenido">
                  <span className="chip">
                    <Sparkles size={15} />
                    SISTEMA INTELIGENTE · K-NN
                  </span>

                  <h2>
                    La inteligencia detrás de cada{" "}
                    <em>decisión.</em>
                  </h2>

                  <p>
                    Analiza la condición operativa de tus
                    equipos con un modelo de clasificación
                    transparente, medible y explicable.
                  </p>

                  <div className="hero-meta">
                    <span>
                      <Database size={15} />
                      10 datos históricos
                    </span>

                    <span>
                      <Activity size={15} />
                      3 estados operativos
                    </span>
                  </div>
                </div>

                <div
                  className="hero-visual"
                  aria-hidden="true"
                >
                  <div className="orb orb-exterior">
                    <div className="orb orb-interior">
                      <Activity
                        size={60}
                        strokeWidth={1.3}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="dos-columnas">
                {/* FORMULARIO */}

                <form
                  onSubmit={analizar}
                  className="panel"
                >
                  <div className="titulo-panel">
                    <div>
                      <h3>Datos del motor</h3>

                      <p>
                        Temperatura, vibración,
                        uso y consumo.
                      </p>
                    </div>

                    <Gauge />
                  </div>

                  <div className="campos">
                    {campos.map(
                      ([clave, nombre, unidad]) => (
                        <label key={clave}>
                          {nombre}

                          <div className="entrada">
                            <input
                              required
                              type="number"
                              step="any"
                              min={
                                clave === "consumo"
                                  ? undefined
                                  : 0
                              }
                              value={motor[clave]}
                              onChange={(e) =>
                                actualizarMotor(
                                  clave,
                                  e.target.value
                                )
                              }
                            />

                            <span>
                              {unidad}
                            </span>
                          </div>
                        </label>
                      )
                    )}
                  </div>

                  <label className="selector">
                    Vecinos del modelo (k)

                    <select
                      value={k}
                      onChange={(e) => {
                        setK(
                          Number(e.target.value)
                        );

                        setResultado(null);
                      }}
                    >
                      {[1, 3, 5, 7, 9].map(
                        (valor) => (
                          <option
                            key={valor}
                            value={valor}
                          >
                            {valor} vecinos
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <div className="botones">
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => {
                        setMotor(inicial);
                        setResultado(null);
                      }}
                    >
                      <RotateCcw size={16} />
                      Restablecer
                    </button>

                    <button
                      type="submit"
                      className="primario"
                      disabled={cargando}
                    >
                      <BrainCircuit size={18} />

                      {cargando
                        ? "Analizando..."
                        : "Obtener clasificación"}
                    </button>
                  </div>
                </form>

                {/* RESULTADOS */}

                <section className="panel resultados">
                  <div className="titulo-panel">
                    <div>
                      <h3>
                        Clasificación del equipo
                      </h3>

                      <p>
                        Predicción y decisión recomendada.
                      </p>
                    </div>

                    <ShieldAlert />
                  </div>

                  {resultado ? (
                    <div className="prediccion">
                      <span className="eyebrow">
                        ESTADO ESTIMADO
                      </span>

                      <h2>
                        {resultado.estado}
                      </h2>

                      <Etiqueta
                        estado={resultado.estado}
                      />

                      <div className="recomendacion">
                        <strong>
                          Recomendación
                        </strong>

                        <p>
                          {resultado.recomendacion}
                        </p>
                      </div>

                      <h4>
                        Votos de los {resultado.k} vecinos
                      </h4>

                      {Object.entries(
                        resultado.votos
                      ).map(([clase, votos]) => (
                        <div
                          className="voto"
                          key={clase}
                        >
                          <span>{clase}</span>
                          <strong>{votos}</strong>

                          <div>
                            <i
                              style={{
                                width: `${
                                  (100 * votos) /
                                  resultado.k
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      <p className="advertencia">
                        {resultado.advertencia}
                      </p>
                    </div>
                  ) : (
                    <div className="vacio">
                      <BrainCircuit size={52} />

                      <h3>
                        Esperando datos
                      </h3>

                      <p>
                        Introduce valores y presiona
                        «Obtener clasificación».
                      </p>
                    </div>
                  )}
                </section>
              </div>

              {/* CASOS DE PRUEBA */}

              <section className="panel">
                <div className="titulo-panel">
                  <div>
                    <h3>
                      Casos de prueba obligatorios
                    </h3>

                    <p>
                      Prueba un motor estable,
                      uno con indicadores contradictorios
                      y uno entre estados.
                    </p>
                  </div>
                </div>

                <div className="casos">
                  {casos.map((caso) => (
                    <button
                      type="button"
                      key={caso.nombre}
                      onClick={() =>
                        cargarCaso(caso)
                      }
                    >
                      <strong>
                        {caso.nombre}
                      </strong>

                      <small>
                        {caso.motor.temperatura} °C ·{" "}
                        {caso.motor.vibracion} mm/s ·{" "}
                        {caso.motor.horas} h ·{" "}
                        {caso.motor.consumo}%
                      </small>
                    </button>
                  ))}
                </div>
              </section>

              {/* VECINOS MÁS CERCANOS */}

              {resultado && (
                <section className="panel">
                  <h3>
                    Explicación de vecinos próximos
                  </h3>

                  <p>
                    Distancias euclidianas después
                    de normalizar las características.
                  </p>

                  <div className="tabla">
                    <table>
                      <thead>
                        <tr>
                          <th>Motor</th>
                          <th>Estado histórico</th>
                          <th>Distancia</th>
                        </tr>
                      </thead>

                      <tbody>
                        {resultado.vecinos.map(
                          (vecino) => (
                            <tr key={vecino.id}>
                              <td>
                                {vecino.id}
                              </td>

                              <td>
                                <Etiqueta
                                  estado={vecino.estado}
                                />
                              </td>

                              <td>
                                {vecino.distancia.toFixed(6)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* =====================================
              MÓDULO: DATOS HISTÓRICOS
          ===================================== */}

          {pagina === "registros" && (
            <section className="panel">
              <div className="titulo-panel">
                <div>
                  <h3>
                    Diez motores de entrenamiento
                  </h3>

                  <p>
                    Datos académicos simulados,
                    no mediciones industriales reales.
                  </p>
                </div>

                <ClipboardList />
              </div>

              <div className="tabla">
                <table>
                  <thead>
                    <tr>
                      <th>Registro</th>
                      <th>Temperatura</th>
                      <th>Vibración</th>
                      <th>Horas</th>
                      <th>Consumo</th>
                      <th>Clase</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registros.map((registro) => (
                      <tr key={registro.id}>
                        <td>
                          <strong>
                            {registro.id}
                          </strong>
                        </td>

                        <td>
                          {registro.temperatura} °C
                        </td>

                        <td>
                          {registro.vibracion} mm/s
                        </td>

                        <td>
                          {registro.horas}
                        </td>

                        <td>
                          {registro.consumo}%
                        </td>

                        <td>
                          <Etiqueta
                            estado={registro.estado}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* =====================================
              MÓDULO: EVALUACIÓN
          ===================================== */}

          {pagina === "evaluacion" && (
            <>
              <div className="estadisticas">
                <div>
                  <span>
                    Casos evaluados
                  </span>

                  <strong>
                    {evaluacion?.total ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Aciertos
                  </span>

                  <strong>
                    {evaluacion?.aciertos ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Exactitud
                  </span>

                  <strong>
                    {evaluacion
                      ? `${
                          (
                            evaluacion.exactitud *
                            100
                          ).toFixed(1)
                        }%`
                      : "—"}
                  </strong>
                </div>
              </div>

              <section className="panel">
                <div className="titulo-panel">
                  <div>
                    <h3>
                      Validación dejando uno fuera
                    </h3>

                    <p>
                      Cada registro se evalúa utilizando
                      únicamente los otros nueve.
                    </p>
                  </div>

                  <select
                    value={k}
                    onChange={(e) =>
                      setK(
                        Number(e.target.value)
                      )
                    }
                  >
                    {[1, 3, 5, 7, 9].map(
                      (valor) => (
                        <option
                          key={valor}
                          value={valor}
                        >
                          k = {valor}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {evaluacion && (
                  <>
                    <div className="tabla">
                      <table>
                        <thead>
                          <tr>
                            <th>Motor</th>
                            <th>Clase real</th>
                            <th>Clase predicha</th>
                            <th>Evaluación</th>
                          </tr>
                        </thead>

                        <tbody>
                          {evaluacion.detalles.map(
                            (detalle) => (
                              <tr key={detalle.id}>
                                <td>
                                  {detalle.id}
                                </td>

                                <td>
                                  <Etiqueta
                                    estado={detalle.real}
                                  />
                                </td>

                                <td>
                                  <Etiqueta
                                    estado={detalle.predicho}
                                  />
                                </td>

                                <td
                                  className={
                                    detalle.correcto
                                      ? "bien"
                                      : "mal"
                                  }
                                >
                                  {detalle.correcto
                                    ? "Correcto"
                                    : "Error"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="grafico">
                      <ResponsiveContainer
                        width="100%"
                        height={250}
                      >
                        <BarChart
                          data={Object.entries(
                            evaluacion.matriz_confusion
                          ).map(([clase, fila]) => ({
                            clase,

                            aciertos: fila[clase],

                            errores: Object.entries(
                              fila
                            ).reduce(
                              (
                                suma,
                                [nombre, valor]
                              ) =>
                                suma +
                                (
                                  nombre === clase
                                    ? 0
                                    : valor
                                ),
                              0
                            ),
                          }))}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#404857"
                          />

                          <XAxis
                            dataKey="clase"
                            stroke="#a8b4c8"
                          />

                          <YAxis
                            stroke="#a8b4c8"
                            allowDecimals={false}
                          />

                          <Tooltip
                            contentStyle={{
                              background: "#1e222c",
                              border: "1px solid #49505e",
                              borderRadius: 12,
                              color: "#fff",
                            }}
                          />

                          <Bar
                            dataKey="aciertos"
                            fill="#8bb6ff"
                            name="Aciertos"
                          />

                          <Bar
                            dataKey="errores"
                            fill="#f38b9c"
                            name="Errores"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="advertencia">
                      {evaluacion.limitacion}
                    </p>
                  </>
                )}
              </section>
            </>
          )}

          {/* =====================================
              MÓDULO: MÉTODO K-NN
          ===================================== */}

          {pagina === "metodo" && (
            <div className="dos-columnas">
              <section className="panel">
                <h3>
                  Cómo funciona K-NN
                </h3>

                <ol className="pasos">
                  <li>
                    Guardar ejemplos con clases
                    conocidas: estable, atención y crítico.
                  </li>

                  <li>
                    Ajustar mínimos y máximos
                    utilizando exclusivamente
                    los datos de entrenamiento.
                  </li>

                  <li>
                    Normalizar las cuatro
                    características de cada motor.
                  </li>

                  <li>
                    Calcular distancias euclidianas
                    y elegir los k vecinos más cercanos.
                  </li>

                  <li>
                    Contar los votos y resolver
                    posibles empates mediante
                    las distancias.
                  </li>
                </ol>
              </section>

              <section className="panel">
                <h3>
                  Consideraciones de mantenimiento
                </h3>

                <p>
                  La etiqueta clasificada no demuestra
                  que un motor vaya a fallar.
                  Diez registros simulados no bastan
                  para validar su uso industrial.
                </p>

                <p>
                  Un falso «Estable» puede retrasar
                  una inspección, mientras que
                  demasiados falsos «Críticos»
                  pueden desperdiciar recursos.
                </p>

                <div className="recomendacion">
                  <strong>
                    Decisión humana
                  </strong>

                  <p>
                    La IA recomienda una prioridad.
                    El responsable debe verificar
                    las mediciones y decidir
                    el mantenimiento final.
                  </p>
                </div>
              </section>
            </div>
          )}
        </div>

   
      </main>
    </div>
  );
}
