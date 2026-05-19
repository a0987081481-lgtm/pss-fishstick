import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "admin" | "editor" | "viewer";

type AdminRequest = {
  action: "create" | "update" | "delete";
  payload: {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    active?: boolean;
  };
};

const SUPER_ADMIN_EMAIL = "a0987081481@gmail.com";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const authHeader = request.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "未登入或登入已失效。" }, 401);
    }

    const { data: caller, error: callerError } = await adminClient
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();

    if (callerError || caller?.role !== "admin" || caller?.active !== true) {
      return json({ error: "只有管理者可以管理使用者。" }, 403);
    }

    const body = (await request.json()) as AdminRequest;
    const { action, payload } = body;

    if (action === "create") {
      assertProfilePayload(payload, true);
      if (payload.email === SUPER_ADMIN_EMAIL) {
        throw new Error("最高權限帳號不可由前台建立或修改。");
      }

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { name: payload.name },
      });

      if (createError) throw createError;

      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: created.user.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        active: payload.active ?? true,
      });

      if (profileError) throw profileError;
      return json({ userId: created.user.id });
    }

    if (action === "update") {
      assertProfilePayload(payload, false);
      await assertNotSuperAdmin(adminClient, payload.id!);

      const authUpdate: Record<string, unknown> = {
        email: payload.email,
        user_metadata: { name: payload.name },
      };

      if (payload.password) {
        authUpdate.password = payload.password;
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(payload.id!, authUpdate);
      if (authError) throw authError;

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          active: payload.active ?? true,
        })
        .eq("id", payload.id);

      if (profileError) throw profileError;
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!payload.id) throw new Error("缺少使用者 id。");
      if (payload.id === user.id) throw new Error("不能移除目前登入中的管理者帳號。");
      await assertNotSuperAdmin(adminClient, payload.id);

      await adminClient.from("profiles").update({ active: false }).eq("id", payload.id);

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(payload.id);
      if (deleteError) throw deleteError;

      return json({ ok: true });
    }

    return json({ error: "不支援的操作。" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});

function assertProfilePayload(payload: AdminRequest["payload"], requirePassword: boolean) {
  if (!payload.name?.trim()) throw new Error("請輸入名稱。");
  if (!payload.email?.trim()) throw new Error("請輸入 Email。");
  if (!payload.role || !["admin", "editor", "viewer"].includes(payload.role)) {
    throw new Error("角色不正確。");
  }
  if (!payload.id && !requirePassword) throw new Error("缺少使用者 id。");
  if (requirePassword && !payload.password) throw new Error("新增使用者需要初始密碼。");
}

async function assertNotSuperAdmin(adminClient: ReturnType<typeof createClient>, id: string) {
  const { data, error } = await adminClient.from("profiles").select("email").eq("id", id).single();
  if (error) throw error;
  if (data?.email === SUPER_ADMIN_EMAIL) {
    throw new Error("最高權限帳號不可由前台修改或移除。");
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
