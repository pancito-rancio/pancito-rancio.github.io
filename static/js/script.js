function showToast(message) {
    const toastEl = document.getElementById('successToast');
    if (!toastEl) return;
    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

const encuestaForm = document.getElementById('encuestaForm');
if (encuestaForm) {
    encuestaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value.trim();
        if (!nombre) {
            showToast('Por favor ingrese su nombre.');
            return;
        }

        const respuestas = {};
        const preguntas = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
        for (const p of preguntas) {
            const selected = document.querySelector(`input[name="${p}"]:checked`);
            if (!selected) {
                showToast('Por favor responda todas las preguntas.');
                return;
            }
            respuestas[p] = selected.value;
        }

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, respuestas })
            });

            if (!res.ok) throw new Error('Error al enviar');
            showToast('Encuesta enviada correctamente. ¡Gracias por participar!');
            this.reset();
        } catch (err) {
            showToast('Error al enviar la encuesta. Intente nuevamente.');
        }
    });
}
