import React, { useEffect, useState } from 'react';
import { entradasService } from '../api/entradasService';
import { configService } from '../api/configService';
import { inventarioService } from '../api/inventarioService';
import { ShoppingCart, Plus, DollarSign, Package, Truck, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const ComprasPage = () => {
    // Datos maestros
    const [materiales, setMateriales] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    
    // Lista de compras
    const [entradas, setEntradas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Formulario
    const [nuevaCompra, setNuevaCompra] = useState({
        id_materia: '',
        id_proveedor: '',
        cantidad: '', // Cantidad de presentaciones (ej: 2 canecas)
        costo: ''     // Costo total de la factura
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [configData, invData, entradasData] = await Promise.all([
                configService.obtenerTodo(),
                inventarioService.obtenerTodo(),
                entradasService.obtenerEntradas()
            ]);

            setProveedores(configData.proveedores);
            setMateriales(invData);
            setEntradas(entradasData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompra = async (e) => {
        e.preventDefault();
        try {
            await entradasService.registrarEntrada(nuevaCompra);
            
            Swal.fire({
                icon: 'success',
                title: 'Compra Registrada',
                text: 'El inventario ha sido actualizado y el lote PEPS creado.',
                timer: 2000
            });

            // Limpiar y recargar
            setNuevaCompra({ id_materia: '', id_proveedor: '', cantidad: '', costo: '' });
            
            // Recargamos solo las entradas para actualizar la tabla
            const entradasData = await entradasService.obtenerEntradas();
            setEntradas(entradasData);
            
        } catch (error) {
            Swal.fire('Error', 'No se pudo registrar la compra', 'error');
        }
    };

    // Helper para mostrar información del material seleccionado
    const getMaterialInfo = () => {
        if (!nuevaCompra.id_materia) return null;
        return materiales.find(m => m.id_materia === parseInt(nuevaCompra.id_materia));
    };
    const matInfo = getMaterialInfo();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-8">
                <ShoppingCart className="text-green-600" size={32} />
                Gestión de Compras (Entradas)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. FORMULARIO DE COMPRA */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 h-fit">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
                        <Plus size={20} className="text-blue-500" /> Nueva Entrada
                    </h3>
                    
                    <form onSubmit={handleCompra} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Proveedor</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select 
                                    className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    value={nuevaCompra.id_proveedor}
                                    onChange={e => setNuevaCompra({...nuevaCompra, id_proveedor: e.target.value})}
                                    required
                                >
                                    <option value="">Seleccionar Proveedor...</option>
                                    {proveedores.map(p => (
                                        <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Material</label>
                            <div className="relative">
                                <Package className="absolute left-3 top-3 text-slate-400" size={18} />
                                <select 
                                    className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    value={nuevaCompra.id_materia}
                                    onChange={e => setNuevaCompra({...nuevaCompra, id_materia: e.target.value})}
                                    required
                                >
                                    <option value="">Seleccionar Material...</option>
                                    {materiales.map(m => (
                                        <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            {matInfo && (
                                <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    <span className="font-bold">Presentación:</span> {matInfo.presentacion_compra} ({matInfo.contenido_por_presentacion} {matInfo.unidad_base})
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Cantidad Comprada</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Ej: 5"
                                    value={nuevaCompra.cantidad}
                                    onChange={e => setNuevaCompra({...nuevaCompra, cantidad: e.target.value})}
                                    required
                                />
                                <span className="text-xs text-slate-400">Unidades de presentación</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Costo Total</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="number" 
                                        className="w-full pl-7 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="0.00"
                                        value={nuevaCompra.costo}
                                        onChange={e => setNuevaCompra({...nuevaCompra, costo: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resumen Calculado */}
                        {matInfo && nuevaCompra.cantidad && nuevaCompra.costo && (
                            <div className="bg-slate-100 p-3 rounded text-sm text-slate-600">
                                <p>Total Base: <strong>{(parseFloat(nuevaCompra.cantidad) * matInfo.contenido_por_presentacion).toLocaleString()} {matInfo.unidad_base}</strong></p>
                                <p>Costo Unitario Base: <strong>${(parseFloat(nuevaCompra.costo) / (parseFloat(nuevaCompra.cantidad) * matInfo.contenido_por_presentacion)).toFixed(2)} / {matInfo.unidad_base}</strong></p>
                            </div>
                        )}

                        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition-colors">
                            Registrar Entrada
                        </button>
                    </form>
                </div>

                {/* 2. HISTORIAL DE ENTRADAS */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                        <h3 className="font-bold text-slate-700">Últimas Compras</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Proveedor</th>
                                    <th className="px-6 py-3">Material</th>
                                    <th className="px-6 py-3 text-center">Cant.</th>
                                    <th className="px-6 py-3 text-right">Costo Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-8">Cargando...</td></tr>
                                ) : entradas.map(e => (
                                    <tr key={e.id_entrada} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(e.fecha).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{e.proveedor}</td>
                                        <td className="px-6 py-4 text-slate-700">{e.materia}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {e.cantidad} unds
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-green-700 font-bold">
                                            ${parseFloat(e.costo).toLocaleString('es-CO')}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && entradas.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-8 text-slate-400">Sin registros.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComprasPage;