// @ts-nocheck
'use client';

import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  FlagIcon,
  EyeSlashIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PhotoIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface ContentReport {
  id: string;
  reportedBy: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  reportedContent: {
    id: string;
    type: 'post' | 'comment' | 'user';
    content: any;
    author: {
      id: string;
      name: string;
      profilePicture?: string;
    };
  };
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
}

type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fake_account'
  | 'copyright'
  | 'violence'
  | 'hate_speech'
  | 'nudity'
  | 'misinformation'
  | 'other';

interface ContentModerationPanelProps {
  onReportAction: (reportId: string, action: 'approve' | 'remove' | 'warn' | 'dismiss') => Promise<void>;
}

export function ContentModerationPanel({ onReportAction }: ContentModerationPanelProps) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const mockReports: ContentReport[] = [
    {
      id: '1',
      reportedBy: {
        id: 'user1',
        name: 'Ana Silva',
        profilePicture: '/api/placeholder/40/40'
      },
      reportedContent: {
        id: 'post1',
        type: 'post',
        content: {
          title: 'Look controverso',
          description: 'Conteúdo potencialmente inapropriado...',
          imageUrls: ['/api/placeholder/300/400']
        },
        author: {
          id: 'user2',
          name: 'Usuário Reportado',
          profilePicture: '/api/placeholder/40/40'
        }
      },
      reason: 'inappropriate_content',
      description: 'Este post contém conteúdo que pode ser considerado inapropriado para a plataforma.',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      reportedBy: {
        id: 'user3',
        name: 'Maria Santos',
        profilePicture: '/api/placeholder/40/40'
      },
      reportedContent: {
        id: 'comment1',
        type: 'comment',
        content: {
          text: 'Comentário ofensivo sobre o look da usuária...'
        },
        author: {
          id: 'user4',
          name: 'Comentarista',
          profilePicture: '/api/placeholder/40/40'
        }
      },
      reason: 'harassment',
      description: 'Comentário com linguagem ofensiva e assédio.',
      status: 'reviewing',
      priority: 'high',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];

  const reasonLabels: Record<ReportReason, string> = {
    inappropriate_content: 'Conteúdo Inapropriado',
    harassment: 'Assédio',
    spam: 'Spam',
    fake_account: 'Conta Falsa',
    copyright: 'Violação de Direitos Autorais',
    violence: 'Violência',
    hate_speech: 'Discurso de Ódio',
    nudity: 'Nudez',
    misinformation: 'Desinformação',
    other: 'Outro'
  };

  const statusLabels = {
    pending: 'Pendente',
    reviewing: 'Em Análise',
    resolved: 'Resolvido',
    dismissed: 'Descartado'
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800'
  };

  const handleAction = async (reportId: string, action: 'approve' | 'remove' | 'warn' | 'dismiss') => {
    setLoading(true);
    try {
      await onReportAction(reportId, action);

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? {
            ...report,
            status: action === 'dismiss' ? 'dismissed' : 'resolved',
            reviewedAt: new Date().toISOString(),
            resolution: action
          }
          : report
      ));

      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to process report action:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = mockReports.filter(report => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterPriority !== 'all' && report.priority !== filterPriority) return false;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Moderação de Conteúdo
        </h1>
        <p className="text-gray-600">
          Gerencie relatórios e mantenha a comunidade segura
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockReports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alta Prioridade</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mockReports.filter(r => r.priority === 'high' || r.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolvidos Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <FlagIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
              <p className="text-2xl font-semibold text-gray-900">{mockReports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="reviewing">Em Análise</option>
              <option value="resolved">Resolvido</option>
              <option value="dismissed">Descartado</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Relatórios ({filteredReports.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${selectedReport?.id === report.id ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={report.reportedBy.profilePicture || '/api/placeholder/32/32'}
                        alt={report.reportedBy.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.reportedBy.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(report.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[report.priority]}`}>
                        {priorityLabels[report.priority]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {reasonLabels[report.reason]}
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {report.reportedContent.type === 'post' && <PhotoIcon className="h-4 w-4" />}
                    {report.reportedContent.type === 'comment' && <ChatBubbleLeftIcon className="h-4 w-4" />}
                    {report.reportedContent.type === 'user' && <UserIcon className="h-4 w-4" />}
                    <span>
                      {report.reportedContent.type === 'post' ? 'Post' :
                        report.reportedContent.type === 'comment' ? 'Comentário' : 'Usuário'}
                      de {report.reportedContent.author.name}
                    </span>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="p-12 text-center">
                  <FlagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum relatório encontrado
                  </h3>
                  <p className="text-gray-500">
                    Não há relatórios que correspondam aos filtros selecionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="lg:col-span-1">
          {selectedReport ? (
            <div className="bg-white rounded-lg border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes do Relatório
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Reporter Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Reportado por</h4>
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedReport.reportedBy.profilePicture || '/api/placeholder/40/40'}
                      alt={selectedReport.reportedBy.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedReport.reportedBy.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimeAgo(selectedReport.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reported Content */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Conteúdo Reportado</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={selectedReport.reportedContent.author.profilePicture || '/api/placeholder/32/32'}
                        alt={selectedReport.reportedContent.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedReport.reportedContent.author.name}
                      </span>
                    </div>

                    {selectedReport.reportedContent.type === 'post' && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {selectedReport.reportedContent.content.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {selectedReport.reportedContent.content.description}
                        </p>
                        {selectedReport.reportedContent.content.imageUrls?.[0] && (
                          <img
                            src={selectedReport.reportedContent.content.imageUrls[0]}
                            alt="Conteúdo reportado"
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    )}

                    {selectedReport.reportedContent.type === 'comment' && (
                      <p className="text-sm text-gray-700">
                        {selectedReport.reportedContent.content.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Report Reason */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Motivo</h4>
                  <p className="text-sm text-gray-900 mb-2">
                    {reasonLabels[selectedReport.reason]}
                  </p>
                  {selectedReport.description && (
                    <p className="text-sm text-gray-600">
                      {selectedReport.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {selectedReport.status === 'pending' || selectedReport.status === 'reviewing' ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Ações</h4>

                    <button
                      onClick={() => handleAction(selectedReport.id, 'dismiss')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      <span>Descartar</span>
                    </button>

                    <button
                      onClick={() => handleAction(selectedReport.id, 'warn')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>Advertir Usuário</span>
                    </button>

                    <button
                      onClick={() => handleAction(selectedReport.id, 'remove')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Remover Conteúdo</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-gray-900">
                        Relatório {selectedReport.status === 'resolved' ? 'resolvido' : 'descartado'}
                      </span>
                    </div>
                    {selectedReport.reviewedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(selectedReport.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FlagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione um relatório
              </h3>
              <p className="text-gray-500">
                Clique em um relatório da lista para ver os detalhes e tomar ações.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}