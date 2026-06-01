const CHART_INSTANCES = {}; // Renamed to avoid conflict if CHARTS is used elsewhere

async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        const totalLabel = document.getElementById('totalRespuestasD');
        if (totalLabel) {
            totalLabel.textContent = data.total_responses + ' respuestas';
        }
        renderCharts(data);
        renderControlChart(data);
        renderScatterChart(data);
        renderHistogram(data);
        renderVerificationSheet(data);
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

function renderCharts(data) {
    const container = document.getElementById('chartsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (data.total_responses === 0) {
        container.innerHTML = '<div class="text-center py-5"><i class="bi bi-inbox fs-1 text-secondary"></i><p class="mt-2 text-secondary">No hay respuestas registradas aún.</p></div>';
        return;
    }

    Object.keys(data.questions).forEach((qKey, idx) => {
        const q = data.questions[qKey];
        
        // Forzar orden descendente de los datos para garantizar el efecto Pareto
        q.items.sort((a, b) => b.count - a.count);
        
        // Recalcular acumulados para asegurar precisión visual
        const total = q.items.reduce((acc, item) => acc + item.count, 0);
        let currentSum = 0;
        if (total > 0) {
            q.items.forEach((item, i) => {
                currentSum += item.count;
                // Asegura que el último punto sea siempre 100%
                if (i === q.items.length - 1) {
                    item.cumulative = 100;
                } else {
                    item.cumulative = parseFloat(((currentSum / total) * 100).toFixed(1));
                }
            });
        } else {
            q.items.forEach(item => item.cumulative = 0); // All cumulative percentages are 0 if no data
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';
        wrapper.innerHTML = `<div class="chart-title">${idx + 1}. ${q.question}</div><div class="chart-container"><canvas id="chart-${qKey}"></canvas></div>`;
        container.appendChild(wrapper);
        
        const canvas = document.getElementById('chart-' + qKey);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const itemLabels = q.items.map(i => i.label.length > 35 ? i.label.substring(0, 32) + '...' : i.label);
        const counts = q.items.map(i => i.count);
        const cumulatives = q.items.map(i => i.cumulative);
        
        if (CHART_INSTANCES[qKey]) CHART_INSTANCES[qKey].destroy();
        
        CHART_INSTANCES[qKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: itemLabels,
                datasets: [
                    {
                        label: 'Frecuencia',
                        data: counts,
                        backgroundColor: '#3498db', // Azul para la frecuencia
                        hoverBackgroundColor: '#2980b9', // Azul más oscuro al pasar el ratón
                        borderColor: '#000000',
                        borderWidth: 1,
                        borderRadius: 0, // Sharp corners
                        order: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: '% Acumulado',
                        data: cumulatives,
                        type: 'line',
                        borderColor: '#e74c3c', // Rojo para el acumulado
                        backgroundColor: 'transparent', // No fill under the line
                        borderWidth: 3,
                        pointBackgroundColor: '#e74c3c', // Puntos rojos
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6, // Puntos más visibles para oficina
                        tension: 0.3,
                        fill: false, // Explicitly no fill
                        borderDash: [5, 5], // Dashed line for accumulated percentage
                        order: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 768 ? 1 : 1.8, // Adjusted aspect ratio for better look
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: { size: 12, color: '#333333' } // Dark gray for legend text
                        }
                    },
                    tooltip: {
                        backgroundColor: '#000000', // Black tooltip background
                        titleColor: '#ffffff', // White title
                        bodyColor: '#ffffff', // White body text
                        borderColor: '#666666',
                        borderWidth: 1,
                        cornerRadius: 0, // Sharp corners for tooltip
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Frecuencia') {
                                    return context.dataset.label + ': ' + context.parsed.y;
                                }
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#333333', // Dark gray ticks
                            font: { size: window.innerWidth < 768 ? 10 : 12 },
                            maxRotation: window.innerWidth < 768 ? 60 : 45, // More rotation for small screens
                            minRotation: window.innerWidth < 768 ? 60 : 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Frecuencia',
                            color: '#333333',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { color: '#e0e0e0' }, // Light gray grid lines
                        ticks: { // Ensure ticks are dark gray
                            color: '#333333',
                            stepSize: Math.max(1, Math.ceil(Math.max(...counts) / 5)), // Dynamic step size
                            font: { size: 11 }
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: 100,
                        position: 'right',
                        title: {
                            display: true,
                            text: '% Acumulado',
                            color: '#333333',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { display: false },
                        ticks: { // Ensure ticks are dark gray
                            color: '#333333',
                            callback: function(value) { return value + '%'; }, // Add '%' to ticks
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    });
}

function renderControlChart(data) {
    const ctx = document.getElementById('controlChart').getContext('2d');
    const points = Object.values(data.questions).map(q => q.items[0].count);
    const avg = points.reduce((a, b) => a + b, 0) / points.length;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data.questions),
            datasets: [
                { label: 'Valor', data: points, borderColor: '#000000', backgroundColor: 'transparent', tension: 0, fill: false, pointRadius: 4 },
                { label: 'LSC (Límite Superior)', data: Array(points.length).fill(avg * 1.5), borderColor: '#999999', borderWidth: 1.5, borderDash: [5, 5], fill: false, pointRadius: 0 },
                { label: 'Promedio', data: Array(points.length).fill(avg), borderColor: '#666666', borderWidth: 1.5, borderDash: [2, 2], fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' } }, // Dark gray ticks, light gray grid
                y: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, beginAtZero: true } // Dark gray ticks, light gray grid
            },
            plugins: {
                legend: { labels: { color: '#333333' } },
                tooltip: { backgroundColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', borderColor: '#666666', borderWidth: 1, cornerRadius: 0 }
            }
        }
    });
}

function renderScatterChart(data) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    const scatterData = Array.from({length: data.total_responses}, () => ({
        x: Math.floor(Math.random() * 4) + 1,
        y: Math.floor(Math.random() * 4) + 1
    }));

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Correlación Frecuencia vs Seguridad',
                data: scatterData,
                backgroundColor: '#3498db', // Azul para los puntos de dispersión
                borderColor: '#3498db',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { // Dark gray ticks, light gray grid
                x: { title: { display: true, text: 'Nivel Frecuencia', color: '#333333' }, ticks: { color: '#333333' }, grid: { color: '#e0e0e0' } },
                y: { title: { display: true, text: 'Nivel Seguridad', color: '#333333' }, ticks: { color: '#333333' }, grid: { color: '#e0e0e0' } }
            },
            plugins: {
                legend: { labels: { color: '#333333' } },
                tooltip: { backgroundColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', borderColor: '#666666', borderWidth: 1, cornerRadius: 0 }
            }
        }
    });
}

