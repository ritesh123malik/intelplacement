import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage() {
    // Try to get user from the server or just let the client handle auth
    return (
        <div className="min-h-screen bg-bg py-10">
            <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
                {/* We can pass userId dynamically on the client, but for simplicity let the client KanbanBoard fetch the user session */}
                {/* Wait, the props needs userId. Let's make this page client side */}
                <ApplicationsClient />
            </div>
        </div>
    );
}
