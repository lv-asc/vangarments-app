// @ts-nocheck
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { useNotifications } from '@/contexts/NotificationContext';
import { BellIcon } from '@heroicons/react/24/outline';

export function NotificationPreferences() {
    const { user, updateProfile } = useAuth();
    const { notificationPreferences: badgePreferences, updatePreferences: updateBadgePreferences } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [notifications, setNotifications] = useState({
        newFollowers: user?.preferences?.notifications?.newFollowers ?? true,
        likes: user?.preferences?.notifications?.likes ?? true,
        comments: user?.preferences?.notifications?.comments ?? true,
        mentions: user?.preferences?.notifications?.mentions ?? true,
        marketplaceActivity: user?.preferences?.notifications?.marketplaceActivity ?? true,
        outfitSuggestions: user?.preferences?.notifications?.outfitSuggestions ?? false,
        trendAlerts: user?.preferences?.notifications?.trendAlerts ?? false,
        priceDrops: user?.preferences?.notifications?.priceDrops ?? true,
        weeklyDigest: user?.preferences?.notifications?.weeklyDigest ?? true
    });

    const [badgeSettings, setBadgeSettings] = useState({
        showNotificationBadge: badgePreferences.showNotificationBadge,
        showMessageBadge: badgePreferences.showMessageBadge
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');

        try {
            // Update notification preferences
            await updateProfile({
                preferences: {
                    ...user?.preferences,
                    notifications
                }
            });

            // Update badge preferences
            await updateBadgePreferences(badgeSettings);

            setSuccessMessage('Notification preferences saved successfully!');
            setTimeout(() => setSuccessMessage(' '), 3000);
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const notificationSettings = [
        { key: 'newFollowers', label: 'Novos Seguidores', description: 'Quando alguém começar a te seguir' },
        { key: 'likes', label: 'Curtidas', description: 'Quando alguém curtir seus posts' },
        { key: 'comments', label: 'Comentários', description: 'Quando alguém comentar em seus posts' },
        { key: 'mentions', label: 'Menções', description: 'Quando alguém te mencionar' },
        { key: 'marketplaceActivity', label: 'Atividade do Marketplace', description: 'Vendas, compras e ofertas' },
        { key: 'outfitSuggestions', label: 'Sugestões de Looks', description: 'Recomendações personalizadas de outfits' },
        { key: 'trendAlerts', label: 'Alertas de Tendências', description: 'Novas tendências baseadas no seu estilo' },
        { key: 'priceDrops', label: 'Quedas de Preço', description: 'Quando itens da sua wishlist ficarem mais baratos' },
        { key: 'weeklyDigest', label: 'Resumo Semanal', description: 'Resumo das suas atividades e estatísticas' }
    ];

    return (
        <div className="bg-white rounded-lg">
            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
                    {successMessage}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Badge Display Settings */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900">Badge Display</h3>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                            <div className="font-medium text-blue-900">Show Notification Badge</div>
                            <div className="text-sm text-blue-700">Display unread notification count on bell icon</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={badgeSettings.showNotificationBadge}
                            onChange={(e) => setBadgeSettings({
                                ...badgeSettings,
                                showNotificationBadge: e.target.checked
                            })}
                            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                            <div className="font-medium text-blue-900">Show Message Badge</div>
                            <div className="text-sm text-blue-700">Display unread message count on DMs icon</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={badgeSettings.showMessageBadge}
                            onChange={(e) => setBadgeSettings({
                                ...badgeSettings,
                                showMessageBadge: e.target.checked
                            })}
                            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900">Notification Types</h3>
                    {notificationSettings.map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div>
                                <div className="font-medium text-gray-900">{notification.label}</div>
                                <div className="text-sm text-gray-600">{notification.description}</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications[notification.key as keyof typeof notifications]}
                                onChange={(e) => setNotifications({
                                    ...notifications,
                                    [notification.key]: e.target.checked
                                })}
                                className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
