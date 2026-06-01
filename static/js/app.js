const QUESTIONS = {
    p1: { title: "¿Utiliza usted la aplicación Yape?", options: { a: "Sí", b: "No" } },
    p2: { title: "¿Con qué frecuencia utiliza Yape?", options: { a: "Varias veces al día", b: "Una vez al día", c: "Varias veces por semana", d: "Ocasionalmente" } },
    p3: { title: "¿Considera que Yape es una aplicación segura?", options: { a: "Muy segura", b: "Segura", c: "Poco segura", d: "Nada segura" } },
    p4: { title: "¿Ha recibido mensajes, llamadas o enlaces sospechosos relacionados con Yape?", options: { a: "Sí", b: "No" } },
    p5: { title: "¿Ha sido víctima de algún fraude o intento de estafa relacionado con Yape?", options: { a: "Sí", b: "No" } },
    p6: { title: "¿Qué problema considera más frecuente en el uso de Yape?", options: { a: "Yapeos falsos", b: "Robo de cuentas", c: "Suplantación de identidad", d: "Errores de conexión", e: "Otros" } },
    p7: { title: "¿Utiliza medidas de seguridad adicionales en su celular (huella digital, reconocimiento facial o bloqueo de pantalla)?", options: { a: "Sí", b: "No" } },
    p8: { title: "¿Conoce las recomendaciones básicas de ciberseguridad para proteger su cuenta de Yape?", options: { a: "Sí", b: "No" } },
    p9: { title: "¿Cree que Yape debería implementar más medidas de seguridad para proteger a sus usuarios?", options: { a: "Sí", b: "No", c: "No estoy seguro(a)" } },
    p10: { title: "¿Qué medida considera más importante para mejorar la seguridad de Yape?", options: { a: "Verificación biométrica", b: "Alertas de actividad sospechosa", c: "Mayor educación sobre seguridad digital", d: "Mejor monitoreo de transacciones", e: "Todas las anteriores" } }
};
 
function updateGlobalCounter() {
    const data = JSON.parse(localStorage.getItem('yape_data') || '[]');
    const counterEl = document.getElementById('userCount');
    if (counterEl) counterEl.textContent = data.length;
}

function showSection(id, btn) {
    document.querySelectorAll('.section-card').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link-custom').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    if(id === 'statsSection') renderStats();
}

function initForm() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = ''; // Limpiar el contenedor antes de añadir las preguntas
    Object.entries(QUESTIONS).forEach(([id, q]) => {
        let optsHtml = Object.entries(q.options).map(([val, label]) => `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="${id}" value="${val}" id="${id}${val}" required>
                <label class="form-check-label w-100" for="${id}${val}">${label}</label>
            </div>
        `).join('');
        container.innerHTML += `<div class="mb-4"><label class="form-label fw-bold">${q.title}</label>${optsHtml}</div>`;
    });
    updateGlobalCounter();
}

document.getElementById('encuestaForm').onsubmit = (e) => {
    e.preventDefault();
    const responses = JSON.parse(localStorage.getItem('yape_data') || '[]');
    const formData = new FormData(e.target);
    const newResp = { answers: {} }; // Se elimina el campo 'nombre'
    Object.keys(QUESTIONS).forEach(k => newResp.answers[k] = formData.get(k));
    responses.push(newResp);
    localStorage.setItem('yape_data', JSON.stringify(responses));
    alert('¡Enviado con éxito!');
    updateGlobalCounter();
    e.target.reset();
};

function renderStats() {
    const data = JSON.parse(localStorage.getItem('yape_data') || '[]');
    const chartsCont = document.getElementById('chartsContainer');
    chartsCont.innerHTML = '';
    
    if(data.length === 0) {
        chartsCont.innerHTML = '<div class="text-center py-5 text-muted">Aún no hay datos para mostrar.</div>';
        return;
    }

    Object.entries(QUESTIONS).forEach(([id, q]) => {
        const counts = {};
        Object.keys(q.options).forEach(opt => counts[opt] = 0);
        
        // Contar respuestas de forma segura (evita errores si faltan preguntas en datos antiguos)
        data.forEach(r => { if (r.answers && r.answers[id]) counts[r.answers[id]]++; });

        // Cálculo de Pareto
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
        const labels = sorted.map(s => q.options[s[0]]);
        const frecs = sorted.map(s => s[1]);
        let total = frecs.reduce((a,b) => a+b, 0);
        let accum = 0;
        let lineData = [];

        if (total > 0) {
            lineData = frecs.map((f, i) => {
                accum += f;
                // Asegura que el último punto sea siempre 100%
                if (i === frecs.length - 1) return 100;
                return parseFloat(((accum / total) * 100).toFixed(1));
            });
        } else {
            lineData = frecs.map(() => 0); // All cumulative percentages are 0 if no data
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'card border-0 shadow-sm p-4';
        wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold m-0 text-secondary">${q.title}</h6>
                <span class="badge bg-light text-primary border">Pareto 80/20</span>
            </div>
            <div style="height: 300px;"><canvas id="chart-${id}"></canvas></div>`;
        chartsCont.appendChild(wrapper);

        new Chart(document.getElementById(`chart-${id}`), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '% Acumulado',
                        data: lineData,
                        type: 'line',
                        borderColor: '#e74c3c', // Rojo para el acumulado
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointBackgroundColor: '#e74c3c', // Puntos rojos
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        borderWidth: 3, // Línea más gruesa para mejor visibilidad
                        pointRadius: 6, // Puntos más grandes
                        yAxisID: 'y1',
                        order: 1
                    },
                    {
                    label: 'Frecuencia',
                    data: frecs,
                    backgroundColor: '#3498db', // Azul para la frecuencia
                    hoverBackgroundColor: '#2980b9', // Azul más oscuro al pasar el ratón
                    borderRadius: 0,
                    yAxisID: 'y',
                    order: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#333333', // Dark gray for legend text
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#000000', // Black tooltip background
                        titleColor: '#ffffff', // White title
                        bodyColor: '#ffffff', // White body text
                        borderColor: '#666666',
                        borderWidth: 1,
                        cornerRadius: 0, // Sharp corners for tooltip
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true, position: 'left',
                        title: { display: true, text: 'Frecuencia', color: '#333333', font: { size: 12, weight: 'bold' } },
                        ticks: { color: '#333333' },
                        grid: { color: '#e0e0e0' } // Light gray grid lines
                    },
                    y1: {
                        max: 100, position: 'right', grid: { display: false },
                        title: { display: true, text: '% Acumulado', color: '#333333', font: { size: 12, weight: 'bold' } },
                        ticks: { color: '#333333', callback: function(value) { return value + '%'; } }
                    }
                }
            }
        });
    });
}

initForm();