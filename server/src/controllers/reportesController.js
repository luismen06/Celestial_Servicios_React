const PDFDocument = require('pdfkit');
const { Cofre, ModeloCofre, Salida, MateriaPrima, HistorialProduccion, Trabajador, Etapa, Entrada } = require('../models/asociaciones');
const { Op } = require('sequelize');

const generarReporteCofre = async (req, res) => {
    const { idCofre } = req.params;

    try {
        // 1. OBTENER DATOS COMPLETOS DE LA BASE DE DATOS
        const cofre = await Cofre.findOne({
            where: { id_cofre: idCofre },
            include: [
                { model: ModeloCofre },
                // Traer Salidas (Materiales y Costos)
                { 
                    model: Salida, 
                    include: [{ model: MateriaPrima }] 
                },
                // Traer Historial (Tiempos y Responsables)
                {
                    model: HistorialProduccion,
                    as: 'historial',
                    include: [{ model: Trabajador }, { model: Etapa }]
                }
            ]
        });

        if (!cofre) return res.status(404).send("Cofre no encontrado");

        // 2. CONFIGURAR EL PDF
        const doc = new PDFDocument({ margin: 50 });

        // Cabeceras para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Reporte_Cofre_${idCofre}.pdf`);

        // Conectar el PDF a la respuesta
        doc.pipe(res);

        // ==============================
        // 3. DISEÑO DEL DOCUMENTO
        // ==============================

        // --- ENCABEZADO ---
        doc.fontSize(20).text('CELESTIAL SERVICIOS S.A.S', { align: 'center' });
        doc.fontSize(12).text('Reporte de Producción y Costos', { align: 'center' });
        doc.moveDown();
        doc.lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke(); 
        doc.moveDown();

        // --- INFORMACIÓN GENERAL ---
        doc.fontSize(12).font('Helvetica-Bold').text(`Orden de Producción #${cofre.id_cofre}`);
        
        const modeloNombre = cofre.ModeloCofre ? cofre.ModeloCofre.nombre : 'Desconocido';
        const fechaInicio = new Date(cofre.fecha_comienzo).toLocaleString();
        const fechaFin = cofre.fecha_finalizado ? new Date(cofre.fecha_finalizado).toLocaleString() : 'En proceso';

        doc.font('Helvetica').text(`Modelo: ${modeloNombre}`);
        doc.text(`Fecha Inicio: ${fechaInicio}`);
        doc.text(`Fecha Fin: ${fechaFin}`);
        doc.text(`Estado Final: ${cofre.estado}`);
        doc.moveDown();

        // --- TABLA DE MATERIALES (COSTOS) ---
        doc.font('Helvetica-Bold').text('DESGLOSE DE MATERIALES Y COSTOS (PEPS)', { underline: true });
        doc.moveDown(0.5);

        // Cabecera de tabla
        let yPosition = doc.y;
        doc.fontSize(10);
        doc.text('Material', 50, yPosition);
        doc.text('Cant.', 250, yPosition);
        doc.text('Costo Real', 400, yPosition);
        doc.moveDown(0.5);
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke(); 
        doc.moveDown(0.5);

        let costoTotal = 0;

        // Listar materiales
        if (cofre.Salidas && cofre.Salidas.length > 0) {
            cofre.Salidas.forEach(s => {
                // 1. DECLARAR VARIABLES PRIMERO (Corrección del error ReferenceError)
                const nombreMat = s.MateriaPrima ? s.MateriaPrima.nombre : 'Desconocido';
                const unidad = s.MateriaPrima ? s.MateriaPrima.unidad_base : '';
                const costo = parseFloat(s.costo_calculado || 0);
                
                costoTotal += costo;

                // Formatear precio a Pesos Colombianos
                const precioFormateado = costo.toLocaleString('es-CO', { 
                    style: 'currency', 
                    currency: 'COP',
                    minimumFractionDigits: 2 
                });

                // 2. USAR LAS VARIABLES PARA DIBUJAR
                doc.font('Helvetica').text(nombreMat, 50);
                
                // Usamos doc.y - 10 para alinear en la misma línea horizontal
                const currentY = doc.y - 10; 
                doc.text(`${s.cantidad_base_usada} ${unidad}`, 250, currentY);
                doc.text(precioFormateado, 400, currentY);
                
                doc.moveDown(0.5);
            });
        } else {
            doc.text('No se registraron consumos de material.');
        }

        doc.moveDown();
        
        // TOTAL
        const totalFormateado = costoTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        doc.font('Helvetica-Bold').fontSize(12).text(`COSTO TOTAL MATERIALES: ${totalFormateado}`, { align: 'right' });
        doc.moveDown(2);

        // --- RUTA DE TRABAJO (HISTORIAL) ---
        doc.font('Helvetica-Bold').fontSize(12).text('RUTA DE TRABAJO Y RESPONSABLES', { underline: true });
        doc.moveDown(0.5);

        if (cofre.historial && cofre.historial.length > 0) {
            // Ordenar cronológicamente
            const historial = cofre.historial.sort((a, b) => a.id_historial - b.id_historial);
            
            historial.forEach(h => {
                const etapa = h.Etapa ? h.Etapa.nombre : 'Inicio';
                const trabajador = h.Trabajador ? h.Trabajador.nombre : 'N/A';
                const fecha = new Date(h.fecha_cambio).toLocaleString();

                // Filtro visual: No mostramos la etapa "Terminado" si existe
                if (!etapa.toLowerCase().includes('terminado')) {
                    doc.fontSize(10).font('Helvetica')
                       .text(`• [${fecha}] - ${etapa} - Responsable: ${trabajador}`);
                }
            });
        } else {
            doc.text('Sin historial registrado.');
        }

        // --- PIE DE PÁGINA ---
        doc.moveDown(4);
        doc.fontSize(8).text('Generado automáticamente por Sistema Celestial DB', { align: 'center', color: 'grey' });

        // 4. FINALIZAR PDF
        doc.end();

    } catch (error) {
        console.error("Error generando PDF:", error);
        if (!res.headersSent) {
            res.status(500).send("Error generando el reporte");
        }
    }
};

