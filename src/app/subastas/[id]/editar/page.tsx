import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditarSubastaForm from "./EditarSubastaForm";

export default async function EditarSubastaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: auction } = await supabase.from("subastas").select("*").eq("id", id).single();
  if (!auction) notFound();
  if (auction.vendedor_id !== user.id) redirect("/");

  const { count } = await supabase.from("pujas").select("*", { count: "exact", head: true }).eq("subasta_id", id);
  const tienePujas = count ? count > 0 : false;

  return <EditarSubastaForm subasta={auction} tienePujas={tienePujas} />;
}
