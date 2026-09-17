import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try inserting with camelCase columns (how the app does it)
  console.log("=== Test insert with camelCase columns ===");
  const { data: d1, error: e1 } = await supabase
    .from("notes")
    .insert({
      userId: "test-user-123",
      title: "Test Note",
      finalContent: "Hello world",
      inputMethod: "TYPED",
    })
    .select()
    .single();
  console.log("camelCase insert error:", e1 ? JSON.stringify(e1) : "none");
  console.log("camelCase insert data:", d1);

  // Try inserting with snake_case columns
  console.log("\n=== Test insert with snake_case columns ===");
  const { data: d2, error: e2 } = await supabase
    .from("notes")
    .insert({
      user_id: "test-user-123",
      title: "Test Note Snake",
      final_content: "Hello world snake",
      input_method: "TYPED",
    })
    .select()
    .single();
  console.log("snake_case insert error:", e2 ? JSON.stringify(e2) : "none");
  console.log("snake_case insert data:", d2);

  // Clean up test rows
  if (d1?.id) {
    await supabase.from("notes").delete().eq("id", d1.id);
    console.log("\nCleaned up camelCase test row");
  }
  if (d2?.id) {
    await supabase.from("notes").delete().eq("id", d2.id);
    console.log("Cleaned up snake_case test row");
  }
}

run();
