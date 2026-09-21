const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://brabreqaarmuowymfnkl.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RA90Oh1sjnf8bfdBZo4B-A_WS7852S_';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
