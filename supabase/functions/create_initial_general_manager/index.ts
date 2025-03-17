import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if a general manager already exists
    const { data: existingGM, error: gmError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "general_manager");

    if (gmError) throw gmError;
    if (existingGM && existingGM.length > 0) {
      return new Response(
        JSON.stringify({ error: "A general manager already exists" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get request body
    const { password, full_name, branch_id } = await req.json();

    if (!password || !full_name || !branch_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Create the general manager user in auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: "yousufabdallah2000@gmail.com",
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name,
          role: "general_manager",
        },
      });

    if (authError) throw authError;
    if (!authUser.user) throw new Error("Failed to create auth user");

    // Create the general manager in public.users
    const { data: publicUser, error: publicError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        full_name: full_name,
        email: "yousufabdallah2000@gmail.com",
        role: "general_manager",
        branch_id: branch_id,
      })
      .select()
      .single();

    if (publicError) throw publicError;

    return new Response(JSON.stringify({ success: true, user: publicUser }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
