const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
    try {
        const { error } = await supabase
            .from('jarvis_memory')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') {
            console.log('Creating jarvis_memory table...');
            
            const { error: createError } = await supabase.rpc('create_memory_table');
            if (createError) {
                console.log('Table might already exist or need manual creation');
            }
        }
        
        console.log('✅ Database connection established');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

async function storeMemory(userId, category, information) {
    try {
        const { data, error } = await supabase
            .from('jarvis_memory')
            .upsert({
                user_id: userId,
                category: category,
                information: information,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,category'
            });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Store memory error:', error);
        return { success: false, error: error.message };
    }
}

async function getMemory(userId, category) {
    try {
        const { data, error } = await supabase
            .from('jarvis_memory')
            .select('*')
            .eq('user_id', userId)
            .eq('category', category)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get memory error:', error);
        return { success: false, error: error.message };
    }
}

async function getAllMemories(userId) {
    try {
        const { data, error } = await supabase
            .from('jarvis_memory')
            .select('*')
            .eq('user_id', userId)
            .order('category');
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get all memories error:', error);
        return { success: false, error: error.message };
    }
}

async function deleteMemory(userId, category) {
    try {
        const { error } = await supabase
            .from('jarvis_memory')
            .delete()
            .eq('user_id', userId)
            .eq('category', category);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Delete memory error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    initializeDatabase,
    storeMemory,
    getMemory,
    getAllMemories,
    deleteMemory
};