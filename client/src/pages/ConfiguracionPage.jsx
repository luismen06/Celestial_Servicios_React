import React, { useEffect, useState } from 'react';
import { configService } from '../api/configService';
import { Settings, Users, Box, Truck, Save, Trash2, Pencil, X } from 'lucide-react';
import Swal from 'sweetalert2';

const ConfiguracionPage = () => {
    // --- ESTADO GENERAL ---
    const [activeTab, setActiveTab] = useState('modelos');
    const [loading, setLoading] = useState(true);
    
    // --- DATOS ---
    const [modelos, setModelos] = useState([]);
    const [trabajadores, setTrabajadores] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // --- FORMULARIOS (Inputs y IDs de edición) ---
    // Modelos
    const [newModelo, setNewModelo] = useState('');
    const [editModeloId, setEditModeloId] = useState(null); // null = Modo Crear

    // Trabajadores
    const [newTrabajador, setNewTrabajador] = useState('');
    const [editTrabajadorId, setEditTrabajadorId] = useState(null);

    // Proveedores
    const [newProveedor, setNewProveedor] = useState('');
    const [editProveedorId, setEditProveedorId] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const data = await configService.obtenerTodo();
            setModelos(data.modelos);
            setTrabajadores(data.trabajadores);
            setProveedores(data.proveedores);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOGICA DE MODELOS
    // ==========================================
    const handleGuardarModelo = async (e) => {
        e.preventDefault();
        try {
            // Enviamos ID solo si estamos editando
            await configService.guardarModelo({ 
                nombre: newModelo, 
                id_modelo: editModeloId 
            });
            
            Swal.fire({
                icon: 'success',
                title: editModeloId ? 'Actualizado' : 'Creado',
                text: `Modelo ${editModeloId ? 'actualizado' : 'creado'} correctamente`,
                timer: 1500,
                showConfirmButton: false
            });

            limpiarModelo();
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    };

    const cargarEdicionModelo = (m) => {
        setNewModelo(m.nombre);
        setEditModeloId(m.id_modelo);
    };

    const limpiarModelo = () => {
        setNewModelo('');
        setEditModeloId(null);
    };

    const handleEliminarModelo = async (id) => {
        try {
            const result = await Swal.fire({
                title: '¿Eliminar modelo?',
                text: "Solo se borrará si no tiene historial.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar'
            });

            if (result.isConfirmed) {
                await configService.eliminarModelo(id);
                Swal.fire('Eliminado', 'El modelo ha sido eliminado.', 'success');
                cargarDatos();
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al eliminar', 'error');
        }
    };

    // ==========================================
    // LOGICA DE TRABAJADORES
    // ==========================================
    const handleGuardarTrabajador = async (e) => {
        e.preventDefault();
        try {
            await configService.guardarTrabajador({ 
                nombre: newTrabajador, 
                activo: true,
                id_trabajador: editTrabajadorId 
            });

            Swal.fire({
                icon: 'success',
                title: editTrabajadorId ? 'Actualizado' : 'Guardado',
                timer: 1500,
                showConfirmButton: false
            });

            limpiarTrabajador();
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', 'Error guardando trabajador', 'error');
        }
    };

    const cargarEdicionTrabajador = (t) => {
        setNewTrabajador(t.nombre);
        setEditTrabajadorId(t.id_trabajador);
    };

    const limpiarTrabajador = () => {
        setNewTrabajador('');
        setEditTrabajadorId(null);
    };

    const handleToggleTrabajador = async (t) => {
        try {
            await configService.guardarTrabajador({ 
                id_trabajador: t.id_trabajador, 
                nombre: t.nombre, 
                activo: !t.activo 
            });
            cargarDatos();
        } catch (error) {
            console.error(error);
        }
    };

    // ==========================================
    // LOGICA DE PROVEEDORES
    // ==========================================
    const handleGuardarProveedor = async (e) => {
        e.preventDefault();
        try {
            await configService.guardarProveedor({ 
                nombre: newProveedor, 
                id_proveedor: editProveedorId
            });

            Swal.fire({
                icon: 'success',
                title: editProveedorId ? 'Actualizado' : 'Guardado',
                timer: 1500,
                showConfirmButton: false
            });

            limpiarProveedor();
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', 'Error guardando proveedor', 'error');
        }
    };

    const cargarEdicionProveedor = (p) => {
        setNewProveedor(p.nombre);
        setEditProveedorId(p.id_proveedor);
    };

    const limpiarProveedor = () => {
        setNewProveedor('');
        setEditProveedorId(null);
    };


    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Settings className="text-blue-600" size={32} />
                    Configuración General
                </h1>
                <p className="text-slate-500 mt-1">Administra los catálogos base del sistema.</p>
            </div>

            {/* --- TABS NAVIGATION --- */}
            <div className="flex border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('modelos')}
                    className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors ${activeTab === 'modelos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Box size={18} /> Modelos de Cofres
                </button>
                <button 
                    onClick={() => setActiveTab('trabajadores')}
                    className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors ${activeTab === 'trabajadores' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={18} /> Trabajadores
                </button>
                <button 
                    onClick={() => setActiveTab('proveedores')}
                    className={`px-6 py-3 font-medium flex items-center gap-2 transition-colors ${activeTab === 'proveedores' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Truck size={18} /> Proveedores
                </button>
            </div>

            {/* --- CONTENIDO DE LAS TABS --- */}
            <div className="bg-white rounded-xl shadow border border-slate-100 p-6 min-h-[400px]">
                
                {/* 1. TAB MODELOS */}
                {activeTab === 'modelos' && (
                    <div className="animate-fade-in">
                        <form onSubmit={handleGuardarModelo} className="flex gap-4 mb-8 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    {editModeloId ? 'Editando Modelo' : 'Nuevo Modelo'}
                                </label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${editModeloId ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-slate-300 focus:ring-blue-500'}`}
                                    placeholder="Nombre del modelo (ej: Baúl Clásico)"
                                    value={newModelo}
                                    onChange={(e) => setNewModelo(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <button className={`px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 ${editModeloId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <Save size={18} /> {editModeloId ? 'Actualizar' : 'Guardar'}
                            </button>
                            
                            {editModeloId && (
                                <button 
                                    type="button" 
                                    onClick={limpiarModelo}
                                    className="px-4 py-3 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 font-medium"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modelos.map(m => (
                                <div key={m.id_modelo} className={`flex justify-between items-center p-4 border rounded-lg ${editModeloId === m.id_modelo ? 'border-amber-400 bg-amber-50 shadow-md' : 'bg-slate-50'}`}>
                                    <span className="font-semibold text-slate-700">{m.nombre}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => cargarEdicionModelo(m)}
                                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-white rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleEliminarModelo(m.id_modelo)}
                                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-white rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. TAB TRABAJADORES */}
                {activeTab === 'trabajadores' && (
                    <div className="animate-fade-in">
                        <form onSubmit={handleGuardarTrabajador} className="flex gap-4 mb-8 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    {editTrabajadorId ? 'Editando Trabajador' : 'Nuevo Trabajador'}
                                </label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${editTrabajadorId ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-slate-300 focus:ring-blue-500'}`}
                                    placeholder="Nombre completo"
                                    value={newTrabajador}
                                    onChange={(e) => setNewTrabajador(e.target.value)}
                                    required
                                />
                            </div>
                            <button className={`px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 ${editTrabajadorId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <Save size={18} /> {editTrabajadorId ? 'Actualizar' : 'Guardar'}
                            </button>
                            {editTrabajadorId && (
                                <button type="button" onClick={limpiarTrabajador} className="px-4 py-3 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                                    <X size={20} />
                                </button>
                            )}
                        </form>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 text-slate-600">Nombre</th>
                                        <th className="p-4 text-slate-600">Estado</th>
                                        <th className="p-4 text-slate-600 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trabajadores.map(t => (
                                        <tr key={t.id_trabajador} className={`border-b last:border-0 hover:bg-slate-50 ${editTrabajadorId === t.id_trabajador ? 'bg-amber-50' : ''}`}>
                                            <td className="p-4 font-medium">{t.nombre}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {t.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end items-center gap-3">
                                                <button 
                                                    onClick={() => cargarEdicionTrabajador(t)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleTrabajador(t)}
                                                    className="text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline"
                                                >
                                                    {t.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. TAB PROVEEDORES */}
                {activeTab === 'proveedores' && (
                    <div className="animate-fade-in">
                        <form onSubmit={handleGuardarProveedor} className="flex gap-4 mb-8 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    {editProveedorId ? 'Editando Proveedor' : 'Nuevo Proveedor'}
                                </label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${editProveedorId ? 'border-amber-400 focus:ring-amber-400 bg-amber-50' : 'border-slate-300 focus:ring-blue-500'}`}
                                    placeholder="Nombre Empresa / Proveedor"
                                    value={newProveedor}
                                    onChange={(e) => setNewProveedor(e.target.value)}
                                    required
                                />
                            </div>
                            <button className={`px-6 py-3 rounded-lg text-white font-medium flex items-center gap-2 ${editProveedorId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                <Save size={18} /> {editProveedorId ? 'Actualizar' : 'Guardar'}
                            </button>
                            {editProveedorId && (
                                <button type="button" onClick={limpiarProveedor} className="px-4 py-3 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                                    <X size={20} />
                                </button>
                            )}
                        </form>

                        <ul className="divide-y divide-slate-100">
                            {proveedores.map(p => (
                                <li key={p.id_proveedor} className={`p-4 flex items-center justify-between hover:bg-slate-50 ${editProveedorId === p.id_proveedor ? 'bg-amber-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <Truck className="text-slate-400" size={20} />
                                        <span className="font-medium text-slate-700">{p.nombre}</span>
                                    </div>
                                    <button 
                                        onClick={() => cargarEdicionProveedor(p)}
                                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-white rounded transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfiguracionPage;