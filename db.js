const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://brabreqaarmuowymfnkl.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RA90Oh1sjnf8bfdBZo4B-A_WS7852S_';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('Testing Supabase Connection...');
  const { data, error } = await supabase
    .from('users') // Replace 'your_table' with 'users'
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data from Supabase:', error.message);
  } else {
    console.log('Successfully connected to Supabase! Fetched data:', data);
  }
}

// Call the function to test the connection
testDatabaseConnection();

module.exports = { supabase };
