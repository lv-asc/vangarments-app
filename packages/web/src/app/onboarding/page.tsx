'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CPFInput } from '@/components/ui/CPFInput';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNavigation } from '@/hooks/useNavigation';
import { formatPhone } from '@/lib/masks';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

function OnboardingContent() {
    const searchParams = useSearchParams();
    const { user, updateProfile, refreshAuth } = useAuth();
    const { navigate } = useNavigation();

    const [formData, setFormData] = useState({
        cpf: '',
        telephone: '',
        birthDate: '',
        gender: 'prefer-not-to-say',
        genderOther: '',
        bodyType: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Manually set token if it came through query params
            Cookies.set('auth_token', token, { expires: 7 });
            localStorage.setItem('auth_token', token);
            refreshAuth();
        }
    }, [searchParams, refreshAuth]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCPFChange = (cpf: string) => {
        setFormData(prev => ({
            ...prev,
            cpf
        }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData(prev => ({
            ...prev,
            telephone: formatted
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile({
                cpf: formData.cpf,
                personalInfo: {
                    ...user?.personalInfo,
                    birthDate: new Date(formData.birthDate),
                    gender: formData.gender as any,
                    genderOther: formData.genderOther,
                    avatarUrl: user?.personalInfo?.avatarUrl,
                    telephone: formData.telephone,
                }
            });
            toast.success('Perfil completado com sucesso!');
            navigate('/wardrobe');
        } catch (error) {
            console.error('Onboarding update failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-[#00132d]/10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#00132d] mb-2">Bem-vinda ao Vangarments!</h1>
                    <p className="text-[#00132d]/70">
                        Falta pouco! Precisamos de mais alguns detalhes para completar seu cadastro.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                        <CPFInput
                            value={formData.cpf}
                            onChange={handleCPFChange}
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                        <input
                            type="tel"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handlePhoneChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d]/20 outline-none"
                            placeholder="(00) 00000-0000"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d]/20 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00132d]/20 outline-none appearance-none bg-white"
                        >
                            <option value="female">Feminino</option>
                            <option value="male">Masculino</option>
                            <option value="non-binary">Não-binário</option>
                            <option value="prefer-not-to-say">Prefiro não dizer</option>
                        </select>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#00132d] text-[#fff7d7] py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
                    >
                        {isLoading ? 'Salvando...' : 'Completar Cadastro'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fff7d7] flex items-center justify-center font-bold text-[#00132d]">Carregando...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
