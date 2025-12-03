import React, { useEffect, useState } from 'react';
import { salidasService } from '../api/salidasService';
import { ClipboardList, ArrowUpRight, Search, Calendar, Box } from 'lucide-react';

const SalidasPage = () => {
    const [salidas, setSalidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const data = await salidasService.obtenerSalidas();
            setSalidas(data);
        } catch (error) {
            console.error("Error cargando salidas:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtro simple por nombre de materia
    const filtrados = salidas.filter(s => 
        s.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.tipo_salida.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#f8fafc]">
            {/* ENCABEZADO */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <ClipboardList className="text-orange-600" size={32} />
                        Historial de Salidas
                    </h1>
                    <p className="text-slate-500 mt-1">Bitácora de todos los consumos de materia prima.</p>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center">
                <Search className="text-slate-400 ml-3" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por material o tipo..." 
                    className="w-full p-3 outline-none text-slate-600 bg-transparent"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* TABLA DE SALIDAS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Materia Prima</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad Usada</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Destino (Cofre)</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Real</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8 text-slate-400">Cargando historial...</td></tr>
                        ) : filtrados.map((item) => (
                            <tr key={item.id_salida} className="hover:bg-orange-50/30 transition-colors">
                                <td className="px-6 py-4 text-slate-500 text-sm flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(item.fecha).toLocaleDateString()}
                                    <span className="text-xs text-slate-400 ml-1">
                                        {new Date(item.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {item.materia}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-600">
                                    {item.cantidad_base_usada} <span className="text-xs text-slate-400">{item.unidad_base}</span>
                                </td>
                                <td className="px-6 py-4">
                                    {item.id_cofre ? (
                                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                                            <Box size={12} /> Cofre #{item.id_cofre}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">-- General --</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                        item.tipo_salida === 'Produccion' 
                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                    }`}>
                                        {item.tipo_salida}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-700 text-sm">
                                    ${parseFloat(item.costo).toLocaleString('es-CO')}
                                </td>
                            </tr>
                        ))}
                        {!loading && filtrados.length === 0 && (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-400">No se encontraron registros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalidasPage;