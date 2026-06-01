async function loadDetailedStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        document.getElementById('totalRespuestasE').textContent = `${data.total_responses} respuestas`;
        
        const container = document.getElementById('statsContainer');
        container.innerHTML = '';

        if (data.total_responses === 0) {
            container.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-database-exclamation fs-1"></i><p>No hay datos recolectados aún.</p></div>';
            return;
        }

        Object.keys(data.questions).forEach((qKey, index) => {
            const q = data.questions[qKey];
            // Asegurar orden descendente para Pareto si la API no lo envía ordenado
            q.items.sort((a, b) => b.count - a.count);
            
            const section = document.createElement('div');
            section.className = 'mb-5 p-3 bg-white rounded shadow-sm';
            
            section.innerHTML = `
                <h6 class="fw-bold text-primary mb-3">${index + 1}. ${q.question}</h6>
                <div class="row">
                    <div class="col-md-5">
                        <table class="table table-sm table-hover border">
                            <thead class="table-light">
                                <tr>
                                    <th>Opción</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-center">Cant. Acum.</th>
                                    <th class="text-center">% Acum.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${q.items.map(i => `
                                    <tr>
                                        <td><small>${i.label}</small></td>
                                        <td class="text-center">${i.count}</td>
                                        <td class="text-center text-muted">${i.cumulativeCount || 0}</td>
                                        <td class="text-center"><span class="badge ${i.cumulative > 80 ? 'bg-dark' : 'bg-secondary'}">${i.cumulative}%</span></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="col-md-7">
                        <canvas id="pareto-${qKey}" height="200"></canvas>
                    </div>
                </div>
            `;
            container.appendChild(section);
            renderPareto(qKey, q);
        });
    } catch (err) {
        console.error("Error cargando recolección de datos:", err);
    }
}

function renderPareto(id, qData) {
    const ctx = document.getElementById(`pareto-${id}`).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: qData.items.map(i => i.label.substring(0, 15) + '...'),
            datasets: [
                {
                    label: 'Frecuencia',
                    data: qData.items.map(i => i.count),
                    backgroundColor: '#3498db', // Azul para la frecuencia
                    hoverBackgroundColor: '#333333',
                    borderRadius: 0,
                    yAxisID: 'y'
                },
                {
                    label: '% Acumulado',
                    data: qData.items.map(i => i.cumulative),
                    type: 'line',
                    borderColor: '#e74c3c', // Rojo para el acumulado
                    borderWidth: 3, // Visibilidad profesional
                    backgroundColor: 'transparent',
                    pointBackgroundColor: '#e74c3c', // Puntos rojos
                    pointBorderColor: '#ffffff',
                    pointRadius: 5,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#333333', // Dark gray for legend text
                        font: { size: 12 } // Tamaño de fuente para la leyenda
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
            scales: { // Dark gray ticks, light gray grid
                y: { beginAtZero: true, ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, title: { display: true, text: 'Frecuencia', color: '#333333', font: { size: 12, weight: 'bold' } } },
                y1: { max: 100, position: 'right', grid: { display: false }, ticks: { color: '#333333', callback: function(value) { return value + '%'; } }, title: { display: true, text: '% Acumulado', color: '#333333', font: { size: 12, weight: 'bold' } } }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', loadDetailedStats);