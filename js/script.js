let currentIndex = 0; // 0-based index internally
let isEditing = false;

// Al cargar, intentamos recuperar datos guardados
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    // Ensuring we start at the beginning or validation
    const pages = document.querySelectorAll('.page');
    if (pages.length > 0) {
        currentIndex = 0;
    }
    updateDisplay();
    updatePageNumbers(); // Ensure numbers are correct on load
});

function loadSavedData() {
    const savedBook = localStorage.getItem('dmauri_book_content');
    if (savedBook) {
        document.getElementById('book').innerHTML = savedBook;
    }
}

function getPages() {
    return document.querySelectorAll('.page');
}

function updateDisplay() {
    const pages = getPages();
    const totalPages = pages.length;

    // Validate index
    if (currentIndex >= totalPages) currentIndex = totalPages - 1;
    if (currentIndex < 0) currentIndex = 0;
    if (totalPages === 0) return; // Special case empty book?

    // Toggle active class based on DOM order
    pages.forEach((p, index) => {
        if (index === currentIndex) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });

    // Actualizar botones prev/next
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (btnPrev) {
        btnPrev.style.opacity = currentIndex === 0 ? "0.3" : "1";
        btnPrev.disabled = currentIndex === 0;
    }

    if (btnNext) {
        btnNext.style.opacity = currentIndex === totalPages - 1 ? "0.3" : "1";
        btnNext.disabled = currentIndex === totalPages - 1;
    }
}

// Function to re-calculate and display page numbers correctly
function updatePageNumbers() {
    const pages = getPages();
    pages.forEach((page, index) => {
        const numDiv = page.querySelector('.page-number');
        if (numDiv) {
            numDiv.textContent = index + 1;
        }
    });
}

function nextPage() {
    const pages = getPages();
    if (currentIndex < pages.length - 1) {
        currentIndex++;
        updateDisplay();
    }
}

function prevPage() {
    if (currentIndex > 0) {
        currentIndex--;
        updateDisplay();
    }
}

// Modo Edición
function toggleEditMode() {
    if (!isEditing) {
        // Entrando a modo edición
        const password = prompt("Ingresa la clave para editar:", "");
        if (password !== "1234") {
            alert("Clave incorrecta. Acceso denegado.");
            return;
        }
        isEditing = true;
    } else {
        // Saliendo de modo edición
        isEditing = false;
    }

    const btnEdit = document.getElementById('btnEdit');
    const btnSave = document.getElementById('btnSave');
    const btnAdd = document.getElementById('btnAddPage');
    const btnDelete = document.getElementById('btnDelete');
    const contents = document.querySelectorAll('.content-area');

    if (isEditing) {
        btnEdit.innerText = "❌ Cancelar Edición";
        btnEdit.style.background = "#e74c3c";
        btnSave.style.display = "inline-block";
        btnAdd.style.display = "inline-block";
        btnDelete.style.display = "inline-block";

        contents.forEach(div => {
            div.contentEditable = "true";
        });
    } else {
        btnEdit.innerText = "✏️ Editar";
        btnEdit.style.background = "rgba(255, 255, 255, 0.1)";
        btnSave.style.display = "none";
        btnAdd.style.display = "none";
        btnDelete.style.display = "none";

        contents.forEach(div => {
            div.contentEditable = "false";
        });
    }
}

function addNewPage() {
    const pages = getPages();
    const currentPageElement = pages[currentIndex];

    const newPageHTML = document.createElement('div');
    newPageHTML.className = 'page';
    // No ID needed necessarily, or regenerate unique ones, but class is enough
    newPageHTML.innerHTML = `
        <div class="corner-ornament corner-tl"></div>
        <div class="corner-ornament corner-tr"></div>
        <div class="corner-ornament corner-bl"></div>
        <div class="corner-ornament corner-br"></div>
        <div class="content-area" contenteditable="true">
            <h4 class="script-font text-3xl mb-4 text-center">Nueva Página</h4>
            <p>Escribe tu historia aquí...</p>
        </div>
        <div class="page-number"></div>
    `;

    // Insertar DESPUÉS de la página actual
    if (currentPageElement && currentPageElement.nextSibling) {
        currentPageElement.parentNode.insertBefore(newPageHTML, currentPageElement.nextSibling);
    } else {
        document.getElementById('book').appendChild(newPageHTML);
    }

    // Ir a la nueva página
    currentIndex++;
    updatePageNumbers();
    updateDisplay();
}

function deletePage() {
    const pages = getPages();
    if (pages.length <= 1) {
        alert("No puedes eliminar la última página del libro.");
        return;
    }

    const password = prompt("Ingresa la clave para eliminar la página:", "");
    if (password === "1234") {
        const pageToRemove = pages[currentIndex];
        pageToRemove.remove();

        // Adjust index if we deleted the last page
        if (currentIndex >= pages.length - 1) {
            currentIndex = pages.length - 2;
        }

        updatePageNumbers();
        updateDisplay();
        alert("Página eliminada correctamente.");
    } else if (password !== null) {
        alert("Clave incorrecta. No se eliminó la página.");
    }
}

function saveChanges() {
    const contents = document.querySelectorAll('.content-area');
    contents.forEach(div => div.contentEditable = "false");

    const bookHTML = document.getElementById('book').innerHTML;
    localStorage.setItem('dmauri_book_content', bookHTML);

    alert('Cambios guardados correctamente.');
    toggleEditMode();
}

function resetBook() {
    if (confirm("¿Estás seguro? Esto borrará todos tus cambios guardados y restaurará el libro original.")) {
        localStorage.removeItem('dmauri_book_content');
        location.reload();
    }
}

function exportToPDF() {
    if (isEditing) toggleEditMode();

    const element = document.querySelector('.page.active');

    // Configuración para máxima calidad
    const opt = {
        margin: 0,
        filename: 'historia_dmauri_pag_' + (currentIndex + 1) + '.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
            scale: 2, // Escala base 
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            // Truco para mejorar la nitidez del texto: escalar el contenido antes de capturar
            onclone: function (doc) {
                const el = doc.querySelector('.page.active');
                if (el) {
                    el.style.transform = 'scale(2)';
                    el.style.transformOrigin = 'top left';
                    // Asegurar que el contenedor sea lo suficientemente grande para el contenido escalado
                }
            }
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    document.body.style.cursor = 'wait';

    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.style.cursor = 'default';
        }).catch(err => {
            console.error(err);
            document.body.style.cursor = 'default';
            alert("Error al exportar PDF.");
        });
    }, 100);
}

// Teclado
document.addEventListener('keydown', (e) => {
    if (isEditing) return;

    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
});
