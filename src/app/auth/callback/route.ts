import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");

  // Open Redirect koruması: next parametresinin yalnızca iç yol (relative path) olduğunu doğrula
  let next = "/sohbet";
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    next = rawNext;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=auth_callback`);
}