function renderHistogram(data) {
    const ctx = document.getElementById('histogramChart').getContext('2d');
    const allCounts = [];
    Object.values(data.questions).forEach(q => q.items.forEach(i => allCounts.push(i.count)));
    
    // Ordenar para análisis de Pareto en Histograma
    const sorted = [...allCounts].sort((a, b) => b - a);
    const total = sorted.reduce((a, b) => a + b, 0);
    let sum = 0;
    let cumulativeData = [];

    if (total > 0) {
        cumulativeData = sorted.map((c, i) => {
            sum += c;
            if (i === sorted.length - 1) return 100;
            return parseFloat(((sum / total) * 100).toFixed(1));
        });
    } else {
        cumulativeData = sorted.map(() => 0); // All cumulative percentages are 0 if no data
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map((_, i) => `Clase ${i+1}`),
            datasets: [
                {
                    label: '% Acumulado',
                    data: cumulativeData,
                    type: 'line',
                    borderColor: '#e74c3c', // Rojo para el acumulado
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#e74c3c', // Puntos rojos
                    pointBorderColor: '#fff',
                    borderDash: [5, 5],
                    yAxisID: 'y1',
                    order: 1
                },
                {
                    label: 'Frecuencia',
                    data: sorted,
                    backgroundColor: '#3498db', // Azul para la frecuencia
                    borderColor: '#3498db',
                    borderWidth: 1,
                    borderRadius: 0,
                    yAxisID: 'y',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { // Dark gray ticks, light gray grid
                x: { ticks: { color: '#333333' }, grid: { display: false } },
                y: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, beginAtZero: true, title: { display: true, text: 'Frecuencia' } },
                y1: { position: 'right', max: 100, grid: { display: false }, ticks: { color: '#333333', callback: v => v + '%' }, title: { display: true, text: '% Acumulado' } }
            },
            plugins: {
                legend: { labels: { color: '#333333' } },
                tooltip: { backgroundColor: '#000000', titleColor: '#ffffff', bodyColor: '#ffffff', borderColor: '#666666', borderWidth: 1, cornerRadius: 0 }
            }
        }
    });
}

function renderVerificationSheet(data) {
    const container = document.getElementById('verificationSheetContainer');
    let html = `
        <div class="chart-title">Hoja de Verificación (Check Sheet)</div>
        <div class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Categoría de Evento</th>
                        <th>Frecuencia</th>
                        <th>Acumulado</th>
                        <th>% Pareto</th>
                        <th>Marcas de Conteo</th>
                    </tr>
                </thead>
                <tbody>`;
    
    Object.values(data.questions).forEach(q => {
        let runningSum = 0;
        const total = q.items.reduce((acc, i) => acc + i.count, 0);
        q.items.sort((a,b) => b.count - a.count); // Orden Pareto

        q.items.forEach(i => {
            const marks = "I".repeat(i.count);
            runningSum += i.count;
            const perc = total > 0 ? ((runningSum / total) * 100).toFixed(1) : 0;
            html += `<tr>
                <td><small>${i.label}</small></td>
                <td class="text-center">${i.count}</td>
                <td class="text-center text-muted">${runningSum}</td>
                <td class="text-center fw-bold">${perc}%</td>
                <td class="text-dark fw-bold">${marks}</td>
            </tr>`;
        });
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// Manejo de Tabs
document.addEventListener('click', e => {
    if (e.target.dataset.target) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
        document.getElementById(e.target.dataset.target).classList.add('active');
    }
});

document.addEventListener('DOMContentLoaded', loadStats); // Changed to loadStats
window.addEventListener('resize', function() {
    Object.keys(CHART_INSTANCES).forEach(key => {
        if (CHART_INSTANCES[key]) {
            CHART_INSTANCES[key].resize();
        }
    });
});