// --- 3. REPORTE DE CONSUMO (CORREGIDO Y ALINEADO) ---
const generarReporteConsumo = async (req, res) => {
    try {
        const salidas = await Salida.findAll({
            include: [{ model: MateriaPrima }, { model: Cofre, include: [ModeloCofre] }],
            order: [['fecha', 'DESC']],
            limit: 200 
        });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Reporte_Consumo.pdf');
        doc.pipe(res);

        // Título
        doc.fontSize(18).text('Bitácora de Consumo de Materiales', { align: 'center' });
        doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // --- CONFIGURACIÓN DE COLUMNAS ---
        // Definimos las posiciones X y los anchos máximos
        const colFecha = 50;
        const colMaterial = 130;  const widthMaterial = 110;
        const colDestino = 250;   const widthDestino = 140; // Espacio amplio para nombre del cofre
        const colCantidad = 400;
        const colCosto = 480;

        // Cabecera
        let y = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Fecha', colFecha, y);
        doc.text('Material', colMaterial, y);
        doc.text('Destino / Uso', colDestino, y);
        doc.text('Cantidad', colCantidad, y);
        doc.text('Costo Real', colCosto, y);
        
        doc.moveDown(0.5);
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke(); 
        doc.moveDown(0.5);

        let sumaCostos = 0;

        salidas.forEach(s => {
            // 1. Preparar Datos
            const fecha = new Date(s.fecha).toLocaleDateString();
            const mat = s.MateriaPrima ? s.MateriaPrima.nombre : 'Desconocido';
            
            // Formatear Destino (Si es cofre, ponemos ID y Modelo)
            let destino = s.tipo_salida;
            if (s.Cofre) {
                const modelo = s.Cofre.ModeloCofre ? s.Cofre.ModeloCofre.nombre : '';
                destino = `Cofre #${s.id_cofre}\n(${modelo})`; // El \n fuerza un salto de línea estético
            }

            const cantidad = s.cantidad_base_usada;
            const costo = parseFloat(s.costo_calculado || 0);
            sumaCostos += costo;
            
            const costoFormateado = costo.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

            // 2. Calcular la altura de la fila
            // Preguntamos a PDFKit: "¿Cuánto mediría este texto si lo meto en este ancho?"
            const heightMaterial = doc.heightOfString(mat, { width: widthMaterial, fontSize: 9 });
            const heightDestino = doc.heightOfString(destino, { width: widthDestino, fontSize: 9 });
            
            // La altura de la fila será la del texto más largo, o mínimo 20px
            const rowHeight = Math.max(heightMaterial, heightDestino, 20);

            // 3. Verificar Salto de Página
            if (doc.y + rowHeight > doc.page.height - 50) {
                doc.addPage();
                doc.y = 50; // Reiniciar Y arriba
            }

            // 4. Imprimir la Fila (Todo alineado al TOP de la fila actual)
            const currentY = doc.y;
            
            doc.font('Helvetica').fontSize(9);
            doc.text(fecha, colFecha, currentY);
            
            // Material con ancho limitado
            doc.text(mat, colMaterial, currentY, { width: widthMaterial });
            
            // Destino con ancho limitado
            doc.text(destino, colDestino, currentY, { width: widthDestino });
            
            doc.text(cantidad, colCantidad, currentY);
            doc.text(costoFormateado, colCosto, currentY);

            // 5. Mover el cursor hacia abajo según la altura calculada + un margen
            doc.y = currentY + rowHeight + 10; 
            
            // Línea divisoria sutil (opcional)
            doc.lineWidth(0.5).strokeColor('#eee').moveTo(50, doc.y - 5).lineTo(550, doc.y - 5).stroke().strokeColor('black');
        });

        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(12).text(`Total Consumido: ${sumaCostos.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`, { align: 'right' });

        doc.end();
    } catch (error) {
        console.error("Error reporte consumo:", error);
        if (!res.headersSent) res.status(500).send("Error generando el reporte");
    }
};

