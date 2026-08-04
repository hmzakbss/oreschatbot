import { redirect } from "next/navigation";
import { ChatShell } from "@/components/chat/ChatShell";
import { createClient } from "@/lib/supabase/server";

export default async function SohbetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris?next=/sohbet");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <ChatShell
      email={user.email ?? null}
      initialConversations={conversations ?? []}
    />
  );
}
