
import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { BookOpen, Calendar, Award, Clock, User } from 'lucide-react';
import axios from '../lib/axios';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const MahasiswaDashboard = () => {
    const { user } = useAuthStore();
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get('/mk-aktif/my');
                setMyCourses(res.data);
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const totalSKS = myCourses.reduce((acc, curr) => acc + (curr.mata_kuliah?.sks || 0), 0);

    const stats = [
        { title: 'Total Mata Kuliah', value: myCourses.length, icon: BookOpen, color: 'bg-blue-500' },
        { title: 'SKS Diambil', value: totalSKS, icon: Award, color: 'bg-green-500' },
        { title: 'Kehadiran', value: '-', icon: Clock, color: 'bg-purple-500' }, // Placeholder
        { title: 'Semester', value: user?.semester || '-', icon: Calendar, color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dashboard Mahasiswa
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Selamat datang kembali, {user?.nama_lengkap || 'Mahasiswa'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Mata Kuliah Semester Ini
                    </h2>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-center text-gray-500 py-4">Memuat data...</p>
                        ) : myCourses.length > 0 ? (
                            myCourses.map((mk) => (
                                <div key={mk.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {mk.mata_kuliah?.nama_mk || 'Unknown Course'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                                {mk.mata_kuliah?.kode_mk}
                                            </span>
                                            <span>• {mk.mata_kuliah?.sks} SKS</span>
                                        </p>
                                    </div>
                                    {mk.dosen_pengampu && (
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dosen Pengampu</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <User className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    {mk.dosen_pengampu.nama_lengkap}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">Belum ada mata kuliah aktif untuk Anda semester ini.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Pengumuman Akademik
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-lg">
                            <h3 className="font-medium text-blue-900 dark:text-blue-300">Pengisian KRS Semester Genap</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                Pengisian KRS untuk semester genap akan dimulai pada tanggal 20 Februari 2026.
                            </p>
                        </div>
                        {/* Placeholder for now */}
                        <div className="p-4 border border-green-100 bg-green-50 dark:bg-green-900/10 dark:border-green-800 rounded-lg">
                            <h3 className="font-medium text-green-900 dark:text-green-300">Jadwal UTS</h3>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                Jadwal Ujian Tengah Semester telah dipublikasikan. Silakan cek di menu Jadwal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MahasiswaDashboard;
