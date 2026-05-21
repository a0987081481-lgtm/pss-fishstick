const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ ok: true });
  }

  try {
    const bodyText = await request.text();
    const channelSecret = Deno.env.get("LINE_CHANNEL_SECRET");
    const signature = request.headers.get("x-line-signature") || "";

    if (channelSecret && !(await isValidLineSignature(bodyText, channelSecret, signature))) {
      return json({ error: "Invalid LINE signature." }, 401);
    }

    const body = JSON.parse(bodyText);
    const events = Array.isArray(body.events) ? body.events : [];

    for (const event of events) {
      const text = event?.message?.type === "text" ? String(event.message.text).trim() : "";
      const groupId = event?.source?.groupId;
      const replyToken = event?.replyToken;

      if (text === "取得群組ID" && groupId && replyToken) {
        await replyToLine(replyToken, `這個 LINE 群組 ID 是：\n${groupId}\n\n請把這段 groupId 存到 Supabase Secret：LINE_GROUP_ID`);
      }
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});

async function replyToLine(replyToken: string, text: string) {
  const accessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  if (!accessToken) return;

  const response = await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    throw new Error(`LINE reply failed: ${await response.text()}`);
  }
}

async function isValidLineSignature(bodyText: string, channelSecret: string, signature: string) {
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyText));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
