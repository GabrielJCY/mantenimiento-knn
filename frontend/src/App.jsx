
import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, BrainCircuit,
  ClipboardList, Gauge, RotateCcw, ShieldAlert,
  ArrowUpRight, Layers3, Cpu, Menu, X, Sparkles, Database
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis,
  YAxis, Tooltip, CartesianGrid
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  consumo: "15"
};

const opciones = [
  ["analisis", "Analizar motor", Gauge],
  ["registros", "Datos históricos", ClipboardList],
  ["evaluacion", "Rendimiento del modelo", BarChart3],
];

const burbujas = [
  { x: "7%", y: "68%", s: 44, delay: 0, duration: 3.4 },
  { x: "18%", y: "27%", s: 18, delay: .2, duration: 3.0 },
  { x: "31%", y: "82%", s: 68, delay: .07, duration: 4.0 },
  { x: "46%", y: "39%", s: 32, delay: .36, duration: 3.7 },
  { x: "59%", y: "72%", s: 22, delay: .18, duration: 3.2 },
  { x: "73%", y: "17%", s: 81, delay: .11, duration: 4.5 },
  { x: "85%", y: "62%", s: 34, delay: .42, duration: 3.5 },
  { x: "94%", y: "30%", s: 16, delay: .3, duration: 3.1 },
];

