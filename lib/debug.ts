export const debug = {
    log: (area: string, message: string, data?: any) => {
        console.log(`🔍 [${area}] ${message}`, data || '');
    },

    error: (area: string, message: string, error?: any) => {
        console.error(`❌ [${area}] ${message}`, error || '');
        if (error?.stack) console.error(error.stack);
    },

    success: (area: string, message: string, data?: any) => {
        console.log(`✅ [${area}] ${message}`, data || '');
    },

    table: (area: string, data: any[]) => {
        console.log(`📊 [${area}] Table:`);
        console.table(data);
    }
};
