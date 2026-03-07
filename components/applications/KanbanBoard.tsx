// components/applications/KanbanBoard.tsx
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import {
    PlusIcon,
    BookmarkIcon,
    PaperAirplaneIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    TrophyIcon,
    XCircleIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface Application {
    id: string;
    company: string;
    position: string;
    location: string;
    application_status: string;
    applied_date: string;
    oa_deadline?: string;
    interview_date?: string;
    job_url?: string;
    notes?: string;
}

interface KanbanBoardProps {
    userId: string;
}

const columns = [
    { id: 'bookmarked', title: '📌 Bookmarked', icon: BookmarkIcon, color: 'gray' },
    { id: 'applied', title: '📨 Applied', icon: PaperAirplaneIcon, color: 'blue' },
    { id: 'oa_received', title: '📝 OA Received', icon: DocumentTextIcon, color: 'yellow' },
    { id: 'oa_completed', title: '✅ OA Completed', icon: DocumentTextIcon, color: 'green' },
    { id: 'interview_scheduled', title: '🤝 Interview', icon: ChatBubbleLeftRightIcon, color: 'purple' },
    { id: 'interview_completed', title: '🎯 Interview Done', icon: ChatBubbleLeftRightIcon, color: 'indigo' },
    { id: 'offer', title: '🎉 Offer', icon: TrophyIcon, color: 'green' },
    { id: 'rejected', title: '❌ Rejected', icon: XCircleIcon, color: 'red' }
];

export default function KanbanBoard({ userId }: KanbanBoardProps) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadApplications();
    }, [userId]);

    const loadApplications = async () => {
        const { data, error } = await supabase
            .from('job_applications')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (data) {
            setApplications(data);
        }
        setLoading(false);
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) return;

        // Update application status
        const { error } = await supabase
            .from('job_applications')
            .update({
                application_status: destination.droppableId,
                updated_at: new Date().toISOString()
            })
            .eq('id', draggableId);

        if (!error) {
            // Add activity log
            await supabase
                .from('application_activities')
                .insert({
                    application_id: draggableId,
                    activity_type: 'status_change',
                    description: `Moved from ${source.droppableId} to ${destination.droppableId}`
                });

            loadApplications();
        }
    };

    const deleteApplication = async (id: string) => {
        if (confirm('Are you sure you want to delete this application?')) {
            await supabase
                .from('job_applications')
                .delete()
                .eq('id', id);
            loadApplications();
        }
    };

    const getColumnApplications = (columnId: string) => {
        return applications
            .filter(app => app.application_status === columnId)
            .filter(app =>
                app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.position.toLowerCase().includes(searchTerm.toLowerCase())
            );
    };

    const columnIconColor: Record<string, string> = {
        bookmarked: 'text-gray-600',
        applied: 'text-primary-600',
        oa_received: 'text-amber-600',
        oa_completed: 'text-emerald-600',
        interview_scheduled: 'text-purple-600',
        interview_completed: 'text-indigo-600',
        offer: 'text-emerald-600',
        rejected: 'text-red-600',
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" role="status" aria-label="Loading" />
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-display font-bold text-gray-900">Application Tracker</h2>
                    <input
                        type="search"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl w-64 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        aria-label="Search applications"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 min-h-[44px]"
                >
                    <PlusIcon className="w-5 h-5" aria-hidden />
                    Add Application
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-6">
                    {columns.map((column) => {
                        const columnApps = getColumnApplications(column.id);
                        const Icon = column.icon;

                        return (
                            <div key={column.id} className="flex-shrink-0 w-80">
                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-full min-h-[280px]"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${columnIconColor[column.id] || 'text-gray-600'}`} aria-hidden />
                                                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                                </div>
                                                <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium text-gray-600">
                                                    {columnApps.length}
                                                </span>
                                            </div>

                                            <div className="space-y-3 min-h-[200px]">
                                                {columnApps.map((app, index) => (
                                                    <Draggable key={app.id} draggableId={app.id} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover transition border border-gray-200 text-gray-900"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-900">{app.company}</h4>
                                                                        <p className="text-sm text-gray-600">{app.position}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingApp(app)}
                                                                            className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                                            aria-label="Edit"
                                                                        >
                                                                            <PencilIcon className="w-4 h-4 text-gray-500" aria-hidden />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteApplication(app.id)}
                                                                            className="p-2 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                                            aria-label="Delete"
                                                                        >
                                                                            <TrashIcon className="w-4 h-4 text-red-600" aria-hidden />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <p className="text-xs text-gray-500 mb-2">{app.location}</p>

                                                                {app.applied_date && (
                                                                    <p className="text-xs text-gray-500">
                                                                        Applied: {new Date(app.applied_date).toLocaleDateString()}
                                                                    </p>
                                                                )}

                                                                {app.interview_date && (
                                                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                                                        Interview: {new Date(app.interview_date).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Add/Edit Modal */}
            {(showAddModal || editingApp) && (
                <ApplicationModal
                    application={editingApp}
                    userId={userId}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingApp(null);
                    }}
                    onSave={() => {
                        loadApplications();
                        setShowAddModal(false);
                        setEditingApp(null);
                    }}
                />
            )}
        </div>
    );
}

// Application Modal Component
function ApplicationModal({ application, userId, onClose, onSave }: any) {
    const [formData, setFormData] = useState({
        company: application?.company || '',
        position: application?.position || '',
        location: application?.location || '',
        job_url: application?.job_url || '',
        salary_min: application?.salary_min || '',
        salary_max: application?.salary_max || '',
        application_status: application?.application_status || 'bookmarked',
        applied_date: application?.applied_date || '',
        oa_deadline: application?.oa_deadline || '',
        interview_date: application?.interview_date || '',
        notes: application?.notes || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            ...formData,
            user_id: userId,
            updated_at: new Date().toISOString()
        };

        if (application) {
            await supabase
                .from('job_applications')
                .update(data)
                .eq('id', application.id);
        } else {
            await supabase
                .from('job_applications')
                .insert(data);
        }

        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-2xl font-display font-bold mb-4 text-gray-900">
                    {application ? 'Edit Application' : 'Add Application'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modal-company" className="block text-sm font-medium mb-1 text-gray-700">Company *</label>
                            <input
                                id="modal-company"
                                type="text"
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="modal-position" className="block text-sm font-medium mb-1 text-gray-700">Position *</label>
                            <input
                                id="modal-position"
                                type="text"
                                required
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modal-location" className="block text-sm font-medium mb-1 text-gray-700">Location</label>
                            <input
                                id="modal-location"
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="e.g., Bangalore"
                            />
                        </div>
                        <div>
                            <label htmlFor="modal-job_url" className="block text-sm font-medium mb-1 text-gray-700">Job URL</label>
                            <input
                                id="modal-job_url"
                                type="url"
                                value={formData.job_url}
                                onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modal-salary_min" className="block text-sm font-medium mb-1 text-gray-700">Min Salary (₹)</label>
                            <input
                                id="modal-salary_min"
                                type="number"
                                value={formData.salary_min}
                                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="modal-salary_max" className="block text-sm font-medium mb-1 text-gray-700">Max Salary (₹)</label>
                            <input
                                id="modal-salary_max"
                                type="number"
                                value={formData.salary_max}
                                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modal-status" className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                            <select
                                id="modal-status"
                                value={formData.application_status}
                                onChange={(e) => setFormData({ ...formData, application_status: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="bookmarked">📌 Bookmarked</option>
                                <option value="applied">📨 Applied</option>
                                <option value="oa_received">📝 OA Received</option>
                                <option value="oa_completed">✅ OA Completed</option>
                                <option value="interview_scheduled">🤝 Interview Scheduled</option>
                                <option value="interview_completed">🎯 Interview Completed</option>
                                <option value="offer">🎉 Offer</option>
                                <option value="rejected">❌ Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="modal-applied_date" className="block text-sm font-medium mb-1 text-gray-700">Applied Date</label>
                            <input
                                id="modal-applied_date"
                                type="date"
                                value={formData.applied_date}
                                onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="modal-oa_deadline" className="block text-sm font-medium mb-1 text-gray-700">OA Deadline</label>
                            <input
                                id="modal-oa_deadline"
                                type="date"
                                value={formData.oa_deadline}
                                onChange={(e) => setFormData({ ...formData, oa_deadline: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="modal-interview_date" className="block text-sm font-medium mb-1 text-gray-700">Interview Date</label>
                            <input
                                id="modal-interview_date"
                                type="datetime-local"
                                value={formData.interview_date}
                                onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="modal-notes" className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                        <textarea
                            id="modal-notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Add any notes about this application..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                        <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary px-6 py-2.5">
                            {application ? 'Update' : 'Add'} Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