// --- 4. REPORTE DE COSTOS Y GANANCIAS (Entradas vs Salidas) ---
const generarReporteFinanciero = async (req, res) => {
    try {
        // Sumar todas las compras (Entradas)
        const totalCompras = await Entrada.sum('costo_total_compra') || 0;
        
        // Sumar todo lo gastado en producción (Salidas)
        const totalConsumo = await Salida.sum('costo_calculado') || 0;

        // Calcular inventario actual (Activo)
        const inventarioValor = totalCompras - totalConsumo; 
        // (Nota: Esto es una aproximación contable simple: Lo que compré menos lo que gasté es lo que tengo)

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=Reporte_Financiero.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Balance Financiero de Producción', { align: 'center', color: '#2c3e50' });
        doc.moveDown(2);

        // Dibujar cajas estilo Dashboard
        const drawCard = (title, value, color, x, y) => {
            doc.rect(x, y, 150, 80).fill(color).stroke();
            doc.fillColor('white').fontSize(12).text(title, x + 10, y + 10);
            doc.fontSize(14).font('Helvetica-Bold').text(value, x + 10, y + 40);
            doc.fillColor('black'); // Reset color
        };

        drawCard("Total Compras", `$${totalCompras.toLocaleString('es-CO')}`, '#3498db', 50, 150); // Azul
        drawCard("Total Producción", `$${totalConsumo.toLocaleString('es-CO')}`, '#e74c3c', 220, 150); // Rojo
        drawCard("Valor en Bodega", `$${inventarioValor.toLocaleString('es-CO')}`, '#27ae60', 390, 150); // Verde

        doc.moveDown(8);
        
        doc.fontSize(12).text("Análisis:", { underline: true });
        doc.moveDown();
        doc.fontSize(10).text("• Total Compras: Dinero invertido en materias primas (Entradas).");
        doc.text("• Total Producción: Dinero que ya se convirtió en producto (Cofres) o merma.");
        doc.text("• Valor en Bodega: Dinero detenido en inventario físico disponible.");

        doc.end();
    } catch (error) {
        res.status(500).send("Error en reporte financiero");
    }
};

module.exports = { generarReporteCofre, generarReporteConsumo, generarReporteFinanciero };