function Burbujas({ pagina }) {
  return (
    <div className="bubble-layer" key={pagina} aria-hidden="true">
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

async function obtener(ruta, opciones) {
  const respuesta = await fetch(`${API}${ruta}`, opciones);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

function Etiqueta({ estado }) {
  const color =
    estado === "Estable" ? "verde" :
    estado === "Crítico" ? "roja" : "amarilla";

  return <span className={`etiqueta ${color}`}>{estado}</span>;
}

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

  useEffect(() => {
    obtener("/api/motores")
      .then(d => setRegistros(d.registros))
      .catch(() => setError("No se pudo conectar con FastAPI. Comprueba el puerto 8000."));

    obtener("/api/casos")
      .then(d => setCasos(d.casos))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pagina !== "evaluacion") return;
    setEvaluacion(null);
    obtener(`/api/evaluacion?k=${k}`)
      .then(setEvaluacion)
      .catch(e => setError(e.message));
  }, [pagina, k]);

  const navegar = (id) => {
    setPagina(id);
    setError("");
    setMenuAbierto(false);
  };

  const cargarCaso = (caso) => {
    setMotor(
      Object.fromEntries(
        Object.entries(caso.motor).map(([clave, valor]) => [
          clave, String(valor)
        ])
      )
    );
    setResultado(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function analizar(evento) {
    evento.preventDefault();
    setError("");
    setResultado(null);

    const datos = Object.fromEntries(
      campos.map(([clave]) => [clave, Number(motor[clave])])
    );

    const invalidos = campos.some(
      ([clave]) =>
        motor[clave].trim() === "" ||
        !Number.isFinite(datos[clave])
    );

    const negativos = ["temperatura", "vibracion", "horas"]
      .some(clave => datos[clave] < 0);

    if (invalidos || negativos) {
      setError("Completa las cuatro variables con números válidos.");
      return;
    }

    setCargando(true);

    try {
      const prediccion = await obtener("/api/predecir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motor: datos, k }),
      });
      setResultado(prediccion);
    } catch (e) {
      setError(`No se pudo obtener la clasificación: ${e.message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app">
      <div className="ambient ambient-uno" aria-hidden="true" />
      <div className="ambient ambient-dos" aria-hidden="true" />
      <Burbujas pagina={pagina} />

      {menuAbierto && (
        <button
          className="menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`sidebar liquid ${menuAbierto ? "menu-abierto" : ""}`}>
        <div className="marca">
          <div className="logo"><Layers3 size={24} /></div>
          <div>
            <strong>MOTOR<span>IA</span></strong>
            <small>Intelligent Maintenance</small>
          </div>
          <button
            className="cerrar-menu"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-caption">NAVEGACIÓN</p>

        <nav aria-label="Módulos del sistema">
          {opciones.map(([id, titulo, Icono]) => (
            <button
              type="button"
              key={id}
              title={titulo}
              aria-current={pagina === id ? "page" : undefined}
              className={pagina === id ? "activo" : ""}
              onClick={() => navegar(id)}
            >
              <Icono size={19} />
              <span>{titulo}</span>
              {pagina === id && (
                <ArrowUpRight className="nav-flecha" size={15} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-pie">
          <span className="punto" />
          MOTOR OPERATIVO
          <small>Motor de clasificación · K-NN</small>
        </div>
      </aside>

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
              <strong>K-<span>NN</span></strong>
            </div>

            <span className="eyebrow">
              Universidad Tecnológica Boliviana 
            </span>
            <h1>{opciones.find(([id]) => id === pagina)?.[1]}</h1>
            <p>
              Diagnóstico orientativo de motores mediante
              aprendizaje supervisado.
            </p>
          </div>

          <div className="estado-api">
            <span className="punto" />
            SISTEMA DISPONIBLE
            <Cpu size={17} />
          </div>
        </header>

        {error && (
          <div className="error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")}>Cerrar</button>
          </div>
        )}

        <div key={pagina} className="modulo-contenido">

          {pagina === "analisis" && (
            <>
              <section className="hero liquid">
                <div className="hero-contenido">
                  <span className="chip">
                    <Sparkles size={15} />
                    SISTEMA INTELIGENTE · K-NN
                  </span>
                  <h2>
                    Inteligencia Artificial <em>ingeniería de sistemas</em>
                  </h2>
                  <p>
                    Analiza la condición operativa de tus equipos
                    con un modelo de clasificación transparente,
                    medible y explicable.
                  </p>
                  <div className="hero-meta">
                    <span><Database size={15} /> 10 datos históricos</span>
                    <span><Activity size={15} /> 3 estados operativos</span>
                  </div>
                </div>

                <div className="hero-visual" aria-hidden="true">
                  <div className="orb orb-exterior">
                    <div className="orb orb-interior">
                      <Activity size={60} strokeWidth={1.3} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="dos-columnas">
                <form onSubmit={analizar} className="panel">
                  <div className="titulo-panel">
                    <div>
                      <h3>Datos del motor</h3>
                      <p>Temperatura, vibración, uso y consumo.</p>
                    </div>
                    <Gauge />
                  </div>

                  <div className="campos">
                    {campos.map(([clave, nombre, unidad]) => (
                      <label key={clave}>
                        {nombre}
                        <div className="entrada">
                          <input
                            required
                            type="number"
                            step="any"
                            min={clave === "consumo" ? undefined : 0}
                            value={motor[clave]}
                            onChange={e => {
                              setMotor({
                                ...motor,
                                [clave]: e.target.value
                              });
                              setResultado(null);
                            }}
                          />
                          <span>{unidad}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <label className="selector">
                    Vecinos del modelo (k)
                    <select
                      value={k}
                      onChange={e => {
                        setK(Number(e.target.value));
                        setResultado(null);
                      }}
                    >
                      {[1, 3, 5, 7, 9].map(i => (
                        <option key={i} value={i}>{i} vecinos</option>
                      ))}
                    </select>
                  </label>

                  <div className="botones">
                    <button
                      className="secundario"
                      type="button"
                      onClick={() => {
                        setMotor(inicial);
                        setResultado(null);
                      }}
                    >
                      <RotateCcw size={16} />
                      Restablecer
                    </button>

                    <button className="primario" disabled={cargando}>
                      <BrainCircuit size={18} />
                      {cargando ? "Analizando..." : "Obtener clasificación"}
                    </button>
                  </div>
                </form>

                <section className="panel resultados">
                  <div className="titulo-panel">
                    <div>
                      <h3>Clasificación del equipo</h3>
                      <p>Predicción y decisión recomendada.</p>
                    </div>
                    <ShieldAlert />
                  </div>

                  
{resultado ? (
  <div
    key={`${resultado.estado}-${resultado.k}`}
    className={`prediccion prediccion-animada ${
      resultado.estado === "Estable"
        ? "estado-estable"
        : resultado.estado === "Atención"
          ? "estado-atencion"
          : "estado-critico"
    }`}
  >
    {/* INDICADOR ANIMADO */}
    <div className="estado-visual">
      <div className="estado-anillo anillo-exterior" />
      <div className="estado-anillo anillo-interior" />

      <div className="estado-icono">
        {resultado.estado === "Estable" ? (
          <Activity size={36} strokeWidth={1.7} />
        ) : (
          <ShieldAlert size={36} strokeWidth={1.7} />
        )}
      </div>
    </div>

    {/* CLASIFICACIÓN */}
    <span className="estado-subtitulo">
      RESULTADO DEL ANÁLISIS
    </span>

    <h2 className="estado-titulo">
      {resultado.estado}
    </h2>

    <div className="estado-badge">
      <span className="estado-indicador" />
      {resultado.estado === "Estable"
        ? "Condición estable"
        : resultado.estado === "Atención"
          ? "Requiere atención"
          : "Inspección prioritaria"}
    </div>

    {/* RECOMENDACIÓN */}
    <div className="recomendacion recomendacion-animada">
      <div className="recomendacion-encabezado">
        <BrainCircuit size={17} />
        <strong>Recomendación del sistema</strong>
      </div>

      <p>{resultado.recomendacion}</p>
    </div>

    {/* VOTOS K-NN */}
    <div className="votacion-contenedor">
      <div className="votacion-encabezado">
        <h4>Votación K-NN</h4>
        <span>{resultado.k} vecinos</span>
      </div>

      {Object.entries(resultado.votos).map(
        ([clase, votos], indice) => (
          <div
            className="voto-animado"
            key={clase}
            style={{
              animationDelay: `${0.4 + indice * 0.15}s`,
            }}
          >
            <div className="voto-informacion">
              <span>{clase}</span>

              <strong>
                {votos}
                <small> / {resultado.k}</small>
              </strong>
            </div>

            <div className="voto-progreso">
              <div
                className="voto-progreso-fill"
                style={{
                  "--progreso": `${
                    (votos / resultado.k) * 100
                  }%`,
                  animationDelay: `${
                    0.6 + indice * 0.15
                  }s`,
                }}
              />
            </div>
          </div>
        )
      )}
    </div>

    {/* ADVERTENCIA */}
    <p className="advertencia advertencia-animada">
      <AlertTriangle size={15} />
      {resultado.advertencia}
    </p>
  </div>
) : (
  <div className="vacio">
    <BrainCircuit size={52} />
    <h3>Esperando datos</h3>
    <p>
      Introduce valores y presiona
      «Obtener clasificación».
    </p>
  </div>
)}

                </section>
              </div>

              <section className="panel">
                <div className="titulo-panel">
                  <div>
                    <h3>Casos de prueba obligatorios</h3>
                    <p>
                      Prueba un motor estable, uno con indicadores
                      contradictorios y uno entre estados.
                    </p>
                  </div>
                </div>

                <div className="casos">
                  {casos.map(c => (
                    <button
                      type="button"
                      key={c.nombre}
                      onClick={() => cargarCaso(c)}
                    >
                      <strong>{c.nombre}</strong>
                      <small>
                        {c.motor.temperatura} °C ·{" "}
                        {c.motor.vibracion} mm/s ·{" "}
                        {c.motor.horas} h ·{" "}
                        {c.motor.consumo}%
                      </small>
                    </button>
                  ))}
                </div>
              </section>

              {resultado && (
                <section className="panel">
                  <h3>Explicación de vecinos próximos</h3>
                  <p>
                    Distancias euclidianas después de normalizar
                    las características del motor.
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
                        {resultado.vecinos.map(v => (
                          <tr key={v.id}>
                            <td>{v.id}</td>
                            <td><Etiqueta estado={v.estado} /></td>
                            <td>{v.distancia.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {pagina === "registros" && (
            <section className="panel">
              <div className="titulo-panel">
                <div>
                  <h3>Diez motores de entrenamiento</h3>
                  <p>
                    Datos académicos simulados, no mediciones
                    industriales reales.
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
                    {registros.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.id}</strong></td>
                        <td>{r.temperatura} °C</td>
                        <td>{r.vibracion} mm/s</td>
                        <td>{r.horas}</td>
                        <td>{r.consumo}%</td>
                        <td><Etiqueta estado={r.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {pagina === "evaluacion" && (
            <>
              <div className="estadisticas">
                <div>
                  <span>Casos evaluados</span>
                  <strong>{evaluacion?.total ?? "—"}</strong>
                </div>
                <div>
                  <span>Aciertos</span>
                  <strong>{evaluacion?.aciertos ?? "—"}</strong>
                </div>
                <div>
                  <span>Exactitud</span>
                  <strong>
                    {evaluacion
                      ? `${(evaluacion.exactitud * 100).toFixed(1)}%`
                      : "—"}
                  </strong>
                </div>
              </div>

              <section className="panel">
                <div className="titulo-panel">
                  <div>
                    <h3>Validación dejando uno fuera</h3>
                    <p>
                      Cada registro se evalúa utilizando
                      únicamente los otros nueve.
                    </p>
                  </div>

                  <select
                    value={k}
                    onChange={e => setK(Number(e.target.value))}
                  >
                    {[1, 3, 5, 7, 9].map(i => (
                      <option key={i} value={i}>k = {i}</option>
                    ))}
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
                          {evaluacion.detalles.map(d => (
                            <tr key={d.id}>
                              <td>{d.id}</td>
                              <td><Etiqueta estado={d.real} /></td>
                              <td><Etiqueta estado={d.predicho} /></td>
                              <td className={d.correcto ? "bien" : "mal"}>
                                {d.correcto ? "Correcto" : "Error"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grafico">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={Object.entries(
                            evaluacion.matriz_confusion
                          ).map(([clase, fila]) => ({
                            clase,
                            aciertos: fila[clase],
                            errores: Object.entries(fila).reduce(
                              (s, [c, v]) => s + (c === clase ? 0 : v),
                              0
                            ),
                          }))}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#404857"
                          />
                          <XAxis dataKey="clase" stroke="#a8b4c8" />
                          <YAxis stroke="#a8b4c8" allowDecimals={false} />
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

          {pagina === "metodo" && (
            <div className="dos-columnas">
              <section className="panel">
                <h3>Cómo funciona K-NN</h3>
                <ol className="pasos">
                  <li>
                    Guardar ejemplos con clases conocidas:
                    estable, atención y crítico.
                  </li>
                  <li>
                    Ajustar mínimos y máximos usando
                    exclusivamente el entrenamiento.
                  </li>
                  <li>
                    Normalizar las cuatro características
                    de cada motor.
                  </li>
                  <li>
                    Calcular distancias euclidianas y elegir
                    los k vecinos más cercanos.
                  </li>
                  <li>
                    Contar votos y resolver empates mediante
                    las distancias.
                  </li>
                </ol>
              </section>

              <section className="panel">
                <h3>Consideraciones de mantenimiento</h3>
                <p>
                  La etiqueta clasificada no demuestra que un
                  motor vaya a fallar. Diez registros simulados
                  no bastan para validar su uso industrial.
                </p>
                <p>
                  Un falso «Estable» puede retrasar una inspección,
                  mientras que demasiados falsos «Críticos»
                  desperdiciarían recursos.
                </p>
                <div className="recomendacion">
                  <strong>Decisión humana</strong>
                  <p>
                    La IA recomienda una prioridad. El responsable
                    debe verificar las mediciones y decidir el
                    mantenimiento final.
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
