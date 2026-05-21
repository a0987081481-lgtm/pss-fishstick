import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotifyRequest = {
  type: "site_created";
  site: {
    id: string;
    name: string;
    code: string;
    created_at?: string;
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const accessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    const groupId = Deno.env.get("LINE_GROUP_ID");

    if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase environment variables.");
    if (!accessToken) throw new Error("缺少 LINE_CHANNEL_ACCESS_TOKEN。");
    if (!groupId) throw new Error("缺少 LINE_GROUP_ID。");

    const authHeader = request.headers.get("Authorization") || "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return json({ error: "未登入或登入已失效。" }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, role, active")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile?.active || !["admin", "editor"].includes(profile.role)) {
      return json({ error: "沒有 LINE 通知權限。" }, 403);
    }

    const body = (await request.json()) as NotifyRequest;
    if (body.type !== "site_created") throw new Error("不支援的通知類型。");
    if (!body.site?.id || !body.site?.name || !body.site?.code) throw new Error("缺少場地資料。");

    const createdAt = body.site.created_at ? new Date(body.site.created_at) : new Date();
    const message = [
      "新增場地通知",
      "",
      `場地代號：${body.site.code}`,
      `場地名稱：${body.site.name}`,
      `建立者：${profile.name || user.email || "未命名使用者"}`,
      `建立時間：${formatTaipeiTime(createdAt)}`,
      "",
      "請至場地資料系統查看",
      "https://pssparking.netlify.app/",
    ].join("\n");

    const response = await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: groupId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!response.ok) throw new Error(`LINE push failed: ${await response.text()}`);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});

function formatTaipeiTime(date: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
