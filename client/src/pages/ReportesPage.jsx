import React, { useEffect, useState } from 'react';
import { produccionService } from '../api/produccionService';
import { reportesService } from '../api/reportesService';
import { ChevronDown, ChevronUp, Printer, FileText, Clock, Download } from 'lucide-react';

const ReportesPage = () => {
    const [terminados, setTerminados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null); // ID del cofre expandido

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const data = await produccionService.obtenerProduccion();
            const finalizados = data.filter(item => item.estado === 'Terminado');
            setTerminados(finalizados);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // Calcular duración entre dos fechas
    const calcularDuracion = (fecha1, fecha2) => {
        if (!fecha1) return '-';
        const inicio = new Date(fecha1);
        const fin = fecha2 ? new Date(fecha2) : new Date();
        const diffMs = fin - inicio;
        
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const getTiempoTotal = (historial) => {
        if (!historial || historial.length === 0) return '0h 0m';
        const inicio = historial[0].fecha;
        const fin = historial[historial.length - 1].fecha;
        return calcularDuracion(inicio, fin);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <h1 className="text-3xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                Historial de Terminados
            </h1>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* --- HEADER TABLA (COLOR TEAL) --- */}
                <div className="grid grid-cols-12 bg-[#4FD1C5] text-white font-bold py-3 px-4 text-sm uppercase tracking-wide">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-4">Modelo</div>
                    <div className="col-span-2 text-center">Estado</div>
                    <div className="col-span-3 text-right pr-4">Costo Total</div>
                    <div className="col-span-2 text-center">Acciones</div>
                </div>

                {loading && <div className="p-10 text-center text-slate-500">Cargando reportes...</div>}
                
                {!loading && terminados.length === 0 && (
                    <div className="p-10 text-center text-slate-500">No hay cofres terminados en el historial.</div>
                )}

                {/* --- BODY TABLA --- */}
                {terminados.map((cofre) => (
                    <div key={cofre.id_cofre} className="border-b border-slate-100 last:border-0">
                        
                        {/* Fila Principal */}
                        <div className={`grid grid-cols-12 items-center py-4 px-4 hover:bg-slate-50 transition-colors ${expandedRow === cofre.id_cofre ? 'bg-slate-50' : ''}`}>
                            <div className="col-span-1 font-bold text-green-500">#{cofre.id_cofre}</div>
                            <div className="col-span-4 text-slate-700 font-medium">{cofre.modelo}</div>
                            <div className="col-span-2 text-center">
                                <span className="bg-[#10B981] text-white px-3 py-1 rounded-full text-xs font-bold">
                                    Finalizado
                                </span>
                            </div>
                            <div className="col-span-3 text-right pr-4 font-bold text-slate-700">
                                ${cofre.costo_total?.toLocaleString('es-CO')}
                            </div>
                            <div className="col-span-2 flex justify-center gap-2">
                                <button 
                                    onClick={() => toggleRow(cofre.id_cofre)}
                                    className="p-1.5 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                                >
                                    {expandedRow === cofre.id_cofre ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <button 
                                    onClick={() => reportesService.descargarReporteCofre(cofre.id_cofre)}
                                    className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    title="Imprimir PDF"
                                >
                                    <Printer size={16} />
                                </button>
                            </div>
                        </div>

                        {/* --- DETALLE EXPANDIBLE (FONDO BEIGE/VERDE CLARO) --- */}
                        {expandedRow === cofre.id_cofre && (
                            <div className="bg-[#F0FFF4] p-6 border-t border-slate-200 animate-fade-in">
                                <h4 className="flex items-center gap-2 text-green-800 font-bold mb-4">
                                    <FileText size={18} /> Historial del proceso:
                                </h4>

                                <div className="bg-[#E6FFFA] p-3 rounded-lg border border-teal-100 mb-4 flex justify-between items-center text-teal-800 font-bold text-sm">
                                    <span className="flex items-center gap-2"><Clock size={16} /> TIEMPO TOTAL DE FABRICACIÓN:</span>
                                    <span className="text-lg">{getTiempoTotal(cofre.detalles_historial)}</span>
                                </div>

                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-green-700 font-bold border-b border-green-200">
                                            <th className="py-2">Etapa</th>
                                            <th className="py-2">Responsable</th>
                                            <th className="py-2">Fecha Inicio</th>
                                            <th className="py-2 text-right">Duración</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-green-100 text-slate-700">
                                        {cofre.detalles_historial.map((h, i) => (
                                            <tr key={i} className="hover:bg-green-50/50">
                                                <td className="py-2">{h.etapa}</td>
                                                <td className="py-2">{h.trabajador}</td>
                                                <td className="py-2">{new Date(h.fecha).toLocaleString()}</td>
                                                <td className="py-2 text-right font-mono text-slate-500">
                                                    {i < cofre.detalles_historial.length - 1 
                                                        ? calcularDuracion(h.fecha, cofre.detalles_historial[i+1].fecha) 
                                                        : <span className="text-green-600 font-bold">Finalizado</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportesPage;