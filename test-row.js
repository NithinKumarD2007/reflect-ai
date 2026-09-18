import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from("notes").select("*").limit(1);
  console.log("Error:", error);
  console.log("Raw Row Data:", data ? data[0] : null);
}
run();
