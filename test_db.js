const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  let { error } = await supabase.from('profiles').select('last_active').limit(1);
  console.log('last_active error:', error);
  
  ({ error } = await supabase.from('profiles').select('last_lat').limit(1));
  console.log('last_lat error:', error);
}
test();
