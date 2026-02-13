import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { produccionService } from '../api/produccionService';
import { inventarioService } from '../api/inventarioService';
import { Hammer, Package, AlertTriangle, CheckCircle, TrendingUp, ArrowRight, ShoppingCart } from 'lucide-react';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        enProceso: 0,
        terminados: 0,
        alertasStock: 0,
        costoProduccionActiva: 0
    });
    
    const [alertasMateriales, setAlertasMateriales] = useState([]);
    const [ultimosTerminados, setUltimosTerminados] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Hacemos las peticiones en paralelo para que cargue rápido
            const [produccion, inventario] = await Promise.all([
                produccionService.obtenerProduccion(),
                inventarioService.obtenerTodo()
            ]);

            // 1. Calcular Estadísticas de Producción
            const activos = produccion.filter(o => o.estado !== 'Terminado');
            const finalizados = produccion.filter(o => o.estado === 'Terminado');
            
            const costoActivo = activos.reduce((acc, curr) => acc + (parseFloat(curr.costo_total) || 0), 0);

            // 2. Calcular Alertas de Inventario
            const bajoStock = inventario.filter(m => parseFloat(m.cantidad_total_base) <= parseFloat(m.nivel_minimo_base));

            setStats({
                enProceso: activos.length,
                terminados: finalizados.length,
                alertasStock: bajoStock.length,
                costoProduccionActiva: costoActivo
            });

            setAlertasMateriales(bajoStock);
            setUltimosTerminados(finalizados.slice(0, 5)); // Solo los últimos 5

        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>
                <p className="text-slate-500">Resumen general de la planta de producción.</p>
            </div>

            {/* --- TARJETAS DE INDICADORES (KPIs) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                {/* Card 1: En Producción */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">En Proceso</p>
                        <h2 className="text-3xl font-bold text-blue-600 mt-1">{stats.enProceso}</h2>
                        <p className="text-xs text-slate-400 mt-1">Cofres activos</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                        <Hammer size={24} />
                    </div>
                </div>

                {/* Card 2: Alertas Stock */}
                <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between ${stats.alertasStock > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                    <div>
                        <p className={`${stats.alertasStock > 0 ? 'text-red-600' : 'text-slate-500'} text-sm font-semibold uppercase tracking-wider`}>Alertas Stock</p>
                        <h2 className={`text-3xl font-bold mt-1 ${stats.alertasStock > 0 ? 'text-red-700' : 'text-slate-700'}`}>{stats.alertasStock}</h2>
                        <p className={`text-xs mt-1 ${stats.alertasStock > 0 ? 'text-red-500' : 'text-slate-400'}`}>Materiales bajos</p>
                    </div>
                    <div className={`${stats.alertasStock > 0 ? 'bg-red-200 text-red-700' : 'bg-slate-50 text-slate-500'} p-3 rounded-full`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>

                {/* Card 3: Terminados */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Finalizados</p>
                        <h2 className="text-3xl font-bold text-green-600 mt-1">{stats.terminados}</h2>
                        <p className="text-xs text-slate-400 mt-1">Total histórico</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600">
                        <CheckCircle size={24} />
                    </div>
                </div>

                 {/* Card 4: Inversión Activa */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Inversión Activa</p>
                        <h2 className="text-2xl font-bold text-slate-700 mt-1">${stats.costoProduccionActiva.toLocaleString('es-CO')}</h2>
                        <p className="text-xs text-slate-400 mt-1">En piso de producción</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- SECCIÓN IZQUIERDA: ALERTAS DE INVENTARIO --- */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle size={18} /> Materiales Críticos
                        </h3>
                        <Link to="/compras" className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1">
                            IR A COMPRAS <ArrowRight size={12} />
                        </Link>
                    </div>
                    
                    {alertasMateriales.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                            <CheckCircle size={48} className="text-green-200 mb-2" />
                            <p>Todo el inventario está en niveles óptimos.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Material</th>
                                        <th className="px-6 py-3 text-right">Stock Actual</th>
                                        <th className="px-6 py-3 text-right">Mínimo</th>
                                        <th className="px-6 py-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {alertasMateriales.map(m => (
                                        <tr key={m.id_materia} className="hover:bg-red-50/30">
                                            <td className="px-6 py-3 font-medium text-slate-700">{m.nombre}</td>
                                            <td className="px-6 py-3 text-right font-bold text-red-600">
                                                {parseFloat(m.cantidad_total_base).toLocaleString()} {m.unidad_base}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-500">
                                                {m.nivel_minimo_base} {m.unidad_base}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <Link to="/compras" className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 mx-auto w-fit">
                                                    <ShoppingCart size={12} /> Comprar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* --- SECCIÓN DERECHA: ÚLTIMOS TERMINADOS --- */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700">Últimas Entregas</h3>
                    </div>
                    <ul className="divide-y divide-slate-50">
                        {ultimosTerminados.length === 0 ? (
                            <li className="p-6 text-center text-slate-400 text-sm">No hay registros recientes.</li>
                        ) : (
                            ultimosTerminados.map(c => (
                                <li key={c.id_cofre} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-700 text-sm">{c.modelo}</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">#{c.id_cofre}</span>
                                    </div>
                                    <div className="flex justify-between items-end text-xs text-slate-500">
                                        <span>Resp: {c.trabajador}</span>
                                        <span className="font-mono font-bold text-slate-600">${parseFloat(c.costo_total).toLocaleString('es-CO')}</span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="p-3 border-t border-slate-100 text-center">
                        <Link to="/reportes" className="text-xs font-bold text-blue-600 hover:underline">VER HISTORIAL COMPLETO</Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;